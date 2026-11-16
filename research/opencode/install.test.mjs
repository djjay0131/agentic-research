#!/usr/bin/env node
/**
 * install.test.mjs — dependency-free tests for the OpenCode installer.
 *
 * Installs into a temp prefix, checks every generated skill, agent and command,
 * verifies the agent permission translation, then checks idempotence, dry-run,
 * and that uninstall removes exactly what the manifest owns. Every test is
 * deterministic, so two runs of this file produce identical output.
 *
 *   node research/opencode/install.test.mjs
 *
 * No npm dependencies. Node 18+.
 */
import {
  existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, readlinkSync,
  rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(HERE, '..');
const INSTALLER = join(HERE, 'install.mjs');
const VERSION = readFileSync(join(PLUGIN_ROOT, '..', 'VERSION'), 'utf8').trim();

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log(`ok   ${name}`);
    passed++;
  } catch (err) {
    console.log(`FAIL ${name}`);
    failures.push({ name, err });
    failed++;
  }
}

function tempPrefix() {
  return mkdtempSync(join(tmpdir(), 'research-opencode-'));
}

function cleanup(dir) {
  rmSync(dir, { recursive: true, force: true });
}

function run(args, prefix) {
  return spawnSync(process.execPath, [INSTALLER, '--prefix', prefix, ...args], {
    encoding: 'utf8',
  });
}

function sourceDescription(rel) {
  const text = readFileSync(join(PLUGIN_ROOT, rel), 'utf8');
  const match = text.match(/^description:\s*(.*)$/m);
  assert.ok(match, `${rel} has no description`);
  return match[1].trim();
}

function sourceTools(rel) {
  const text = readFileSync(join(PLUGIN_ROOT, rel), 'utf8');
  const match = text.match(/^allowed-tools:\s*(.*)$/m);
  return new Set((match ? match[1] : '').split(',').map((tool) => tool.trim()).filter(Boolean));
}

function unquote(value) {
  const v = value.trim();
  if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replaceAll("''", "'");
  if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1).replaceAll('\\"', '"');
  return v;
}

function parseFrontmatter(text, label) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  assert.ok(match, `${label}: missing frontmatter`);
  const root = {};
  const stack = [{ indent: -1, value: root }];

  for (const raw of match[1].split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const indent = raw.match(/^ */)[0].length;
    const line = raw.trim();
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].value;
    const colon = line.indexOf(':');
    assert.ok(colon > 0, `${label}: invalid frontmatter line: ${line}`);
    const key = unquote(line.slice(0, colon));
    const value = line.slice(colon + 1).trim();
    if (value === '') {
      const child = {};
      parent[key] = child;
      stack.push({ indent, value: child });
    } else {
      parent[key] = unquote(value);
    }
  }

  return root;
}

function sourceSkillNames() {
  return readdirSync(join(PLUGIN_ROOT, 'skills'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function sourceAgentNames() {
  return readdirSync(join(PLUGIN_ROOT, 'agents'))
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => entry.slice(0, -3))
    .sort();
}

const REVIEWERS = new Map([
  ['methods-reviewer', 'methods'],
  ['venue-reviewer', 'venue'],
  ['reader-reviewer', 'reader'],
]);

function expectedPermissions(name, tools) {
  const expected = {};
  const persona = REVIEWERS.get(name);
  if (persona) {
    expected.edit = {
      '*': 'deny',
      [`**/reviews/*/${persona}.md`]: 'allow',
      [`*/reviews/*/${persona}.md`]: 'allow',
    };
  } else if (!tools.has('Write') && !tools.has('Edit')) {
    expected.edit = 'deny';
  }
  if (!tools.has('Bash')) expected.bash = 'deny';
  if (!tools.has('WebFetch')) expected.webfetch = 'deny';
  return expected;
}

function walkFiles(dir, acc = []) {
  for (const name of readdirSync(dir).sort()) {
    const abs = join(dir, name);
    const stat = lstatSync(abs);
    if (stat.isDirectory() && !stat.isSymbolicLink()) walkFiles(abs, acc);
    else acc.push(abs);
  }
  return acc;
}

function snapshot(dir) {
  const result = {};
  for (const abs of walkFiles(dir)) {
    const rel = relative(dir, abs).split(sep).join('/');
    const stat = lstatSync(abs);
    result[rel] = stat.isSymbolicLink()
      ? { kind: 'symlink', target: readlinkSync(abs) }
      : { kind: 'file', content: readFileSync(abs, 'utf8'), mtimeMs: stat.mtimeMs };
  }
  return result;
}

/* ------------------------------------------------------------------------- */

test('install generates every skill with the research- name and substituted body', () => {
  const prefix = tempPrefix();
  try {
    const run1 = run([], prefix);
    assert.equal(run1.status, 0, run1.stderr);

    for (const name of sourceSkillNames()) {
      const rel = join('skills', `research-${name}`, 'SKILL.md');
      const abs = join(prefix, rel);
      assert.ok(existsSync(abs), `${rel} is missing`);
      const text = readFileSync(abs, 'utf8');
      const source = readFileSync(join(PLUGIN_ROOT, 'skills', name, 'SKILL.md'), 'utf8');
      const fm = parseFrontmatter(text, rel);
      assert.equal(fm.name, `research-${name}`);
      assert.equal(fm.description, sourceDescription(join('skills', name, 'SKILL.md')));
      assert.ok(!text.includes('${CLAUDE_PLUGIN_ROOT}'), `${rel} still has CLAUDE_PLUGIN_ROOT`);
      if (source.includes('${CLAUDE_PLUGIN_ROOT}')) {
        assert.ok(text.includes(PLUGIN_ROOT), `${rel} did not substitute the plugin root`);
      }
    }
  } finally { cleanup(prefix); }
});

test('install generates one command per skill that loads it and passes $ARGUMENTS', () => {
  const prefix = tempPrefix();
  try {
    const run1 = run([], prefix);
    assert.equal(run1.status, 0, run1.stderr);

    for (const name of sourceSkillNames()) {
      const rel = join('commands', `research-${name}.md`);
      const abs = join(prefix, rel);
      assert.ok(existsSync(abs), `${rel} is missing`);
      const text = readFileSync(abs, 'utf8');
      const fm = parseFrontmatter(text, rel);
      assert.equal(fm.description, sourceDescription(join('skills', name, 'SKILL.md')));
      assert.match(text, new RegExp(`research-${name}`));
      assert.match(text, /\$ARGUMENTS/);
    }
  } finally { cleanup(prefix); }
});

test('install translates every agent permission exactly per the design', () => {
  const prefix = tempPrefix();
  try {
    const run1 = run([], prefix);
    assert.equal(run1.status, 0, run1.stderr);

    for (const name of sourceAgentNames()) {
      const rel = join('agents', `research-${name}.md`);
      const abs = join(prefix, rel);
      assert.ok(existsSync(abs), `${rel} is missing`);
      const text = readFileSync(abs, 'utf8');
      const source = readFileSync(join(PLUGIN_ROOT, 'agents', `${name}.md`), 'utf8');
      const fm = parseFrontmatter(text, rel);

      assert.equal(fm.mode, 'subagent', `${rel}: mode`);
      assert.equal(fm.description, sourceDescription(join('agents', `${name}.md`)));
      assert.deepEqual(fm.permission ?? {}, expectedPermissions(name, sourceTools(join('agents', `${name}.md`))), `${rel}: permission`);
      assert.ok(!text.includes('${CLAUDE_PLUGIN_ROOT}'), `${rel} still has CLAUDE_PLUGIN_ROOT`);
      if (source.includes('${CLAUDE_PLUGIN_ROOT}')) {
        assert.ok(text.includes(PLUGIN_ROOT), `${rel} did not substitute the plugin root`);
      }
    }
  } finally { cleanup(prefix); }
});

test('no generated file still contains the Claude plugin root variable', () => {
  const prefix = tempPrefix();
  try {
    const run1 = run([], prefix);
    assert.equal(run1.status, 0, run1.stderr);
    for (const abs of walkFiles(prefix)) {
      if (lstatSync(abs).isSymbolicLink()) continue;
      const rel = relative(prefix, abs).split(sep).join('/');
      assert.ok(!readFileSync(abs, 'utf8').includes('${CLAUDE_PLUGIN_ROOT}'), `${rel} still has CLAUDE_PLUGIN_ROOT`);
    }
  } finally { cleanup(prefix); }
});

test('manifest lists every generated file and the plugin version', () => {
  const prefix = tempPrefix();
  try {
    const run1 = run([], prefix);
    assert.equal(run1.status, 0, run1.stderr);

    const manifest = JSON.parse(readFileSync(join(prefix, 'research-install.json'), 'utf8'));
    assert.equal(manifest.version, VERSION);
    assert.ok(Array.isArray(manifest.files));
    assert.deepEqual(manifest.files, [...manifest.files].sort());

    const expected = [
      ...sourceSkillNames().map((name) => join('skills', `research-${name}`, 'SKILL.md')),
      ...sourceAgentNames().map((name) => join('agents', `research-${name}.md`)),
      ...sourceSkillNames().map((name) => join('commands', `research-${name}.md`)),
    ].map((rel) => rel.split(sep).join('/')).sort();

    assert.deepEqual(manifest.files, expected);
    for (const rel of manifest.files) assert.ok(existsSync(join(prefix, rel)), `${rel} listed but missing`);
  } finally { cleanup(prefix); }
});

test('a second install changes nothing', () => {
  const prefix = tempPrefix();
  try {
    const first = run([], prefix);
    assert.equal(first.status, 0, first.stderr);
    const before = snapshot(prefix);

    const second = run([], prefix);
    assert.equal(second.status, 0, second.stderr);
    const after = snapshot(prefix);

    assert.deepEqual(after, before);
    assert.doesNotMatch(second.stdout, /^(write|link)\b/m);
  } finally { cleanup(prefix); }
});

test('--dry-run writes nothing and reports the install', () => {
  const prefix = tempPrefix();
  try {
    const result = run(['--dry-run'], prefix);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /would write/);
    assert.equal(readdirSync(prefix).length, 0);

    const real = run([], prefix);
    assert.equal(real.status, 0, real.stderr);
    assert.ok(existsSync(join(prefix, 'research-install.json')));
  } finally { cleanup(prefix); }
});

test('uninstall removes exactly the manifest files and leaves other files alone', () => {
  const prefix = tempPrefix();
  try {
    const installRun = run([], prefix);
    assert.equal(installRun.status, 0, installRun.stderr);
    const manifest = JSON.parse(readFileSync(join(prefix, 'research-install.json'), 'utf8'));

    writeFileSync(join(prefix, 'sentinel.txt'), 'keep me\n');
    writeFileSync(join(prefix, 'commands', 'user-command.md'), 'keep me too\n');
    writeFileSync(join(prefix, 'skills', 'user-skill.md'), 'keep this as well\n');

    const result = run(['--uninstall'], prefix);
    assert.equal(result.status, 0, result.stderr);

    for (const rel of manifest.files) assert.ok(!existsSync(join(prefix, rel)), `${rel} survived uninstall`);
    assert.ok(!existsSync(join(prefix, 'research-install.json')));
    assert.equal(readFileSync(join(prefix, 'sentinel.txt'), 'utf8'), 'keep me\n');
    assert.equal(readFileSync(join(prefix, 'commands', 'user-command.md'), 'utf8'), 'keep me too\n');
    assert.equal(readFileSync(join(prefix, 'skills', 'user-skill.md'), 'utf8'), 'keep this as well\n');

    const again = run(['--uninstall'], prefix);
    assert.equal(again.status, 0, again.stderr);
    assert.match(again.stdout, /nothing to uninstall/);
  } finally { cleanup(prefix); }
});

test('--uninstall --dry-run removes nothing', () => {
  const prefix = tempPrefix();
  try {
    const installRun = run([], prefix);
    assert.equal(installRun.status, 0, installRun.stderr);
    const before = snapshot(prefix);

    const result = run(['--uninstall', '--dry-run'], prefix);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /would remove/);
    assert.deepEqual(snapshot(prefix), before);
  } finally { cleanup(prefix); }
});

test('an unknown option exits 2', () => {
  const prefix = tempPrefix();
  try {
    const result = run(['--not-a-flag'], prefix);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /unknown option/);
  } finally { cleanup(prefix); }
});

/* ------------------------------------------------------------------------- */

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed) {
  for (const { name, err } of failures) {
    console.log(`--- ${name} ---`);
    console.log(err.stack || err.message || String(err));
  }
  process.exit(1);
}
