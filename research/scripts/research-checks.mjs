#!/usr/bin/env node
/**
 * research-checks.mjs — mechanical verification for an agentic-research repo.
 *
 * Dependency-free. Node 18+.
 *
 *   node paper/scripts/research-checks.mjs            # all non-compiling checks
 *   node paper/scripts/research-checks.mjs --compile  # also build the PDF
 *   node paper/scripts/research-checks.mjs --json     # machine-readable
 *
 * Runs from the repo root, from inside the paper subtree, or from CI: it walks
 * up for docs/research-delta.md.
 *
 * Exit codes: 0 = all pass, 1 = at least one FAIL, 2 = bad invocation.
 * WARN never fails the build; FAIL always does.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { execSync, execFileSync } from 'node:child_process';

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
const GOV_DELTA = ['llm/governance/governance-delta.md', 'docs/governance-delta.md'].find(has) || null;

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
const cfg = { paperDir: 'paper', mainTex: 'main.tex', bib: null, pageLimit: 0, memoryBank: null, construction: null, gate: 'warn', gateStage: 'draft' };

if (!delta) {
  fail('delta', `${DELTA_PATH} is missing. Run /research:establish.`);
} else {
  const clean = (s) => s
    .trim()
    .replace(/^\*\*|\*\*$/g, '')
    // A provenance annotation may follow the value in the same cell, e.g.
    //   `llm/memory_bank/` (from the governance delta - do not change here)
    // Strip it: the value is what precedes the parenthetical.
    .replace(/\s*\((?:from|source|via|see|per)\b[^)]*\)\s*$/i, '')
    .replace(/\s*<!--[^>]*-->\s*$/, '')
    .trim()
    .replace(/^[`\[]+|[`\]]+$/g, '')
    .trim();
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

  // The gate lives in the Peer Review section. Without that section there is
  // no gate to configure, so the v1.9 behavior (advisory only) still applies.
  const hasPeerSection = /^##\s+Peer Review\b/im.test(delta);
  const gate = hasPeerSection ? (field('Gate') || 'warn').toLowerCase() : 'off';
  cfg.gate = ['off', 'warn', 'required'].includes(gate) ? gate : 'warn';
  const gateStage = hasPeerSection ? (field('Gate Stage') || 'draft').toLowerCase() : 'draft';
  cfg.gateStage = ['outline', 'draft', 'camera-ready'].includes(gateStage) ? gateStage : 'draft';

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
    // Keys already reported as MISSING are not re-reported here at a lower
    // severity — one fault, one finding.
    const unlisted = [...cited].filter((k) => !mx.includes(k) && !missing.includes(k));
    unlisted.length
      ? warn('citations.matrix', `${unlisted.length} cited key(s) absent from ${mxPath}: ${unlisted.slice(0, 10).join(', ')}${unlisted.length > 10 ? ' …' : ''} — run /research:citation-matrix`)
      : pass('citations.matrix', `matrix covers all ${cited.size} cited keys`);
  }
}

/* ---------- 4a. Governance claim vs reality ---------- */
// The delta's "Governance delta present" field is written once by the
// scaffolder and, until now, read by nothing. It goes stale the moment
// governance is adopted afterwards - which is exactly what happens when
// /governance:establish runs second. Give the field an owner.
if (delta) {
  const claimed = (() => {
    const m = delta.match(/^\s*Governance delta present\s*:\s*(\w+)/im);
    return m ? /^(yes|true)$/i.test(m[1]) : null;
  })();
  const actual = GOV_DELTA !== null;

  if (claimed === null) {
    warn('governance.sync', 'delta has no "Governance delta present" field — cannot reconcile');
  } else if (claimed === actual) {
    pass('governance.sync', actual
      ? `declares governance present, and ${GOV_DELTA} exists`
      : 'declares no governance, and none present');
  } else if (actual && !claimed) {
    fail('governance.sync',
      `delta says "Governance delta present: no" but ${GOV_DELTA} exists — ` +
      'governance was adopted after this repo was scaffolded. Set the field to yes, ' +
      'mirror the memory-bank path from the governance delta, and run /research:audit ' +
      'to get the L0 allowlist lines that are missing.');
  } else {
    fail('governance.sync',
      'delta says "Governance delta present: yes" but neither ' +
      'llm/governance/governance-delta.md nor docs/governance-delta.md is present — ' +
      'either it was deleted, or the field was set by hand. Every path this delta says it ' +
      'mirrors from governance is now unsourced.');
  }

  // Reverse-order repos never got the L0 denials printed, because research ran
  // before there was a delta to add them to.
  if (actual) {
    const gov = read(GOV_DELTA) || '';
    const wantDenies = [`deny ${cfg.paperDir}/**`];
    if (cfg.construction) wantDenies.push(`deny ${cfg.construction.replace(/\/+$/, '')}/design/**`);
    wantDenies.push('deny docs/research-delta.md');
    const absent = wantDenies.filter((d) => !gov.includes(d.replace(/^deny /, '')));
    absent.length
      ? warn('governance.l0', `governance L0 allowlist does not mention: ${absent.map((d) => d.replace(/^deny /, '')).join(', ')} — paper prose is semantic work. The allowlist is default-deny so this is explicitness, not an open door; /research:audit prints the exact lines.`)
      : pass('governance.l0', 'L0 allowlist covers the paper and construction paths');
  }
}

/* ---------- 4b. Anonymity (double-blind venues) ---------- */
if (delta) {
  const anon = (() => {
    const m = delta.match(/^\s*\|?\s*\*?\*?Anonymised\*?\*?\s*[|:]\s*([^|\n]+)/im);
    return m ? /^(yes|true)\b/i.test(m[1].trim()) : false;
  })();
  if (!anon) {
    pass('anonymity', 'venue not declared double-blind');
  } else {
    const main = read(`${cfg.paperDir}/${cfg.mainTex}`) || '';
    const body = main.split('\n').map((l) => l.replace(/(^|[^\\])%.*$/, '$1')).join('\n');
    const classAnon = /\\documentclass\[[^\]]*\banonymous\b[^\]]*\]/.test(body);
    const ids = [];
    for (const cmd of ['author', 'affiliation', 'email', 'institution']) {
      for (const m of body.matchAll(new RegExp(`\\\\${cmd}\\s*(?:\\[[^\\]]*\\])?\\s*\\{([^}]*)\\}`, 'g'))) {
        const v = m[1].trim();
        if (v && !/anonym|omitted|blinded|redacted/i.test(v)) ids.push(`\\${cmd}{${v.slice(0, 40)}}`);
      }
    }
    if (classAnon && !ids.length) pass('anonymity', 'anonymous class option set, no identifying metadata');
    else if (classAnon) warn('anonymity', `anonymous class option is set, but identifying text remains: ${ids.slice(0, 3).join(', ')} — verify it is suppressed in the PDF`);
    else if (ids.length) fail('anonymity', `delta says Anonymised: yes, but ${cfg.mainTex} carries identifying metadata: ${ids.slice(0, 3).join(', ')}${ids.length > 3 ? ` (+${ids.length - 3})` : ''} — a double-blind submission with author details is a desk reject`);
    else pass('anonymity', 'no identifying metadata found');
  }
}

/* ---------- 4c. Empty directories survive a clone ---------- */
{
  const NEED = [cfg.paperDir && `${cfg.paperDir}/figures`, 'files',
                cfg.memoryBank && `${cfg.memoryBank}/archive`,
                cfg.construction && `${cfg.construction}/design`,
                cfg.construction && `${cfg.construction}/sprints`].filter(Boolean);
  const ghosts = NEED.filter((d) => existsSync(join(ROOT, d)) && readdirSync(join(ROOT, d)).length === 0);
  ghosts.length
    ? warn('clone-safety', `empty and will vanish on clone — add a .gitkeep: ${ghosts.join(', ')}`)
    : pass('clone-safety', 'no empty directories that a clone would drop');
}

/* ---------- 4d. Peer-review records ---------- */
// Structure and independence markers only. This check cannot judge whether a
// review is any good, and the README says so. The Gate/Gate Stage fields turn
// the latest set into a merge gate; structural faults stay FAIL in every mode.
if (delta) {
  const REVIEW_PERSONAS = ['methods', 'venue', 'reader'];
  const REQUIRED_FM = ['persona', 'stage', 'paper_commit', 'paper_tree',
                       'reviewer_session', 'plugin_version', 'confidence', 'score'];
  const REQUIRED_META_FM = ['paper_commit', 'paper_tree', 'plugin_version'];
  const REQUIRED_SECTIONS = ['## Summary', '## Essential fixes', '## Desirable fixes',
                             '## Strengths', '## Could not assess'];
  const STAGES = ['outline', 'draft', 'camera-ready'];
  const stageRank = (stage) => {
    const i = STAGES.indexOf(String(stage || '').trim().toLowerCase());
    return i === -1 ? null : i;
  };
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parseFm = (text) => {
    const m = text.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!m) return null;
    const fm = {};
    for (const raw of m[1].split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
      if (!kv) continue;
      let v = kv[2].trim().replace(/^["'](.*)["']$/, '$1');
      if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
      fm[kv[1]] = v;
    }
    return fm;
  };
  const personaList = (v) => Array.isArray(v)
    ? v
    : (v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : []);
  const setInfo = (name) => {
    const m = name.match(/^(\d{4}-\d{2}-\d{2})(?:-(.+))?$/);
    const date = m ? m[1] : name;
    const suffix = m && m[2] ? m[2] : '';
    const sm = suffix.match(/^(outline|draft|camera-ready)(?:$|-)/);
    const stage = sm ? sm[1] : suffix;
    return { name, date, stage, rank: stageRank(stage) };
  };
  const sectionBody = (text, heading) => {
    const m = text.match(new RegExp(`^##\\s+${escapeRe(heading)}\\s*$`, 'im'));
    if (!m) return null;
    const rest = text.slice(m.index + m[0].length);
    const next = rest.search(/^##\s+/m);
    return next === -1 ? rest : rest.slice(0, next);
  };
  const reportGate = (message) => {
    if (cfg.gate === 'off') return;
    cfg.gate === 'required' ? fail('peer-review', message) : warn('peer-review', message);
  };
  const commitInHistory = (sha) => {
    const s = String(sha || '').trim();
    if (!/^[0-9a-f]{7,40}$/i.test(s)) return false;
    try {
      execFileSync('git', ['merge-base', '--is-ancestor', s, 'HEAD'], { cwd: ROOT, stdio: 'ignore' });
      return true;
    } catch { return false; }
  };
  const emptyEvidence = (v) => {
    const evidence = String(v || '').trim();
    return !evidence.replace(/[`*_]/g, '').trim() || /^[-—–]+$/.test(evidence);
  };

  if (!/^##\s+Peer Review\b/im.test(delta)) {
    warn('peer-review', 'delta has no "## Peer Review" section — add the empirical standard(s), venue call, review form, score scale, and house style');
  }

  if (!cfg.construction) {
    warn('peer-review', 'no Construction Path in the delta — review records not checked');
  } else {
    const reviewsRel = join(cfg.construction, 'reviews');
    const reviewsAbs = join(ROOT, reviewsRel);
    const reportNoReviews = () => {
      if (cfg.gate === 'off') pass('peer-review', 'no reviews yet');
      else if (cfg.gate === 'required') fail('peer-review', 'no reviews yet; Gate is required');
      else warn('peer-review', 'no reviews yet; Gate is warn');
    };

    if (!existsSync(reviewsAbs)) {
      reportNoReviews();
    } else {
      const sets = readdirSync(reviewsAbs)
        .filter((e) => { try { return statSync(join(reviewsAbs, e)).isDirectory(); } catch { return false; } })
        .sort((a, b) => {
          const A = setInfo(a);
          const B = setInfo(b);
          if (A.date !== B.date) return A.date < B.date ? -1 : 1;
          const ar = A.rank === null ? STAGES.length : A.rank;
          const br = B.rank === null ? STAGES.length : B.rank;
          if (ar !== br) return ar - br;
          return A.name.localeCompare(B.name);
        });

      if (!sets.length) reportNoReviews();

      for (const set of sets) {
        const setRel = join(reviewsRel, set);
        const setAbs = join(ROOT, setRel);
        const present = REVIEW_PERSONAS.filter((p) => existsSync(join(setAbs, `${p}.md`)));
        const problems = [];
        const parsed = [];
        const sessions = [];
        const commits = new Set();

        for (const persona of present) {
          const text = readFileSync(join(setAbs, `${persona}.md`), 'utf8');
          const fm = parseFm(text);
          if (!fm) { problems.push(`${persona}.md has no frontmatter`); continue; }

          const missingFields = REQUIRED_FM.filter((f) => fm[f] === undefined || fm[f] === '');
          if (missingFields.length) problems.push(`${persona}.md missing frontmatter: ${missingFields.join(', ')}`);

          const missingSections = REQUIRED_SECTIONS.filter((s) => !new RegExp(`^${escapeRe(s)}\\s*$`, 'm').test(text));
          if (missingSections.length) problems.push(`${persona}.md missing section(s): ${missingSections.join(', ')}`);

          if (fm.reviewer_session) sessions.push({ persona, id: String(fm.reviewer_session) });
          if (fm.paper_commit) commits.add(String(fm.paper_commit));
          parsed.push({ persona, text });
        }

        if (!present.length) problems.push('no persona review files (methods.md, venue.md, reader.md)');

        // Independence: two persona files may not share a reviewer_session.
        const bySession = new Map();
        for (const s of sessions) {
          if (!bySession.has(s.id)) bySession.set(s.id, []);
          bySession.get(s.id).push(s.persona);
        }
        for (const [id, people] of bySession) {
          if (people.length > 1) problems.push(`reviewer_session "${id}" is shared by ${people.join(', ')} — independence violated`);
        }

        // Independence: a persona may not name another persona's review file.
        for (const { persona, text } of parsed) {
          const named = REVIEW_PERSONAS.filter((other) => other !== persona && new RegExp(`\\b${other}\\.md\\b`).test(text));
          if (named.length) problems.push(`${persona}.md names another persona's file: ${named.map((n) => `${n}.md`).join(', ')} — independence violated`);
        }

        if (commits.size > 1) problems.push(`persona files disagree on paper_commit: ${[...commits].join(', ')}`);

        const metaAbs = join(setAbs, 'meta-review.md');
        if (!existsSync(metaAbs)) {
          problems.push('meta-review.md is missing');
        } else {
          const metaFm = parseFm(readFileSync(metaAbs, 'utf8'));
          if (metaFm) {
            const missingMeta = REQUIRED_META_FM.filter((f) => metaFm[f] === undefined || metaFm[f] === '');
            if (missingMeta.length) problems.push(`meta-review.md missing frontmatter: ${missingMeta.join(', ')}`);
          }
          const aggregated = personaList(metaFm?.personas);
          if (!metaFm || !aggregated.length) {
            problems.push(`meta-review.md does not list the personas it aggregates (should include: ${present.join(', ') || 'none'})`);
          } else {
            const absent = present.filter((p) => !aggregated.includes(p));
            if (absent.length) problems.push(`meta-review.md is missing persona(s) it should aggregate: ${absent.join(', ')}`);
          }
        }

        if (problems.length) fail('peer-review', `${setRel}: ${problems.join('; ')}`);
        else pass('peer-review', `${setRel}: ${present.length} persona review(s) and meta-review are well formed`);
      }

      // Only the latest review set is compared with the current paper tree;
      // an old set that was superseded should not keep warning forever. The
      // latest is by date, then stage order, then directory name (§3.4).
      const latest = sets[sets.length - 1];
      if (latest) {
        const latestAbs = join(reviewsAbs, latest);
        const latestRel = join(reviewsRel, latest);
        const latestInfo = setInfo(latest);
        const metaPath = join(latestAbs, 'meta-review.md');
        const metaText = existsSync(metaPath) ? readFileSync(metaPath, 'utf8') : '';
        const metaFm = metaText ? parseFm(metaText) : null;

        // Gate stage: the latest set must be at least as advanced as Gate Stage.
        let actualStage = stageRank(latestInfo.stage) !== null ? latestInfo.stage : null;
        if (!actualStage) {
          for (const persona of REVIEW_PERSONAS) {
            const p = join(latestAbs, `${persona}.md`);
            if (!existsSync(p)) continue;
            const fm = parseFm(readFileSync(p, 'utf8'));
            if (fm && stageRank(fm.stage) !== null) { actualStage = String(fm.stage).toLowerCase(); break; }
          }
        }
        const actualRank = stageRank(actualStage);
        const gateRank = stageRank(cfg.gateStage);
        if (cfg.gate !== 'off' && actualRank !== null && gateRank !== null && actualRank < gateRank) {
          reportGate(`${latestRel}: latest review set is at stage "${actualStage}", earlier than Gate Stage "${cfg.gateStage}"`);
        }

        // Dispositions: every ranked essential fix needs a decision, and the
        // decision's evidence must be verifiable.
        const rankedBody = metaText ? sectionBody(metaText, 'Ranked essential fixes') : null;
        const fixes = [];
        if (rankedBody) {
          for (const raw of rankedBody.split(/\r?\n/)) {
            const line = raw.trim();
            if (!line) continue;
            if (/^\|\s*:?-{3,}/.test(line)) continue;
            if (line.startsWith('|')) {
              const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((s) => s.trim());
              if (!cells.length || /^#$/i.test(cells[0])) continue;
              const n = cells[0].match(/^(\d+)[.)]?$/);
              if (!n) continue;
              fixes.push({ id: parseInt(n[1], 10), text: cells[1] || '' });
              continue;
            }
            let m = line.match(/^(\d+)[.)]\s+(.+)$/);
            if (m) { fixes.push({ id: parseInt(m[1], 10), text: m[2] }); continue; }
            m = line.match(/^[-*]\s+(.+)$/);
            if (m) { fixes.push({ id: fixes.length + 1, text: m[1] }); continue; }
          }
        }

        const dispositions = new Map();
        const dispBody = metaText ? sectionBody(metaText, 'Dispositions') : null;
        if (dispBody) {
          for (const raw of dispBody.split(/\r?\n/)) {
            const line = raw.trim();
            if (!line.startsWith('|')) continue;
            const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((s) => s.trim());
            if (cells.length < 3) continue;
            if (/^#$/i.test(cells[0])) continue;
            if (/^:?-{3,}/.test(cells[0])) continue;
            const n = cells[0].match(/^(\d+)[.)]?$/);
            if (!n) continue;
            const decision = cells[2].toLowerCase().replace(/[`*_]/g, '').replace(/\s+/g, '-').trim();
            dispositions.set(parseInt(n[1], 10), { decision, evidence: cells[3] || '', raw: cells[2] });
          }
        }

        const dispIssues = [];
        if (!dispBody && (fixes.length || cfg.gate === 'required')) {
          dispIssues.push('meta-review.md has no "## Dispositions" section');
        }
        for (const fix of fixes) {
          const row = dispositions.get(fix.id);
          const label = `ranked essential fix ${fix.id} (${fix.text})`;
          if (!row) { dispIssues.push(`${label} has no Dispositions row`); continue; }
          if (!row.decision || row.decision === 'pending') {
            dispIssues.push(`${label} has Decision "${row.raw || ''}" (pending)`);
          } else if (row.decision === 'fixed') {
            const sha = (row.evidence.match(/\b[0-9a-f]{7,40}\b/i) || [])[0];
            if (!sha) dispIssues.push(`${label} is fixed without a commit SHA in Evidence`);
            else if (!commitInHistory(sha)) dispIssues.push(`${label} is fixed but commit ${sha.slice(0, 12)}… is not in history`);
          } else if (row.decision === 'wont-fix' || row.decision === 'deferred') {
            if (emptyEvidence(row.evidence)) dispIssues.push(`${label} is ${row.decision} with empty Evidence`);
          } else {
            dispIssues.push(`${label} has an invalid Decision "${row.raw}"`);
          }
        }
        if (dispIssues.length) reportGate(`${latestRel}: ${dispIssues.join('; ')}`);

        // Reviewed paper_commit must be an ancestor of HEAD.
        const reviewedCommit = (metaFm && metaFm.paper_commit) ? String(metaFm.paper_commit) : null;
        if (cfg.gate !== 'off' && reviewedCommit && !commitInHistory(reviewedCommit)) {
          reportGate(`${latestRel}: reviewed paper_commit ${reviewedCommit} is not an ancestor of HEAD`);
        }

        // Paper changed since the reviewed commit stays a WARN in every mode:
        // fixing what the reviewers found changes the paper.
        let reviewTree = null;
        if (metaFm && metaFm.paper_tree) reviewTree = String(metaFm.paper_tree);
        if (!reviewTree) {
          for (const persona of REVIEW_PERSONAS) {
            const p = join(latestAbs, `${persona}.md`);
            if (!existsSync(p)) continue;
            const fm = parseFm(readFileSync(p, 'utf8'));
            if (fm && fm.paper_tree) { reviewTree = String(fm.paper_tree); break; }
          }
        }
        let currentTree = null;
        try {
          currentTree = execFileSync('git', ['rev-parse', `HEAD:${cfg.paperDir}`], {
            cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'],
          }).toString().trim();
        } catch { /* not a git repo, or the paper subtree is untracked */ }
        if (reviewTree && currentTree && reviewTree !== currentTree) {
          warn('peer-review', `${latestRel}: reviews are of an older draft (reviewed tree ${reviewTree.slice(0, 12)}…, current ${currentTree.slice(0, 12)}…)`);
        }
      }
    }
  }
}

/* ---------- 5b. Paper subtree is source-only ---------- */
{
  // Only the top level of the subtree — build/ is where output is SUPPOSED to go.
  const LITTER = ['.aux','.log','.out','.bbl','.blg','.fls','.fdb_latexmk','.synctex.gz','.toc','.pdf'];
  const found = [];
  const abs = join(ROOT, cfg.paperDir);
  if (existsSync(abs)) {
    for (const e of readdirSync(abs)) {
      if (e === 'build') continue;
      if (LITTER.some((x) => e.endsWith(x))) found.push(e);
    }
  }
  found.length
    ? warn('paper.clean', `build artifacts loose beside your source in ${cfg.paperDir}/: ${found.join(', ')} — these predate the -outdir build; safe to delete`)
    : pass('paper.clean', `no build artifacts loose in ${cfg.paperDir}/ (output goes to ${cfg.paperDir}/build/)`);
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
  // Derived output goes to the repo-root build dir, never beside main.tex.
  const buildDir = (cfg.buildDir && cfg.buildDir.toLowerCase() !== 'none')
    ? cfg.buildDir.replace(/\/+$/, '')
    : `${cfg.paperDir}/build`;
  const absBuild = join(ROOT, buildDir);
  try {
    execSync(`mkdir -p ${JSON.stringify(absBuild)} && latexmk -pdf -outdir=${JSON.stringify(absBuild)} -interaction=nonstopmode -halt-on-error ${cfg.mainTex}`,
      { cwd: join(ROOT, cfg.paperDir), stdio: 'pipe', shell: '/bin/bash' });
    pass('compile', `latexmk succeeded (output in ${buildDir}/)`);
    const log = read(`${buildDir}/${stem}.log`) || '';
    const undef = (log.match(/LaTeX Warning: (Reference|Citation) `[^']+' on page \d+ undefined/g) || []).length;
    undef ? fail('compile.refs', `${undef} undefined reference/citation warning(s)`)
          : pass('compile.refs', 'no undefined references');
    try {
      const info = execSync(`pdfinfo ${stem}.pdf`, { cwd: absBuild }).toString();
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
