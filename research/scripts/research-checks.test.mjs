#!/usr/bin/env node
/**
 * research-checks.test.mjs — dependency-free tests for research-checks.mjs.
 *
 * Builds fixture repos in a temp directory, runs the checker as a child
 * process, and asserts the `peer-review` result for every row of the design's
 * deterministic-check table. Also asserts that the existing checks produce no
 * FAIL on a clean fixture, and that two runs produce identical output.
 *
 *   node research/scripts/research-checks.test.mjs
 *
 * No npm dependencies. Node 18+.
 */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const HERE = dirname(fileURLToPath(import.meta.url));
const CHECKER = resolve(HERE, 'research-checks.mjs');
const REVIEW_SET = '2026-11-14-draft';

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

function git(dir, args) {
  return execFileSync('git', args, {
    cwd: dir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'Fixture',
      GIT_AUTHOR_EMAIL: 'fixture@example.org',
      GIT_COMMITTER_NAME: 'Fixture',
      GIT_COMMITTER_EMAIL: 'fixture@example.org',
      GIT_AUTHOR_DATE: '2026-11-14T00:00:00Z',
      GIT_COMMITTER_DATE: '2026-11-14T00:00:00Z',
    },
  }).toString().trim();
}

function deltaText({ peerReview = true, governance = 'no', gate = 'off', gateStage = 'draft' } = {}) {
  return `# Research Delta: Fixture

Status: Draft
Last updated: 2026-11-14
Research: agentic-research v1.9.0

## Paper Type

Type: research-paper

## Layout Paths

| Field | Value | Where |
|---|---|---|
| Paper Path | \`paper/\` | repo root |
| Main Tex | \`main.tex\` | in the paper subtree |
| Bibliography | \`paper/references.bib\` | in the paper subtree |
| Figures | \`paper/figures/\` | in the paper subtree |
| Scripts | \`paper/scripts/\` | in the paper subtree |
| Build Output | \`paper/build/\` | in the subtree, git-ignored, derived |
| Construction Path | \`llm/construction/\` | under llm |
| Memory Bank | \`llm/memory_bank/\` | under llm |
| Source Material | \`files/\` | repo root, shared with code |

## Venue

| Field | Value |
|---|---|
| Venue | FixtureConf |
| Template | article |
| Template files | bundled |
| Page Limit | 0 |
| Page Limit Counts | body only |
| Submission Deadline | none |
| Submission Portal | none |
| Anonymised | no |

${peerReview ? `## Peer Review

| Field | Value |
|---|---|
| Empirical Standard(s) | none |
| Venue Call | none |
| Review Form | none |
| Score Scale | accept-to-reject |
| Gate | ${gate} |
| Gate Stage | ${gateStage} |

**House Style**

` : ''}## Governance Composition

Governance delta present: ${governance}
`;
}

function governanceDeltaText() {
  return `# Governance Delta: Fixture

## L0 Allowlist

deny paper/**
deny llm/construction/design/**
deny docs/research-delta.md
`;
}

function createFixture({ peerReview = true, governance = 'no', govPath = null, gate = 'off', gateStage = 'draft' } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'ar-peer-review-'));
  write(dir, 'docs/research-delta.md', deltaText({ peerReview, governance, gate, gateStage }));
  if (govPath) write(dir, govPath, governanceDeltaText());
  write(dir, 'paper/main.tex', `\\documentclass{article}
\\begin{document}
Fixture paper.
\\end{document}
`);
  write(dir, 'paper/references.bib');
  write(dir, 'paper/figures/.gitkeep');
  write(dir, 'files/README.md', 'Source material.\n');
  write(dir, 'llm/memory_bank/activeContext.md', 'Fixture.\n');
  write(dir, 'llm/memory_bank/projectbrief.md', 'Fixture.\n');
  write(dir, 'llm/memory_bank/progress.md', 'Fixture.\n');
  write(dir, 'llm/memory_bank/archive/.gitkeep');
  write(dir, 'llm/construction/design/README.md', 'Designs.\n');
  write(dir, 'llm/construction/sprints/README.md', 'Sprints.\n');
  write(dir, 'llm/construction/requirements/citation-matrix.md', '# Citation matrix\n');
  write(dir, 'llm/construction/requirements/references.json',
    '{\n  "version": 1,\n  "generated": null,\n  "records": []\n}\n');

  git(dir, ['init', '-q']);
  git(dir, ['add', '-A']);
  git(dir, ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.org',
            '-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'fixture', '--no-gpg-sign']);

  const ids = {
    commit: git(dir, ['rev-parse', 'HEAD']),
    tree: git(dir, ['rev-parse', 'HEAD:paper']),
  };
  return { dir, ids };
}

function review(persona, ids, overrides = {}, extra = '') {
  const values = {
    persona,
    stage: 'draft',
    paper_commit: ids.commit,
    paper_tree: ids.tree,
    reviewer_session: `session-${persona}`,
    plugin_version: '1.9.0',
    confidence: '4',
    score: persona === 'venue' ? 'accept' : 'n/a',
    ...overrides,
  };
  return `---
persona: ${values.persona}
stage: ${values.stage}
paper_commit: ${values.paper_commit}
paper_tree: ${values.paper_tree}
reviewer_session: ${values.reviewer_session}
plugin_version: ${values.plugin_version}
confidence: ${values.confidence}
score: ${values.score}
---
# ${persona[0].toUpperCase() + persona.slice(1)} review

## Summary
Fixture summary.

## Essential fixes
None.

## Desirable fixes
None.

## Strengths
None specific.

## Could not assess
Nothing.
${extra}`;
}

function meta(ids, personas, overrides = {}, sections = {}) {
  const values = {
    paper_commit: ids.commit,
    paper_tree: ids.tree,
    plugin_version: '1.9.0',
    ...overrides,
  };
  const ranked = sections.ranked ? `\n${sections.ranked}\n` : '';
  const dispositions = sections.dispositions === undefined
    ? ''
    : `\n## Dispositions\n\n${sections.dispositions}\n`;
  return `---
paper_commit: ${values.paper_commit}
paper_tree: ${values.paper_tree}
plugin_version: ${values.plugin_version}
personas: [${personas.join(', ')}]
---
# Meta-review

## Agreement
## Disagreement
## Ranked essential fixes
${ranked}
## Scores
${dispositions}`;
}

function dispositionTable(rows = []) {
  return [
    '| # | Essential fix | Decision | Evidence |',
    '|---|---|---|---|',
    ...rows.map((r) => `| ${r.id} | ${r.fix} | ${r.decision} | ${r.evidence} |`),
  ].join('\n');
}

function addSet(dir, set, files) {
  for (const [name, content] of Object.entries(files)) {
    write(dir, `llm/construction/reviews/${set}/${name}`, content);
  }
}

function addCompleteSet(dir, set, ids, {
  reviewOverrides = {},
  metaOverrides = {},
  ranked = '',
  dispositions = dispositionTable(),
} = {}) {
  addSet(dir, set, {
    'methods.md': review('methods', ids, reviewOverrides),
    'venue.md': review('venue', ids, reviewOverrides),
    'reader.md': review('reader', ids, reviewOverrides),
    'meta-review.md': meta(ids, ['methods', 'venue', 'reader'], metaOverrides,
      { ranked, dispositions }),
  });
}

function runChecker(dir) {
  const invoke = () => spawnSync(process.execPath, [CHECKER, '--json'], {
    cwd: dir,
    encoding: 'utf8',
  });
  // Every fixture runs twice; a nondeterministic check is a bug in the check.
  const first = invoke();
  const second = invoke();
  assert.equal(first.status, second.status, 'checker exit status changed between identical runs');
  assert.equal(first.stdout, second.stdout, 'checker output changed between identical runs');
  assert.equal(first.stderr, second.stderr, 'checker stderr changed between identical runs');
  let data = null;
  try { data = JSON.parse(first.stdout); } catch { /* asserted below */ }
  return { status: first.status, stdout: first.stdout, stderr: first.stderr, data };
}

function peerResults(run) {
  return run.data.results.filter((r) => r.check === 'peer-review');
}

function assertPeer(run, expectedStatuses, messagePattern) {
  const peer = peerResults(run);
  assert.deepEqual(
    peer.map((r) => r.status).sort(),
    [...expectedStatuses].sort(),
    `unexpected peer-review statuses: ${JSON.stringify(peer)}`
  );
  if (messagePattern) {
    assert.ok(peer.some((r) => messagePattern.test(r.message)),
      `no peer-review result matched ${messagePattern}: ${JSON.stringify(peer)}`);
  }
}

function govResults(run) {
  return run.data.results.filter((r) => r.check === 'governance.sync');
}

function assertGov(run, expectedStatuses, messagePattern) {
  const gov = govResults(run);
  assert.deepEqual(
    gov.map((r) => r.status).sort(),
    [...expectedStatuses].sort(),
    `unexpected governance.sync statuses: ${JSON.stringify(gov)}`
  );
  if (messagePattern) {
    assert.ok(gov.some((r) => messagePattern.test(r.message)),
      `no governance.sync result matched ${messagePattern}: ${JSON.stringify(gov)}`);
  }
}

function cleanup(dir) {
  rmSync(dir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------------- */

test('clean repo with no reviews: PASS "no reviews yet"', () => {
  const { dir } = createFixture();
  try {
    const run = runChecker(dir);
    assert.ok(run.data, `checker did not emit JSON: ${run.stderr}`);
    assert.equal(run.data.counts.FAIL, 0, 'existing checks must not FAIL on a clean fixture');
    const peer = peerResults(run);
    assert.equal(peer.length, 1, `expected one peer-review result, got ${JSON.stringify(peer)}`);
    assert.equal(peer[0].status, 'PASS');
    assert.match(peer[0].message, /no reviews yet/);
  } finally { cleanup(dir); }
});

test('governance delta at llm/governance/: governance.sync PASS', () => {
  const { dir } = createFixture({
    governance: 'yes',
    govPath: 'llm/governance/governance-delta.md',
  });
  try {
    const run = runChecker(dir);
    assert.ok(run.data, `checker did not emit JSON: ${run.stderr}`);
    assertGov(run, ['PASS'], /llm\/governance\/governance-delta\.md exists/);
  } finally { cleanup(dir); }
});

test('legacy governance delta at docs/: governance.sync PASS', () => {
  const { dir } = createFixture({
    governance: 'yes',
    govPath: 'docs/governance-delta.md',
  });
  try {
    const run = runChecker(dir);
    assert.ok(run.data, `checker did not emit JSON: ${run.stderr}`);
    assertGov(run, ['PASS'], /docs\/governance-delta\.md exists/);
  } finally { cleanup(dir); }
});

test('governance delta absent while delta says present: FAIL', () => {
  const { dir } = createFixture({ governance: 'yes' });
  try {
    const run = runChecker(dir);
    assert.ok(run.data, `checker did not emit JSON: ${run.stderr}`);
    assertGov(run, ['FAIL'],
      /llm\/governance\/governance-delta\.md nor docs\/governance-delta\.md/);
  } finally { cleanup(dir); }
});

test('governance delta present while delta says absent: FAIL', () => {
  const { dir } = createFixture({
    governance: 'no',
    govPath: 'llm/governance/governance-delta.md',
  });
  try {
    const run = runChecker(dir);
    assert.ok(run.data, `checker did not emit JSON: ${run.stderr}`);
    assertGov(run, ['FAIL'], /llm\/governance\/governance-delta\.md exists/);
  } finally { cleanup(dir); }
});

test('valid complete review set: PASS', () => {
  const { dir, ids } = createFixture();
  try {
    addSet(dir, REVIEW_SET, {
      'methods.md': review('methods', ids),
      'venue.md': review('venue', ids),
      'reader.md': review('reader', ids),
      'meta-review.md': meta(ids, ['methods', 'venue', 'reader']),
    });
    const run = runChecker(dir);
    assert.equal(run.data.counts.FAIL, 0);
    assert.equal(peerResults(run).filter((r) => r.status === 'WARN').length, 0);
    assertPeer(run, ['PASS'], /well formed/);
  } finally { cleanup(dir); }
});

test('persona file missing required frontmatter: FAIL', () => {
  const { dir, ids } = createFixture();
  try {
    addSet(dir, REVIEW_SET, {
      'methods.md': review('methods', ids, { reviewer_session: '' }),
      'meta-review.md': meta(ids, ['methods']),
    });
    const run = runChecker(dir);
    assertPeer(run, ['FAIL'], /reviewer_session/);
  } finally { cleanup(dir); }
});

test('persona file missing a required section: FAIL', () => {
  const { dir, ids } = createFixture();
  try {
    addSet(dir, REVIEW_SET, {
      'methods.md': review('methods', ids).replace('## Could not assess\n', ''),
      'meta-review.md': meta(ids, ['methods']),
    });
    const run = runChecker(dir);
    assertPeer(run, ['FAIL'], /Could not assess/);
  } finally { cleanup(dir); }
});

test('two persona files sharing reviewer_session: FAIL', () => {
  const { dir, ids } = createFixture();
  try {
    addSet(dir, REVIEW_SET, {
      'methods.md': review('methods', ids, { reviewer_session: 'shared-session' }),
      'venue.md': review('venue', ids, { reviewer_session: 'shared-session' }),
      'meta-review.md': meta(ids, ['methods', 'venue']),
    });
    const run = runChecker(dir);
    assertPeer(run, ['FAIL'], /reviewer_session .*independence/);
  } finally { cleanup(dir); }
});

test('a persona file naming another persona\'s file: FAIL', () => {
  const { dir, ids } = createFixture();
  try {
    addSet(dir, REVIEW_SET, {
      'methods.md': review('methods', ids, {}, '\nSee venue.md for the fit argument.\n'),
      'venue.md': review('venue', ids),
      'meta-review.md': meta(ids, ['methods', 'venue']),
    });
    const run = runChecker(dir);
    assertPeer(run, ['FAIL'], /venue\.md.*independence/);
  } finally { cleanup(dir); }
});

test('persona files disagreeing on paper_commit: FAIL', () => {
  const { dir, ids } = createFixture();
  try {
    addSet(dir, REVIEW_SET, {
      'methods.md': review('methods', ids),
      'venue.md': review('venue', ids, { paper_commit: 'b'.repeat(40) }),
      'meta-review.md': meta(ids, ['methods', 'venue']),
    });
    const run = runChecker(dir);
    assertPeer(run, ['FAIL'], /disagree on paper_commit/);
  } finally { cleanup(dir); }
});

test('meta-review.md missing: FAIL', () => {
  const { dir, ids } = createFixture();
  try {
    addSet(dir, REVIEW_SET, {
      'methods.md': review('methods', ids),
    });
    const run = runChecker(dir);
    assertPeer(run, ['FAIL'], /meta-review\.md is missing/);
  } finally { cleanup(dir); }
});

test('meta-review.md missing a persona it should aggregate: FAIL', () => {
  const { dir, ids } = createFixture();
  try {
    addSet(dir, REVIEW_SET, {
      'methods.md': review('methods', ids),
      'venue.md': review('venue', ids),
      'meta-review.md': meta(ids, ['methods']),
    });
    const run = runChecker(dir);
    assertPeer(run, ['FAIL'], /missing persona.*venue/);
  } finally { cleanup(dir); }
});

test('latest review set is of an older paper tree: WARN', () => {
  const { dir, ids } = createFixture();
  try {
    const oldTree = '0'.repeat(40);
    addSet(dir, REVIEW_SET, {
      'methods.md': review('methods', ids, { paper_tree: oldTree }),
      'venue.md': review('venue', ids, { paper_tree: oldTree }),
      'reader.md': review('reader', ids, { paper_tree: oldTree }),
      'meta-review.md': meta(ids, ['methods', 'venue', 'reader'], { paper_tree: oldTree }),
    });
    const run = runChecker(dir);
    assertPeer(run, ['PASS', 'WARN'], /older draft/);
  } finally { cleanup(dir); }
});

test('delta has no Peer Review section: WARN', () => {
  const { dir } = createFixture({ peerReview: false });
  try {
    const run = runChecker(dir);
    assertPeer(run, ['PASS', 'WARN'], /## Peer Review/);
    assert.ok(peerResults(run).some((r) => /no reviews yet/.test(r.message)));
  } finally { cleanup(dir); }
});

test('checker output is identical across two runs', () => {
  const { dir, ids } = createFixture();
  try {
    addSet(dir, REVIEW_SET, {
      'methods.md': review('methods', ids),
      'venue.md': review('venue', ids),
      'reader.md': review('reader', ids),
      'meta-review.md': meta(ids, ['methods', 'venue', 'reader']),
    });
    const first = runChecker(dir);
    const second = runChecker(dir);
    assert.equal(first.status, second.status);
    assert.equal(first.stdout, second.stdout);
    assert.equal(first.stderr, second.stderr);
  } finally { cleanup(dir); }
});

/* ---------- §3.3 gate behavior: one fixture per row per mode ---------- */

const GATE_MODES = ['off', 'warn', 'required'];
const withGateResult = (mode, base = ['PASS']) =>
  mode === 'off' ? base : [...base, mode === 'warn' ? 'WARN' : 'FAIL'];

for (const mode of GATE_MODES) {
  test(`§3.3 gate ${mode}: no review set`, () => {
    const { dir } = createFixture({ gate: mode });
    try {
      const run = runChecker(dir);
      assert.ok(run.data, `checker did not emit JSON: ${run.stderr}`);
      const expected = mode === 'off' ? ['PASS'] : [mode === 'warn' ? 'WARN' : 'FAIL'];
      assertPeer(run, expected, /no reviews yet/);
    } finally { cleanup(dir); }
  });
}

for (const mode of GATE_MODES) {
  test(`§3.3 gate ${mode}: latest set's stage is earlier than Gate Stage`, () => {
    const { dir, ids } = createFixture({ gate: mode, gateStage: 'camera-ready' });
    try {
      addCompleteSet(dir, REVIEW_SET, ids);
      const run = runChecker(dir);
      assert.ok(run.data, `checker did not emit JSON: ${run.stderr}`);
      if (mode === 'off') assertPeer(run, withGateResult(mode));
      else assertPeer(run, withGateResult(mode), /earlier than Gate Stage/);
    } finally { cleanup(dir); }
  });
}

for (const mode of GATE_MODES) {
  test(`§3.3 gate ${mode}: ranked fix missing a row or Decision pending`, () => {
    const { dir, ids } = createFixture({ gate: mode });
    try {
      addCompleteSet(dir, REVIEW_SET, ids, {
        ranked: '1. Fix alpha\n2. Fix beta',
        dispositions: dispositionTable([
          { id: 1, fix: 'Fix alpha', decision: 'pending', evidence: '' },
        ]),
      });
      const run = runChecker(dir);
      assert.ok(run.data, `checker did not emit JSON: ${run.stderr}`);
      if (mode === 'off') {
        assertPeer(run, withGateResult(mode));
      } else {
        assertPeer(run, withGateResult(mode), /has no Dispositions row/);
        assert.ok(peerResults(run).some((r) => /pending/.test(r.message)),
          `pending Decision was not reported: ${JSON.stringify(peerResults(run))}`);
      }
    } finally { cleanup(dir); }
  });
}

for (const mode of GATE_MODES) {
  test(`§3.3 gate ${mode}: fixed without a commit SHA in history`, () => {
    const { dir, ids } = createFixture({ gate: mode });
    try {
      addCompleteSet(dir, REVIEW_SET, ids, {
        ranked: '1. Fix alpha\n2. Fix beta',
        dispositions: dispositionTable([
          { id: 1, fix: 'Fix alpha', decision: 'fixed', evidence: 'done' },
          { id: 2, fix: 'Fix beta', decision: 'fixed', evidence: 'f'.repeat(40) },
        ]),
      });
      const run = runChecker(dir);
      assert.ok(run.data, `checker did not emit JSON: ${run.stderr}`);
      if (mode === 'off') {
        assertPeer(run, withGateResult(mode));
      } else {
        assertPeer(run, withGateResult(mode), /without a commit SHA/);
        assert.ok(peerResults(run).some((r) => /not in history/.test(r.message)),
          `missing commit was not reported: ${JSON.stringify(peerResults(run))}`);
      }
    } finally { cleanup(dir); }
  });
}

for (const mode of GATE_MODES) {
  test(`§3.3 gate ${mode}: wont-fix or deferred with empty Evidence`, () => {
    const { dir, ids } = createFixture({ gate: mode });
    try {
      addCompleteSet(dir, REVIEW_SET, ids, {
        ranked: '1. Fix alpha\n2. Fix beta',
        dispositions: dispositionTable([
          { id: 1, fix: 'Fix alpha', decision: 'wont-fix', evidence: '' },
          { id: 2, fix: 'Fix beta', decision: 'deferred', evidence: '' },
        ]),
      });
      const run = runChecker(dir);
      assert.ok(run.data, `checker did not emit JSON: ${run.stderr}`);
      if (mode === 'off') {
        assertPeer(run, withGateResult(mode));
      } else {
        assertPeer(run, withGateResult(mode), /wont-fix with empty Evidence/);
        assert.ok(peerResults(run).some((r) => /deferred with empty Evidence/.test(r.message)),
          `empty deferred evidence was not reported: ${JSON.stringify(peerResults(run))}`);
      }
    } finally { cleanup(dir); }
  });
}

for (const mode of GATE_MODES) {
  test(`§3.3 gate ${mode}: reviewed paper_commit is not an ancestor of HEAD`, () => {
    const { dir, ids } = createFixture({ gate: mode });
    try {
      const side = git(dir, ['commit-tree', ids.tree, '-m', 'side commit']);
      addCompleteSet(dir, REVIEW_SET, ids, {
        reviewOverrides: { paper_commit: side },
        metaOverrides: { paper_commit: side },
      });
      const run = runChecker(dir);
      assert.ok(run.data, `checker did not emit JSON: ${run.stderr}`);
      if (mode === 'off') assertPeer(run, withGateResult(mode));
      else assertPeer(run, withGateResult(mode), /not an ancestor of HEAD/);
    } finally { cleanup(dir); }
  });
}

for (const mode of GATE_MODES) {
  test(`§3.3 gate ${mode}: paper changed since the reviewed tree stays WARN`, () => {
    const { dir, ids } = createFixture({ gate: mode });
    try {
      const oldTree = '0'.repeat(40);
      addCompleteSet(dir, REVIEW_SET, ids, {
        reviewOverrides: { paper_tree: oldTree },
        metaOverrides: { paper_tree: oldTree },
      });
      const run = runChecker(dir);
      assert.ok(run.data, `checker did not emit JSON: ${run.stderr}`);
      assertPeer(run, ['PASS', 'WARN'], /older draft/);
    } finally { cleanup(dir); }
  });
}

/* ---------- §3.4 follow-ups: latest set precedence and meta fields ---------- */

test('§3.4 latest set: date outranks stage', () => {
  const { dir, ids } = createFixture();
  try {
    const oldTree = '0'.repeat(40);
    addCompleteSet(dir, '2026-11-13-camera-ready', ids);
    addCompleteSet(dir, '2026-11-14-outline', ids, {
      reviewOverrides: { paper_tree: oldTree },
      metaOverrides: { paper_tree: oldTree },
    });
    const run = runChecker(dir);
    assert.ok(run.data, `checker did not emit JSON: ${run.stderr}`);
    assertPeer(run, ['PASS', 'PASS', 'WARN'], /older draft/);
    assert.ok(peerResults(run).some((r) => /2026-11-14-outline/.test(r.message)),
      `latest set was not 2026-11-14-outline: ${JSON.stringify(peerResults(run))}`);
  } finally { cleanup(dir); }
});

test('§3.4 latest set: same date, later stage wins', () => {
  const { dir, ids } = createFixture();
  try {
    const oldTree = '0'.repeat(40);
    addCompleteSet(dir, '2026-11-14-outline', ids);
    addCompleteSet(dir, '2026-11-14-draft', ids, {
      reviewOverrides: { paper_tree: oldTree },
      metaOverrides: { paper_tree: oldTree },
    });
    const run = runChecker(dir);
    assert.ok(run.data, `checker did not emit JSON: ${run.stderr}`);
    assertPeer(run, ['PASS', 'PASS', 'WARN'], /older draft/);
    assert.ok(peerResults(run).some((r) => /2026-11-14-draft/.test(r.message)),
      `latest set was not 2026-11-14-draft: ${JSON.stringify(peerResults(run))}`);
  } finally { cleanup(dir); }
});

test('§3.4 latest set: same date and stage, directory name breaks the tie', () => {
  const { dir, ids } = createFixture();
  try {
    const oldTree = '0'.repeat(40);
    addCompleteSet(dir, '2026-11-14-draft', ids);
    addCompleteSet(dir, '2026-11-14-draft-b', ids, {
      reviewOverrides: { paper_tree: oldTree },
      metaOverrides: { paper_tree: oldTree },
    });
    const run = runChecker(dir);
    assert.ok(run.data, `checker did not emit JSON: ${run.stderr}`);
    assertPeer(run, ['PASS', 'PASS', 'WARN'], /older draft/);
    assert.ok(peerResults(run).some((r) => /2026-11-14-draft-b/.test(r.message)),
      `latest set was not 2026-11-14-draft-b: ${JSON.stringify(peerResults(run))}`);
  } finally { cleanup(dir); }
});

for (const field of ['paper_commit', 'paper_tree', 'plugin_version']) {
  test(`§3.4 meta-review missing ${field}: FAIL`, () => {
    const { dir, ids } = createFixture();
    try {
      addCompleteSet(dir, REVIEW_SET, ids, { metaOverrides: { [field]: '' } });
      const run = runChecker(dir);
      assert.ok(run.data, `checker did not emit JSON: ${run.stderr}`);
      assertPeer(run, ['FAIL'], new RegExp(`meta-review\\.md missing frontmatter: .*${field}`));
    } finally { cleanup(dir); }
  });
}

/* ------------------------------------------------------------------------- */

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed) {
  for (const { name, err } of failures) {
    console.log(`--- ${name} ---`);
    console.log(err.stack || err.message || String(err));
  }
  process.exit(1);
}
