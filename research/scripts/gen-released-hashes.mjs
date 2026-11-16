#!/usr/bin/env node
/**
 * gen-released-hashes.mjs — regenerate RELEASED-HASHES.json.
 *
 *   node research/scripts/gen-released-hashes.mjs [--check]
 *
 * For every plugin-owned script, collect the sha256 of every version committed
 * to main (every commit touching that path), plus the current working-tree
 * copy. Writes research/templates/scripts/RELEASED-HASHES.json.
 *
 * --check exits 1 if the committed file differs from the generated output.
 *
 * Dependency-free. Node 18+. Requires git history for main (or origin/main).
 */
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(HERE, '..');
const REPO_ROOT = resolve(PLUGIN_ROOT, '..');
const TEMPLATES_DIR = join(PLUGIN_ROOT, 'templates', 'scripts');
const OUTPUT = join(TEMPLATES_DIR, 'RELEASED-HASHES.json');

function git(args, encoding = 'utf8') {
  const res = spawnSync('git', args, { cwd: REPO_ROOT, encoding });
  if (res.status !== 0) {
    const err = (res.stderr || '').toString().trim();
    throw new Error(`git ${args.join(' ')} failed${err ? `: ${err}` : ''}`);
  }
  return res.stdout;
}

function ensureFullHistory() {
  if (git(['rev-parse', '--is-shallow-repository']).trim() !== 'true') return;
  const res = spawnSync('git', ['fetch', '--unshallow'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  if (res.status !== 0) {
    const err = (res.stderr || '').trim();
    throw new Error(`git fetch --unshallow failed${err ? `: ${err}` : ''}`);
  }
}

function mainRef() {
  for (const ref of ['origin/main', 'main']) {
    const res = spawnSync('git', ['rev-parse', '--verify', '--quiet', ref], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    if (res.status === 0) return ref;
  }
  throw new Error('no main or origin/main ref; cannot read released history');
}

function pluginScripts() {
  const scripts = readdirSync(TEMPLATES_DIR)
    .filter((name) => name !== '_paths.sh' && name !== 'RELEASED-HASHES.json')
    .filter((name) => statSync(join(TEMPLATES_DIR, name)).isFile())
    .map((name) => ({
      name,
      repoPath: `research/templates/scripts/${name}`,
      worktree: join(TEMPLATES_DIR, name),
    }));
  scripts.push({
    name: 'research-checks.mjs',
    repoPath: 'research/scripts/research-checks.mjs',
    worktree: join(PLUGIN_ROOT, 'scripts', 'research-checks.mjs'),
  });
  return scripts.sort((a, b) => a.name.localeCompare(b.name));
}

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function releasedHashes(script, ref) {
  const commits = git(
    ['log', '--full-history', '--format=%H', ref, '--', script.repoPath]
  ).trim();
  const hashes = new Set();

  for (const commit of commits ? commits.split('\n') : []) {
    const blob = git(['show', `${commit}:${script.repoPath}`], null);
    hashes.add(sha256(blob));
  }

  hashes.add(sha256(readFileSync(script.worktree)));
  return [...hashes].sort();
}

function main() {
  const check = process.argv.slice(2).includes('--check');
  ensureFullHistory();
  const ref = mainRef();

  const output = {};
  for (const script of pluginScripts()) {
    output[script.name] = releasedHashes(script, ref);
  }
  const text = `${JSON.stringify(output, null, 2)}\n`;

  if (check) {
    const committed = readFileSync(OUTPUT, 'utf8');
    if (committed !== text) {
      process.stderr.write(
        'gen-released-hashes: RELEASED-HASHES.json is stale; rerun without --check\n'
      );
      process.exit(1);
    }
    process.stdout.write('gen-released-hashes: up to date\n');
    return;
  }

  writeFileSync(OUTPUT, text);
  process.stdout.write(`gen-released-hashes: wrote ${OUTPUT}\n`);
}

main();
