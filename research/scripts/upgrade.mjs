#!/usr/bin/env node
/**
 * upgrade.mjs — deterministic, mechanical upgrade of an adopting repo.
 *
 *   node research/scripts/upgrade.mjs <repo-path> [--dry-run] [--json]
 *                                      [--force] [--show-diff]
 *
 * Reads the repo's docs/research-delta.md, adds any template section or
 * Field/Value table row the delta lacks (never changing a value the owner set),
 * refreshes unmodified plugin-owned scripts under <paper>/scripts/ (preserving
 * _paths.sh and keeping local edits), and updates the version pin last.
 *
 * The judgment parts of an upgrade — layout migration, what to tell the owner —
 * stay in the establish skill. This script is the reproducible part.
 *
 * Exit codes: 0 = success, 1 = delta missing, 2 = bad invocation.
 * Dependency-free. Node 18+.
 */
import {
  readFileSync,
  writeFileSync,
  existsSync,
  statSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
  chmodSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(HERE, '..');
const REPO_ROOT = resolve(PLUGIN_ROOT, '..');
const TEMPLATE_PATH = join(PLUGIN_ROOT, 'templates', 'research-delta-template.md');
const RELEASED_HASHES_PATH = join(
  PLUGIN_ROOT, 'templates', 'scripts', 'RELEASED-HASHES.json'
);
const VERSION_PATH = join(REPO_ROOT, 'VERSION');
const DELTA_REL = 'docs/research-delta.md';

const USAGE = `usage: upgrade.mjs <repo-path> [--dry-run] [--json] [--force] [--show-diff]

  <repo-path>  repository containing docs/research-delta.md
  --dry-run    print the change list without writing
  --json       emit the change list as JSON
  --force      overwrite locally modified plugin scripts too
  --show-diff  show a unified diff for each locally modified script kept
`;

function badInvocation(message) {
  process.stderr.write(`upgrade: ${message}\n\n${USAGE}`);
  process.exit(2);
}

function parseArgs(argv) {
  let repo = null;
  let dryRun = false;
  let json = false;
  let force = false;
  let showDiff = false;

  for (const arg of argv) {
    if (arg === '--dry-run') dryRun = true;
    else if (arg === '--json') json = true;
    else if (arg === '--force') force = true;
    else if (arg === '--show-diff') showDiff = true;
    else if (arg === '-h' || arg === '--help') {
      process.stdout.write(USAGE);
      process.exit(0);
    } else if (arg.startsWith('-')) {
      badInvocation(`unknown option: ${arg}`);
    } else if (repo === null) {
      repo = arg;
    } else {
      badInvocation(`unexpected argument: ${arg}`);
    }
  }

  if (repo === null) badInvocation('missing <repo-path>');
  return { repo: resolve(repo), repoDisplay: repo, dryRun, json, force, showDiff };
}

/* ------------------------------------------------------------------------- */
/* Markdown helpers                                                          */
/* ------------------------------------------------------------------------- */

const clean = (s) => s
  .trim()
  .replace(/^\*\*|\*\*$/g, '')
  .replace(/^`+|`+$/g, '')
  .replace(/\s*\((?:from|source|via|see|per)\b[^)]*\)\s*$/i, '')
  .replace(/\s*<!--[^>]*-->\s*$/i, '')
  .trim();

const normHeading = (s) => s.trim().toLowerCase().replace(/\s+/g, ' ');

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

function rowCells(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isSeparator(line) {
  const t = line.trim();
  return t.startsWith('|') && /^[\s|:-]+$/.test(t) && t.includes('-');
}

function findTables(lines) {
  const tables = [];
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].trim().startsWith('|') || !isSeparator(lines[i + 1])) continue;
    let end = i + 2;
    while (end < lines.length && lines[end].trim().startsWith('|')) end++;
    const header = rowCells(lines[i]);
    const rows = [];
    for (let k = i + 2; k < end; k++) {
      const cells = rowCells(lines[k]);
      if (cells.length === 0) continue;
      rows.push({ line: lines[k], key: clean(cells[0]), cells });
    }
    tables.push({
      start: i,
      end,
      headerLine: lines[i],
      separatorLine: lines[i + 1],
      header,
      rows,
    });
    i = end - 1;
  }
  return tables;
}

const isFieldTable = (table) =>
  table.header.some((cell) => clean(cell).toLowerCase() === 'field');

const headerKey = (cells) => cells.map(clean).join('|').toLowerCase();

const rowValue = (cells) => cells.slice(1).join(' | ').trim();

function fieldValue(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let m = text.match(new RegExp(
    `^\\s*\\|\\s*\\*?\\*?${escaped}\\*?\\*?\\s*\\|\\s*([^|]+?)\\s*\\|`, 'im'));
  if (m) return clean(m[1]) || null;
  m = text.match(new RegExp(
    `^\\s*[-*]?\\s*\\*?\\*?${escaped}\\*?\\*?\\s*:\\s*(.+)$`, 'im'));
  return m ? (clean(m[1]) || null) : null;
}

function boldFields(text) {
  const fields = {};
  for (const m of text.matchAll(/^\*\*([^*]+):\*\*\s*(.*)$/gm)) {
    fields[m[1].trim().toLowerCase()] = m[2].trim();
  }
  return fields;
}

function detectPaperDir(text) {
  const raw = fieldValue(text, 'Paper Path') || fieldValue(text, 'Paper Directory');
  const value = raw ? clean(raw) : '';
  return value && value.toLowerCase() !== 'none' ? value.replace(/\/+$/, '') : 'paper';
}

function buildSubstitutions(text, pluginVersion) {
  const bold = boldFields(text);
  const paperDir = detectPaperDir(text);
  const construction = (fieldValue(text, 'Construction Path') || 'llm/construction')
    .replace(/\/+$/, '');
  const memoryBank = (fieldValue(text, 'Memory Bank') || 'llm/memory_bank')
    .replace(/\/+$/, '');
  const mainTex = fieldValue(text, 'Main Tex') || 'main.tex';
  const bib = fieldValue(text, 'Bibliography') || `${paperDir}/references.bib`;
  const govRaw = fieldValue(text, 'Governance delta present') || 'no';
  const gov = (govRaw.match(/\b(yes|no)\b/i) || [, 'no'])[1].toLowerCase();
  const title = (text.match(/^#\s+Research Delta:\s*(.+)$/m) || [, 'the project'])[1].trim();
  const date = fieldValue(text, 'Last updated') || 'unknown';
  const notCaptured = 'Not yet captured — run /research:audit after filling this in';

  return {
    PROJECT_NAME: title,
    DATE: date,
    VERSION: pluginVersion,
    PAPER_TYPE: fieldValue(text, 'Type') || 'research-paper',
    ABOUT: bold.about || notCaptured,
    CONTRIBUTION: bold['core claim / contribution'] || notCaptured,
    WORK_STATE: bold['state of the work'] || notCaptured,
    AUDIENCE: bold.audience || notCaptured,
    COAUTHORS: bold['co-authors'] || 'none',
    BUILDS_ON: bold['builds on'] || 'not captured',
    PAPER_DIR: paperDir,
    MAIN_TEX: mainTex,
    BIB_PATH: bib,
    CONSTRUCTION_DIR: construction,
    MEMORY_BANK_DIR: memoryBank,
    VENUE: fieldValue(text, 'Venue') || 'none',
    LATEX_TEMPLATE: fieldValue(text, 'Template') || 'article',
    TEMPLATE_FILES: fieldValue(text, 'Template files') || 'bundled',
    PAGE_LIMIT: fieldValue(text, 'Page Limit') || '0',
    PAGE_LIMIT_SCOPE: fieldValue(text, 'Page Limit Counts') || 'body only',
    DEADLINE: fieldValue(text, 'Submission Deadline') || 'none',
    PORTAL: fieldValue(text, 'Submission Portal') || 'none',
    ANONYMOUS: fieldValue(text, 'Anonymised') || 'no',
    OWN_BIB: fieldValue(text, 'Path') || 'none',
    HAS_GOVERNANCE: gov,
  };
}

function substitute(text, subs) {
  return text.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(subs, key) ? subs[key] : '');
}

/* ------------------------------------------------------------------------- */
/* Delta merge                                                               */
/* ------------------------------------------------------------------------- */

function mergeSection(sectionLines, templateSection, subs) {
  const lines = [...sectionLines];
  const changes = [];
  const templateTables = findTables(templateSection.lines).filter(isFieldTable);

  for (const templateTable of templateTables) {
    const currentTables = findTables(lines).filter(isFieldTable);
    const deltaTable = currentTables.find(
      (table) => headerKey(table.header) === headerKey(templateTable.header)
    ) || currentTables[0];

    const templateRows = templateTable.rows;
    const templateIndex = new Map(templateRows.map((row, i) => [row.key.toLowerCase(), i]));

    if (!deltaTable) {
      const tableLines = [
        templateTable.headerLine,
        templateTable.separatorLine,
        ...templateRows.map((row) => substitute(row.line, subs)),
      ];
      let insertAt = lines.length;
      while (insertAt > 0 && lines[insertAt - 1].trim() === '') insertAt--;
      lines.splice(insertAt, 0, '', ...tableLines);
      changes.push({ action: 'add-table', section: templateSection.heading });
      for (const row of templateRows) {
        changes.push({
          action: 'add-row',
          section: templateSection.heading,
          field: row.key,
          value: rowValue(rowCells(substitute(row.line, subs))),
        });
      }
      continue;
    }

    const existingKeys = new Set(deltaTable.rows.map((row) => row.key.toLowerCase()));
    const merged = deltaTable.rows.map((row) => ({
      line: row.line,
      key: row.key,
      templateIndex: templateIndex.has(row.key.toLowerCase())
        ? templateIndex.get(row.key.toLowerCase())
        : Number.MAX_SAFE_INTEGER,
    }));

    for (const row of templateRows) {
      const key = row.key.toLowerCase();
      if (existingKeys.has(key)) continue;

      const line = substitute(row.line, subs);
      const newRow = {
        line,
        key: row.key,
        templateIndex: templateIndex.get(key),
      };
      let position = merged.findIndex((r) => r.templateIndex > newRow.templateIndex);
      if (position === -1) position = merged.length;
      merged.splice(position, 0, newRow);

      changes.push({
        action: 'add-row',
        section: templateSection.heading,
        field: row.key,
        value: rowValue(rowCells(line)),
      });
    }

    lines.splice(
      deltaTable.start,
      deltaTable.end - deltaTable.start,
      deltaTable.headerLine,
      deltaTable.separatorLine,
      ...merged.map((row) => row.line),
    );
  }

  return { lines, changes };
}

function trimBlankEdges(lines) {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === '') start++;
  while (end > start && lines[end - 1].trim() === '') end--;
  return lines.slice(start, end);
}

function mergeDelta(deltaText, templateText, subs) {
  const lines = deltaText.split('\n');
  const templateSections = findSections(templateText.split('\n'));
  const templateByName = new Map(
    templateSections.map((section) => [normHeading(section.heading), section])
  );
  const templateOrder = new Map(
    templateSections.map((section, i) => [normHeading(section.heading), i])
  );
  const changes = [];

  const originalHeadings = findSections(lines).map((section) => section.heading);
  for (const heading of originalHeadings) {
    const templateSection = templateByName.get(normHeading(heading));
    if (!templateSection) continue;
    const current = findSections(lines).find(
      (section) => normHeading(section.heading) === normHeading(heading)
    );
    if (!current) continue;
    const merged = mergeSection(lines.slice(current.start, current.end), templateSection, subs);
    lines.splice(current.start, current.end - current.start, ...merged.lines);
    changes.push(...merged.changes);
  }

  for (let ti = 0; ti < templateSections.length; ti++) {
    const templateSection = templateSections[ti];
    const key = normHeading(templateSection.heading);
    const currentSections = findSections(lines);
    if (currentSections.some((section) => normHeading(section.heading) === key)) continue;

    const block = trimBlankEdges(
      templateSection.lines.map((line) => substitute(line, subs))
    );

    let position = currentSections.findIndex((section) => {
      const index = templateOrder.get(normHeading(section.heading));
      return index !== undefined && index > ti;
    });
    if (position === -1) {
      while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
      lines.push('', ...block, '');
    } else {
      const target = currentSections[position];
      const insert = [...block, ''];
      if (target.start > 0 && lines[target.start - 1].trim() !== '') insert.unshift('');
      lines.splice(target.start, 0, ...insert);
    }

    changes.push({ action: 'add-section', section: templateSection.heading });
    for (const table of findTables(templateSection.lines).filter(isFieldTable)) {
      for (const row of table.rows) {
        const line = substitute(row.line, subs);
        changes.push({
          action: 'add-row',
          section: templateSection.heading,
          field: row.key,
          value: rowValue(rowCells(line)),
        });
      }
    }
  }

  return { text: lines.join('\n'), changes };
}

/* ------------------------------------------------------------------------- */
/* Version pin                                                               */
/* ------------------------------------------------------------------------- */

const PIN = /(agentic-research[ \t]*(?:\|[ \t]*)?v)(\d+\.\d+(?:\.\d+)?)/i;

function updateVersionPin(text, pluginVersion) {
  const lines = text.split('\n');
  const candidates = [];
  for (let i = 0; i < lines.length; i++) {
    if (PIN.test(lines[i])) candidates.push(i);
  }

  if (candidates.length > 0) {
    const labelled = candidates.find((i) =>
      /^\s*(?:[-*]\s*)?(?:\*\*)?Research(?:\*\*)?\s*[:|]/i.test(lines[i])
    );
    const index = labelled === undefined ? candidates[0] : labelled;
    const from = lines[index].match(PIN)[2];
    if (from !== pluginVersion) {
      lines[index] = lines[index].replace(PIN, `$1${pluginVersion}`);
      return {
        text: lines.join('\n'),
        change: { action: 'update-version', from, to: pluginVersion },
      };
    }
    return { text, change: null };
  }

  const pinLine = `Research: agentic-research v${pluginVersion}`;
  let insertAt = lines.findIndex((line) => /^Last updated\s*:/i.test(line));
  if (insertAt >= 0) {
    insertAt += 1;
  } else {
    const title = lines.findIndex((line) => /^#\s+/.test(line));
    insertAt = title >= 0 ? title + 1 : 0;
  }
  lines.splice(insertAt, 0, pinLine);
  return {
    text: lines.join('\n'),
    change: { action: 'add-version', version: pluginVersion },
  };
}

/* ------------------------------------------------------------------------- */
/* Plugin-owned scripts                                                      */
/* ------------------------------------------------------------------------- */

function pluginScripts() {
  const templatesDir = join(PLUGIN_ROOT, 'templates', 'scripts');
  const scripts = readdirSync(templatesDir)
    .filter((name) => name !== '_paths.sh' && name !== 'RELEASED-HASHES.json')
    .filter((name) => statSync(join(templatesDir, name)).isFile())
    .map((name) => ({ name, source: join(templatesDir, name) }));
  scripts.push({
    name: 'research-checks.mjs',
    source: join(PLUGIN_ROOT, 'scripts', 'research-checks.mjs'),
  });
  return scripts.sort((a, b) => a.name.localeCompare(b.name));
}

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function releasedHashes() {
  if (!existsSync(RELEASED_HASHES_PATH)) return {};
  return JSON.parse(readFileSync(RELEASED_HASHES_PATH, 'utf8'));
}

function splitLines(text) {
  const lines = text.split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

function lineDiff(a, b) {
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: ' ', line: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: '-', line: a[i] });
      i++;
    } else {
      ops.push({ type: '+', line: b[j] });
      j++;
    }
  }
  while (i < n) ops.push({ type: '-', line: a[i++] });
  while (j < m) ops.push({ type: '+', line: b[j++] });
  return ops;
}

function unifiedDiff(oldText, newText, relPath, context = 3) {
  const ops = lineDiff(splitLines(oldText), splitLines(newText));
  const changed = [];
  for (let i = 0; i < ops.length; i++) {
    if (ops[i].type !== ' ') changed.push(i);
  }
  if (changed.length === 0) return '';

  const ranges = [];
  let start = Math.max(0, changed[0] - context);
  let end = Math.min(ops.length - 1, changed[0] + context);
  for (const index of changed.slice(1)) {
    if (index - context <= end + 1) {
      end = Math.min(ops.length - 1, index + context);
    } else {
      ranges.push([start, end]);
      start = Math.max(0, index - context);
      end = Math.min(ops.length - 1, index + context);
    }
  }
  ranges.push([start, end]);

  const oldBefore = new Array(ops.length + 1);
  const newBefore = new Array(ops.length + 1);
  let oldLine = 1;
  let newLine = 1;
  for (let i = 0; i < ops.length; i++) {
    oldBefore[i] = oldLine;
    newBefore[i] = newLine;
    if (ops[i].type !== '+') oldLine++;
    if (ops[i].type !== '-') newLine++;
  }
  oldBefore[ops.length] = oldLine;
  newBefore[ops.length] = newLine;

  let out = `--- a/${relPath}\n+++ b/${relPath}\n`;
  for (const [from, to] of ranges) {
    let oldCount = 0;
    let newCount = 0;
    for (let i = from; i <= to; i++) {
      if (ops[i].type !== '+') oldCount++;
      if (ops[i].type !== '-') newCount++;
    }
    out += `@@ -${oldBefore[from]},${oldCount} +${newBefore[from]},${newCount} @@\n`;
    for (let i = from; i <= to; i++) {
      out += `${ops[i].type}${ops[i].line}\n`;
    }
  }
  return out;
}

function refreshScripts(repo, paperDir, options) {
  const { dryRun, force, showDiff, released } = options;
  const targetDir = join(repo, paperDir, 'scripts');
  if (!dryRun) mkdirSync(targetDir, { recursive: true });

  const changes = [];
  const kept = [];
  const diffs = [];

  for (const { name, source } of pluginScripts()) {
    const target = join(targetDir, name);
    const rel = relative(repo, target);
    const sourceText = readFileSync(source);
    const exists = existsSync(target) && statSync(target).isFile();

    if (!exists) {
      changes.push({ action: 'add-script', path: rel });
      if (!dryRun) {
        copyFileSync(source, target);
        chmodSync(target, 0o755);
      }
      continue;
    }

    const targetText = readFileSync(target);
    if (targetText.equals(sourceText)) continue;

    const known = Array.isArray(released[name])
      && released[name].includes(sha256(targetText));

    if (!known && !force) {
      kept.push(rel);
      if (showDiff) {
        diffs.push({
          path: rel,
          diff: unifiedDiff(targetText.toString('utf8'), sourceText.toString('utf8'), rel),
        });
      }
      continue;
    }

    changes.push({ action: 'update-script', path: rel });
    if (!dryRun) {
      copyFileSync(source, target);
      chmodSync(target, 0o755);
    }
  }

  return { changes, kept, diffs };
}

/* ------------------------------------------------------------------------- */
/* Main                                                                      */
/* ------------------------------------------------------------------------- */

function main() {
  const { repo, repoDisplay, dryRun, json, force, showDiff } =
    parseArgs(process.argv.slice(2));
  const deltaPath = join(repo, DELTA_REL);

  if (!existsSync(deltaPath) || !statSync(deltaPath).isFile()) {
    process.stderr.write(`upgrade: ${DELTA_REL} not found in ${repoDisplay}\n`);
    process.exit(1);
  }

  const pluginVersion = readFileSync(VERSION_PATH, 'utf8').trim();
  const templateText = readFileSync(TEMPLATE_PATH, 'utf8');
  const deltaText = readFileSync(deltaPath, 'utf8');
  const subs = buildSubstitutions(deltaText, pluginVersion);

  const merged = mergeDelta(deltaText, templateText, subs);
  const changes = [...merged.changes];

  const paperDir = detectPaperDir(deltaText);
  const scripts = refreshScripts(repo, paperDir, {
    dryRun,
    force,
    showDiff,
    released: releasedHashes(),
  });
  changes.push(...scripts.changes);

  const pinned = updateVersionPin(merged.text, pluginVersion);
  if (pinned.change) changes.push(pinned.change);

  if (!dryRun && pinned.text !== deltaText) {
    writeFileSync(deltaPath, pinned.text);
  }

  if (json) {
    const output = {
      version: pluginVersion,
      repo: repoDisplay,
      delta: DELTA_REL,
      dryRun,
      changes,
      kept: scripts.kept,
    };
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    return;
  }

  process.stdout.write(`agentic-research upgrade ${pluginVersion} -> ${repoDisplay}\n`);
  if (changes.length === 0 && scripts.kept.length === 0) {
    process.stdout.write('  no changes; already current\n');
  } else {
    for (const change of changes) {
      if (change.action === 'add-section') {
        process.stdout.write(`  + section: ${change.section}\n`);
      } else if (change.action === 'add-table') {
        process.stdout.write(`  + table: ${change.section}\n`);
      } else if (change.action === 'add-row') {
        process.stdout.write(
          `  + row: ${change.section} / ${change.field} = ${change.value}\n`
        );
      } else if (change.action === 'add-script') {
        process.stdout.write(`  + script: ${change.path}\n`);
      } else if (change.action === 'update-script') {
        process.stdout.write(`  ~ script: ${change.path}\n`);
      } else if (change.action === 'update-version') {
        process.stdout.write(`  ~ version: v${change.from} -> v${change.to}\n`);
      } else if (change.action === 'add-version') {
        process.stdout.write(`  + version: v${change.version}\n`);
      }
    }
    for (const path of scripts.kept) {
      process.stdout.write(`  ! locally modified: ${path} (kept; plugin copy differs)\n`);
    }
    if (showDiff) {
      for (const { diff } of scripts.diffs) process.stdout.write(diff);
    }
  }
  if (dryRun) process.stdout.write('  dry run: nothing written\n');
}

main();
