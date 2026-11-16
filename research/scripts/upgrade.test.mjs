#!/usr/bin/env node
/**
 * upgrade.test.mjs — dependency-free tests for upgrade.mjs.
 *
 * Fixtures are verbatim copies of four real deltas, plus three pin variants
 * derived from the ICSE delta. Every scenario is run twice from independent
 * temp repos; the exit status, stdout, stderr and resulting delta must be
 * identical. A separate test asserts idempotence on one repo.
 *
 *   node research/scripts/upgrade.test.mjs
 *
 * No npm dependencies. Node 18+.
 */
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  rmSync,
  copyFileSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

const HERE = dirname(fileURLToPath(import.meta.url));
const UPGRADE = resolve(HERE, 'upgrade.mjs');
const FIXTURES = resolve(HERE, 'fixtures', 'upgrade');
const TEMPLATE = resolve(HERE, '..', 'templates', 'research-delta-template.md');
const VERSION = readFileSync(resolve(HERE, '..', '..', 'VERSION'), 'utf8').trim();
const PIN = /(agentic-research[ \t]*(?:\|[ \t]*)?v)(\d+\.\d+(?:\.\d+)?)/i;

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

function write(dir, rel, content = '') {
  const abs = join(dir, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

function cleanup(dir) {
  rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------- */
/* Fixture reading and the independent expected-change parser                */
/* ------------------------------------------------------------------------- */

const clean = (s) => s
  .trim()
  .replace(/^\*\*|\*\*$/g, '')
  .replace(/^`+|`+$/g, '')
  .trim();

const norm = (s) => s.trim().toLowerCase().replace(/\s+/g, ' ');

function rowCells(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

function isSeparator(line) {
  const t = line.trim();
  return t.startsWith('|') && /^[\s|:-]+$/.test(t) && t.includes('-');
}

function findSections(lines) {
  const sections = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) {
      if (current) {
        current.end = i;
        current.lines = lines.slice(current.start, current.end);
        sections.push(current);
      }
      current = {
        heading: lines[i].replace(/^##\s+/, '').trim(),
        start: i,
        end: lines.length,
        lines: null,
      };
    }
  }
  if (current) {
    current.end = lines.length;
    current.lines = lines.slice(current.start, current.end);
    sections.push(current);
  }
  return sections;
}

function fieldRows(lines) {
  const rows = [];
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].trim().startsWith('|') || !isSeparator(lines[i + 1])) continue;
    const header = rowCells(lines[i]);
    const isField = header.some((cell) => clean(cell).toLowerCase() === 'field');
    let end = i + 2;
    while (end < lines.length && lines[end].trim().startsWith('|')) end++;
    if (isField) {
      for (let k = i + 2; k < end; k++) {
        const cells = rowCells(lines[k]);
        rows.push({
          key: clean(cells[0]),
          value: cells.slice(1).join(' | ').trim(),
        });
      }
    }
    i = end - 1;
  }
  return rows;
}

function expectedDeltaChanges(fixtureText) {
  const templateSections = findSections(readFileSync(TEMPLATE, 'utf8').split('\n'));
  const deltaSections = findSections(fixtureText.split('\n'));
  const changes = [];

  for (const delta of deltaSections) {
    const template = templateSections.find((s) => norm(s.heading) === norm(delta.heading));
    if (!template) continue;
    const present = new Set(fieldRows(delta.lines).map((r) => r.key.toLowerCase()));
    for (const row of fieldRows(template.lines)) {
      if (present.has(row.key.toLowerCase())) continue;
      changes.push({
        action: 'add-row',
        section: template.heading,
        field: row.key,
        value: row.value,
      });
    }
  }

  for (const template of templateSections) {
    if (deltaSections.some((d) => norm(d.heading) === norm(template.heading))) continue;
    changes.push({ action: 'add-section', section: template.heading });
    for (const row of fieldRows(template.lines)) {
      changes.push({
        action: 'add-row',
        section: template.heading,
        field: row.key,
        value: row.value,
      });
    }
  }

  return changes;
}

function deltaActions(changes) {
  return changes.filter((c) => ['add-section', 'add-table', 'add-row'].includes(c.action));
}

function scriptActions(changes) {
  return changes.filter((c) => ['add-script', 'update-script'].includes(c.action));
}

function versionActions(changes) {
  return changes.filter((c) => ['add-version', 'update-version'].includes(c.action));
}

/* ------------------------------------------------------------------------- */
/* Repo setup and execution                                                  */
/* ------------------------------------------------------------------------- */

function pluginScripts() {
  const templatesDir = resolve(HERE, '..', 'templates', 'scripts');
  const names = readdirSync(templatesDir).filter((name) => name !== '_paths.sh');
  return names.map((name) => ({ name, source: join(templatesDir, name) }))
    .concat({ name: 'research-checks.mjs', source: resolve(HERE, 'research-checks.mjs') })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function paperDirFromDelta(text) {
  const m = text.match(/^\s*\|\s*Paper Path\s*\|\s*`?([^`|]+?)`?\s*\|/im)
    || text.match(/^\s*\|\s*Paper Directory\s*\|\s*`?([^`|]+?)`?\s*\|/im);
  return m ? m[1].trim().replace(/\/+$/, '') : 'paper';
}

function makeRepo(fixtureName, { stale = [], missing = [], extra = {} } = {}) {
  const text = readFileSync(join(FIXTURES, fixtureName), 'utf8');
  const dir = mkdtempSync(join(tmpdir(), 'ar-upgrade-'));
  write(dir, 'docs/research-delta.md', text);

  const scriptsDir = join(paperDirFromDelta(text), 'scripts');
  mkdirSync(join(dir, scriptsDir), { recursive: true });

  for (const script of pluginScripts()) {
    const target = join(dir, scriptsDir, script.name);
    if (missing.includes(script.name)) continue;
    if (stale.includes(script.name)) {
      writeFileSync(target, `# stale ${script.name}\n`);
    } else {
      copyFileSync(script.source, target);
    }
  }
  write(dir, join(scriptsDir, '_paths.sh'),
    '#!/usr/bin/env bash\n# local _paths.sh — must be preserved\n');

  for (const [name, content] of Object.entries(extra)) {
    write(dir, join(scriptsDir, name), content);
  }

  return { dir, text };
}

function runUpgrade(dir, args = ['--dry-run', '--json']) {
  return spawnSync(process.execPath, [UPGRADE, '.', ...args], {
    encoding: 'utf8',
    cwd: dir,
  });
}

function scenario(fixtureName, args = ['--dry-run', '--json'], options = {}) {
  const { dir, text } = makeRepo(fixtureName, options);
  try {
    const res = runUpgrade(dir, args);
    const finalText = readFileSync(join(dir, 'docs', 'research-delta.md'), 'utf8');
    return { dir, text, res, finalText, data: parseJson(res.stdout) };
  } finally {
    cleanup(dir);
  }
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function twice(fn) {
  const first = fn();
  const second = fn();
  assert.equal(first.res.status, second.res.status, 'exit status differs across runs');
  assert.equal(first.res.stdout, second.res.stdout, 'stdout differs across runs');
  assert.equal(first.res.stderr, second.res.stderr, 'stderr differs across runs');
  assert.equal(first.finalText, second.finalText, 'resulting delta differs across runs');
  return first;
}

function assertPreserves(original, final) {
  const source = original.split('\n')
    .filter((line) => !PIN.test(line));
  const target = final.split('\n');
  let j = 0;
  for (const line of source) {
    while (j < target.length && target[j] !== line) j++;
    assert.ok(j < target.length, `original line was lost or reordered: ${line}`);
    j++;
  }
}

function assertNoDuplicateRows(text) {
  for (const section of findSections(text.split('\n'))) {
    const keys = fieldRows(section.lines).map((r) => r.key.toLowerCase());
    assert.equal(new Set(keys).size, keys.length,
      `duplicate field row in section ${section.heading}: ${keys.join(', ')}`);
  }
}

/* ------------------------------------------------------------------------- */
/* Real deltas: vX.Y.Z pin, exact change list, preservation                  */
/* ------------------------------------------------------------------------- */

const REAL_FIXTURES = [
  'saner2027-governed-agents.md',
  'icse2027-doctoral-symposium.md',
  'wsese2027-governed-research.md',
  'ai-empirical-se-chapter.md',
];

for (const fixture of REAL_FIXTURES) {
  test(`real v1.8.0 delta ${fixture}: exact changes, values preserved`, () => {
    const run = twice(() => scenario(fixture, ['--json']));
    assert.equal(run.res.status, 0, run.res.stderr);
    assert.ok(run.data, `no JSON: ${run.res.stderr}`);

    const expected = [
      ...expectedDeltaChanges(run.text),
      { action: 'update-version', from: '1.8.0', to: VERSION },
    ];
    assert.deepEqual(run.data.changes, expected);
    assert.deepEqual(scriptActions(run.data.changes), [],
      'fixture scripts are current, so no script should be touched');
    assertPreserves(run.text, run.finalText);
    assertNoDuplicateRows(run.finalText);

    const pin = run.finalText.match(PIN);
    assert.ok(pin, 'version pin missing after upgrade');
    assert.equal(pin[2], VERSION);
  });
}

/* ------------------------------------------------------------------------- */
/* Pin variants                                                              */
/* ------------------------------------------------------------------------- */

test('short vX.Y pin is recognised and updated', () => {
  const run = twice(() => scenario('pin-short-vX.Y.md', ['--json']));
  assert.equal(run.res.status, 0, run.res.stderr);
  assert.deepEqual(versionActions(run.data.changes),
    [{ action: 'update-version', from: '1.8', to: VERSION }]);
  assert.match(run.finalText, new RegExp(`Research: agentic-research v${VERSION.replace(/\./g, '\\.')}`));
});

test('pin written in a table row is recognised and updated', () => {
  const run = twice(() => scenario('pin-table-row.md', ['--json']));
  assert.equal(run.res.status, 0, run.res.stderr);
  assert.deepEqual(versionActions(run.data.changes),
    [{ action: 'update-version', from: '1.8.0', to: VERSION }]);
  assert.match(run.finalText,
    new RegExp(`\\| Research \\| agentic-research v${VERSION.replace(/\./g, '\\.')} \\|`));
});

test('delta with no pin gains one and says so', () => {
  const run = twice(() => scenario('pin-missing.md', ['--json']));
  assert.equal(run.res.status, 0, run.res.stderr);
  assert.deepEqual(versionActions(run.data.changes),
    [{ action: 'add-version', version: VERSION }]);
  const lines = run.finalText.split('\n');
  const added = lines.indexOf(`Research: agentic-research v${VERSION}`);
  const updated = lines.findIndex((line) => /^Last updated\s*:/i.test(line));
  assert.equal(added, updated + 1, 'added pin should follow Last updated');
});

/* ------------------------------------------------------------------------- */
/* Scripts                                                                   */
/* ------------------------------------------------------------------------- */

test('plugin scripts refreshed; _paths.sh and local scripts untouched', () => {
  const extra = {
    'page-check.sh': '#!/bin/sh\n# repo-local script\n',
  };
  const run = twice(() => {
    const { dir } = makeRepo('saner2027-governed-agents.md', {
      stale: ['build.sh', 'research-checks.mjs'],
      missing: ['arxiv-package.sh'],
      extra,
    });
    try {
      const res = runUpgrade(dir, ['--json']);
      return {
        res,
        data: parseJson(res.stdout),
        build: readFileSync(join(dir, 'paper', 'scripts', 'build.sh'), 'utf8'),
        checks: readFileSync(join(dir, 'paper', 'scripts', 'research-checks.mjs'), 'utf8'),
        paths: readFileSync(join(dir, 'paper', 'scripts', '_paths.sh'), 'utf8'),
        extra: readFileSync(join(dir, 'paper', 'scripts', 'page-check.sh'), 'utf8'),
        mode: statSync(join(dir, 'paper', 'scripts', 'build.sh')).mode & 0o777,
      };
    } finally {
      cleanup(dir);
    }
  });

  assert.equal(run.res.status, 0, run.res.stderr);
  assert.deepEqual(scriptActions(run.data.changes), [
    { action: 'add-script', path: 'paper/scripts/arxiv-package.sh' },
    { action: 'update-script', path: 'paper/scripts/build.sh' },
    { action: 'update-script', path: 'paper/scripts/research-checks.mjs' },
  ]);
  assert.equal(run.build, readFileSync(resolve(HERE, '..', 'templates', 'scripts', 'build.sh'), 'utf8'));
  assert.equal(run.checks, readFileSync(resolve(HERE, 'research-checks.mjs'), 'utf8'));
  assert.equal(run.paths, '#!/usr/bin/env bash\n# local _paths.sh — must be preserved\n');
  assert.equal(run.extra, extra['page-check.sh']);
  assert.equal(run.mode, 0o755, 'refreshed script should be executable');
});

/* ------------------------------------------------------------------------- */
/* Idempotence, exit codes, determinism                                      */
/* ------------------------------------------------------------------------- */

test('second run on the same repo reports no changes and writes nothing', () => {
  const { dir } = makeRepo('ai-empirical-se-chapter.md');
  try {
    const first = runUpgrade(dir, ['--json']);
    const afterFirst = readFileSync(join(dir, 'docs', 'research-delta.md'), 'utf8');
    const second = runUpgrade(dir, ['--json']);
    const afterSecond = readFileSync(join(dir, 'docs', 'research-delta.md'), 'utf8');

    assert.equal(first.status, 0, first.stderr);
    assert.equal(second.status, 0, second.stderr);
    assert.ok(parseJson(first.stdout).changes.length > 0, 'first run should change something');
    assert.deepEqual(parseJson(second.stdout).changes, []);
    assert.equal(afterFirst, afterSecond);
  } finally {
    cleanup(dir);
  }
});

test('missing delta exits 1', () => {
  const run = twice(() => {
    const dir = mkdtempSync(join(tmpdir(), 'ar-upgrade-missing-'));
    try {
      const res = runUpgrade(dir, ['--dry-run', '--json']);
      return { res };
    } finally {
      cleanup(dir);
    }
  });
  assert.equal(run.res.status, 1);
  assert.match(run.res.stderr, /docs\/research-delta\.md not found/);
});

test('missing path and unknown option exit 2', () => {
  for (const args of [[], ['--bogus'], ['a', 'b']]) {
    const run = twice(() => {
      const res = spawnSync(process.execPath, [UPGRADE, ...args], { encoding: 'utf8' });
      return { res };
    });
    assert.equal(run.res.status, 2, `args ${JSON.stringify(args)}`);
    assert.match(run.res.stderr, /usage: upgrade\.mjs/);
  }
});

test('every real fixture output is byte-identical on two independent runs', () => {
  for (const fixture of REAL_FIXTURES) {
    const run = twice(() => scenario(fixture, ['--dry-run', '--json']));
    assert.equal(run.res.status, 0, run.res.stderr);
  }
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
