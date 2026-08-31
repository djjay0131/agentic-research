#!/usr/bin/env node
/**
 * research-checks.mjs — mechanical verification for an agentic-research repo.
 *
 * Dependency-free. Node 18+. Run from the repo root:
 *
 *   node scripts/research-checks.mjs            # all non-compiling checks
 *   node scripts/research-checks.mjs --compile  # also build the PDF
 *   node scripts/research-checks.mjs --json     # machine-readable
 *
 * Exit codes: 0 = all pass, 1 = at least one FAIL, 2 = bad invocation.
 * WARN never fails the build; FAIL always does.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { execSync } from 'node:child_process';

// Locate the repo root by walking up for docs/research-delta.md, so the script
// works from the repo root, from inside the paper subtree, or from CI.
function findRoot(start) {
  let d = start;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(d, 'docs', 'research-delta.md'))) return d;
    const up = dirname(d);
    if (up === d) break;
    d = up;
  }
  return start;
}
const ROOT = findRoot(process.cwd());
const argv = process.argv.slice(2);
const WANT_COMPILE = argv.includes('--compile');
const AS_JSON = argv.includes('--json');

const results = [];
const pass = (c, m) => results.push({ check: c, status: 'PASS', message: m });
const warn = (c, m) => results.push({ check: c, status: 'WARN', message: m });
const fail = (c, m) => results.push({ check: c, status: 'FAIL', message: m });

const read = (p) => { try { return readFileSync(join(ROOT, p), 'utf8'); } catch { return null; } };
const has = (p) => existsSync(join(ROOT, p));

function walk(dir, exts, acc = []) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return acc;
  for (const e of readdirSync(abs)) {
    if (e === 'node_modules' || e === '.git' || e === 'build') continue;
    const rel = join(dir, e);
    const st = statSync(join(ROOT, rel));
    if (st.isDirectory()) walk(rel, exts, acc);
    else if (exts.includes(extname(e))) acc.push(rel);
  }
  return acc;
}

/* ---------- 1. Research delta ---------- */
const DELTA_PATH = 'docs/research-delta.md';
const delta = read(DELTA_PATH);
const cfg = { paperDir: 'paper', mainTex: 'main.tex', bib: null, pageLimit: 0, memoryBank: null, construction: null };

if (!delta) {
  fail('delta', `${DELTA_PATH} is missing. Run /research:establish.`);
} else {
  const clean = (s) => s.trim().replace(/^\*\*|\*\*$/g, '').replace(/^[`\[]+|[`\]]+$/g, '').trim();
  const field = (label) => {
    // markdown table row:  | Label | value |
    let m = delta.match(new RegExp(`^\\s*\\|\\s*\\*?\\*?${label}\\*?\\*?\\s*\\|\\s*([^|]+?)\\s*\\|`, 'im'));
    if (m) { const v = clean(m[1]); return v || null; }
    // plain form:  Label: value   /   - **Label**: value
    m = delta.match(new RegExp(`^\\s*[-*]?\\s*\\*?\\*?${label}\\*?\\*?\\s*:\\s*(.+)$`, 'im'));
    return m ? (clean(m[1]) || null) : null;
  };
  const ver = delta.match(/Research:\s*agentic-research\s*v([\d.]+)/i);
  ver ? pass('delta.version', `pinned to v${ver[1]}`)
      : fail('delta.version', 'no "Research: agentic-research vX.Y" pin found');

  cfg.paperDir    = field('Paper Path') || field('Paper Directory') || 'paper';
  cfg.figures     = field('Figures');
  cfg.buildDir    = field('Build Output');
  cfg.mainTex     = field('Main Tex') || 'main.tex';
  cfg.bib         = field('Bibliography') || field('Bib Path');
  cfg.memoryBank  = field('Memory Bank');
  cfg.construction= field('Construction Path');
  const pl        = field('Page Limit');
  cfg.pageLimit   = pl && /^\d+$/.test(pl) ? parseInt(pl, 10) : 0;
  for (const k of ['paperDir','memoryBank','construction']) if (cfg[k]) cfg[k] = cfg[k].replace(/\/+$/, '');

  if (/\{\{[A-Z_]+\}\}/.test(delta)) fail('delta.filled', 'delta still contains {{PLACEHOLDER}} values');
  else pass('delta.filled', 'no unfilled placeholders');
}

/* ---------- 2. Layout ---------- */
for (const [label, field, p] of [
  ['paper dir', 'Paper Path', cfg.paperDir],
  ['memory bank', 'Memory Bank', cfg.memoryBank],
  ['construction', 'Construction Path', cfg.construction],
]) {
  // An undeclared path must never read as a passed check.
  if (!p) { warn('layout', `${label} not declared in the delta ("${field}") — this check was skipped, not passed`); continue; }
  if (p.toLowerCase() === 'none') { pass('layout', `${label} declared as "none"`); continue; }
  has(p) ? pass('layout', `${label} present at ${p}`)
         : fail('layout', `${label} declared as ${p} but missing on disk`);
}
has('files') ? pass('layout.files', 'files/ present') : warn('layout.files', 'no files/ dir for source material');

/* ---------- 3. Placeholders in prose ---------- */
const texFiles = walk(cfg.paperDir, ['.tex']);
const PLACEHOLDER = /\b(TBD|TODO|FIXME|XXX)\b|\{\{[A-Z_]+\}\}/;
const dirty = [];
for (const f of texFiles) {
  const body = (read(f) || '').split('\n')
    .map((l) => l.replace(/(^|[^\\])%.*$/, '$1'))   // strip TeX comments
    .join('\n');
  if (PLACEHOLDER.test(body)) dirty.push(f);
}
if (!texFiles.length) warn('placeholders', `no .tex files under ${cfg.paperDir}/`);
else if (dirty.length) fail('placeholders', `placeholder text in: ${dirty.join(', ')}`);
else pass('placeholders', `${texFiles.length} .tex files clean`);

/* ---------- 4. Citations: \cite{} vs .bib ---------- */
let bibPath = cfg.bib && cfg.bib.toLowerCase() !== 'none' ? cfg.bib : null;
if (!bibPath) {
  const found = walk(cfg.paperDir, ['.bib']).concat(walk('.', ['.bib']).filter((p) => !p.includes('/')));
  bibPath = found[0] || null;
}
if (!bibPath || !has(bibPath)) {
  warn('citations', 'no .bib file found; skipping citation checks');
} else {
  const bib = read(bibPath) || '';
  const bibKeys = new Set([...bib.matchAll(/@\w+\s*\{\s*([^,\s]+)\s*,/g)].map((m) => m[1]));
  const cited = new Set();
  for (const f of texFiles) {
    const body = (read(f) || '').split('\n')
      .map((l) => l.replace(/(^|[^\\])%.*$/, '$1')).join('\n');
    for (const m of body.matchAll(/\\(?:cite|citep|citet|autocite|parencite|textcite)[a-zA-Z]*\s*(?:\[[^\]]*\]\s*)*\{([^}]*)\}/g)) {
      for (const k of m[1].split(',')) { const t = k.trim(); if (t) cited.add(t); }
    }
  }
  const missing = [...cited].filter((k) => !bibKeys.has(k));
  const orphans = [...bibKeys].filter((k) => !cited.has(k));
  missing.length
    ? fail('citations.missing', `\\cite{} with no bib entry (${missing.length}): ${missing.slice(0, 12).join(', ')}${missing.length > 12 ? ' …' : ''}`)
    : pass('citations.missing', `all ${cited.size} cited keys resolve in ${bibPath}`);
  orphans.length
    ? warn('citations.orphans', `bib entries never cited (${orphans.length}): ${orphans.slice(0, 12).join(', ')}${orphans.length > 12 ? ' …' : ''}`)
    : pass('citations.orphans', 'no orphan bib entries');

  /* ---------- 5. Citation matrix coverage ---------- */
  const mxPath = [cfg.construction, 'construction', 'llm/construction']
    .filter(Boolean).map((c) => `${c.replace(/\/$/, '')}/requirements/citation-matrix.md`)
    .find((p) => has(p));
  if (!mxPath) warn('citations.matrix', 'no citation-matrix.md found');
  else {
    const mx = read(mxPath) || '';
    const unlisted = [...cited].filter((k) => !mx.includes(k));
    unlisted.length
      ? warn('citations.matrix', `${unlisted.length} cited key(s) absent from ${mxPath}: ${unlisted.slice(0, 10).join(', ')}${unlisted.length > 10 ? ' …' : ''} — run /research:citation-matrix`)
      : pass('citations.matrix', `matrix covers all ${cited.size} cited keys`);
  }
}

/* ---------- 6. Memory bank completeness ---------- */
if (!cfg.memoryBank) {
  warn('memory-bank', 'no Memory Bank path in the delta — completeness not checked');
} else if (cfg.memoryBank.toLowerCase() !== 'none' && has(cfg.memoryBank)) {
  const REQUIRED = ['activeContext.md', 'projectbrief.md', 'progress.md'];
  const present = readdirSync(join(ROOT, cfg.memoryBank));
  const gone = REQUIRED.filter((f) => !present.includes(f));
  gone.length ? warn('memory-bank', `missing: ${gone.join(', ')}`)
              : pass('memory-bank', 'core files present');
}

/* ---------- 7. Compile + page limit ---------- */
if (WANT_COMPILE) {
  const stem = cfg.mainTex.replace(/\.tex$/, '');
  try {
    execSync(`latexmk -pdf -interaction=nonstopmode -halt-on-error ${cfg.mainTex}`,
      { cwd: join(ROOT, cfg.paperDir), stdio: 'pipe' });
    pass('compile', 'latexmk succeeded');
    const log = read(`${cfg.paperDir}/${stem}.log`) || '';
    const undef = (log.match(/LaTeX Warning: (Reference|Citation) `[^']+' on page \d+ undefined/g) || []).length;
    undef ? fail('compile.refs', `${undef} undefined reference/citation warning(s)`)
          : pass('compile.refs', 'no undefined references');
    try {
      const info = execSync(`pdfinfo ${stem}.pdf`, { cwd: join(ROOT, cfg.paperDir) }).toString();
      const pages = parseInt((info.match(/^Pages:\s*(\d+)/m) || [])[1], 10);
      if (!Number.isNaN(pages)) {
        if (cfg.pageLimit > 0 && pages > cfg.pageLimit) fail('page-limit', `${pages} pages > limit ${cfg.pageLimit}`);
        else pass('page-limit', cfg.pageLimit > 0 ? `${pages}/${cfg.pageLimit} pages` : `${pages} pages (no limit declared)`);
      }
    } catch { warn('page-limit', 'pdfinfo unavailable; page count not checked'); }
  } catch (e) {
    const out = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
    const err = (out.match(/^! .*$/m) || ['see latexmk output'])[0];
    fail('compile', `latexmk failed: ${err}`);
  }
} else {
  warn('compile', 'skipped (pass --compile to build)');
}

/* ---------- report ---------- */
const counts = { PASS: 0, WARN: 0, FAIL: 0 };
for (const r of results) counts[r.status]++;

if (AS_JSON) {
  console.log(JSON.stringify({ counts, results }, null, 2));
} else {
  const icon = { PASS: '  ok  ', WARN: ' warn ', FAIL: ' FAIL ' };
  console.log('\nresearch-checks\n');
  for (const r of results) console.log(`[${icon[r.status]}] ${r.check.padEnd(22)} ${r.message}`);
  console.log(`\n${counts.PASS} passed, ${counts.WARN} warnings, ${counts.FAIL} failed\n`);
}
process.exit(counts.FAIL > 0 ? 1 : 0);
