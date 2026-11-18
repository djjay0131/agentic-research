#!/usr/bin/env node
/**
 * install.mjs — generate OpenCode artifacts from the Claude Code plugin.
 *
 * The Claude Code plugin in research/ stays the single source. This script
 * reads every skill and agent, writes OpenCode skill, agent and command files
 * under a prefix (default ~/.config/opencode), and records what it owns in
 * research-install.json so --uninstall can remove exactly that.
 *
 * Dependency-free. Node 18+.
 *
 *   node research/opencode/install.mjs
 *   node research/opencode/install.mjs --prefix /tmp/opencode-test
 *   node research/opencode/install.mjs --dry-run
 *   node research/opencode/install.mjs --uninstall
 */
import {
  existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync,
  rmdirSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(HERE, '..');
const MANIFEST = 'research-install.json';
const REVIEWERS = new Map([
  ['methods-reviewer', 'methods'],
  ['venue-reviewer', 'venue'],
  ['reader-reviewer', 'reader'],
]);

const USAGE = `Generate OpenCode support files from the agentic-research plugin.

Usage:
  node research/opencode/install.mjs [--prefix <dir>] [--dry-run]
  node research/opencode/install.mjs --uninstall [--prefix <dir>] [--dry-run]

Options:
  --prefix <dir>  OpenCode config directory (default: ~/.config/opencode)
  --uninstall     Remove the files listed in research-install.json
  --dry-run       Print what would change; write nothing
  -h, --help      Show this help

Generated names are prefixed research- because OpenCode skill names cannot
contain ":". The source plugin is never edited.
`;

function parseArgs(argv) {
  const opts = {
    prefix: join(homedir(), '.config', 'opencode'),
    uninstall: false,
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--prefix') {
      const value = argv[++i];
      if (!value) throw new Error('--prefix requires a directory');
      opts.prefix = resolve(value);
    } else if (arg === '--uninstall') {
      opts.uninstall = true;
    } else if (arg === '--dry-run') {
      opts.dryRun = true;
    } else if (arg === '-h' || arg === '--help') {
      opts.help = true;
    } else if (arg.startsWith('-')) {
      throw new Error(`unknown option: ${arg}`);
    } else {
      throw new Error(`unexpected argument: ${arg}`);
    }
  }

  opts.prefix = resolve(opts.prefix);
  return opts;
}

function readVersion() {
  for (const candidate of [join(PLUGIN_ROOT, '..', 'VERSION'),
                           join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json')]) {
    try {
      const text = readFileSync(candidate, 'utf8').trim();
      if (candidate.endsWith('.json')) return JSON.parse(text).version || 'unknown';
      if (text) return text;
    } catch {
      // Try the next source.
    }
  }
  return 'unknown';
}

function splitFrontmatter(text, file) {
  const match = text.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) throw new Error(`${file}: missing YAML frontmatter`);
  const fields = {};
  for (const raw of match[1].split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    fields[kv[1]] = value;
  }
  return { fields, body: text.slice(match[0].length) };
}

function yamlScalar(value) {
  const needsQuote =
    /\r|\n/.test(value) ||
    /:\s/.test(value) ||
    /\s#/.test(value) ||
    /^\s|\s$/.test(value) ||
    /^[-?:,[\]{}#&*!|>'"%@`]/.test(value);
  if (!needsQuote) return value;
  return `'${value.replaceAll("'", "''")}'`;
}

function bodyFor(text, file) {
  const { body } = splitFrontmatter(text, file);
  return body.split('${CLAUDE_PLUGIN_ROOT}').join(PLUGIN_ROOT);
}

function toolSet(fields) {
  return new Set((fields['allowed-tools'] || '')
    .split(',')
    .map((tool) => tool.trim())
    .filter(Boolean));
}

function permissionBlock(name, tools) {
  const lines = ['permission:'];
  const persona = REVIEWERS.get(name);

  if (persona) {
    // OpenCode 1.18.35 folds edit, write and patch into one "edit" permission.
    // It can scope that permission by path, so each reviewer can write its own
    // review file without being able to edit the paper.
    lines.push('  edit:');
    lines.push('    "*": deny');
    lines.push(`    "**/reviews/*/${persona}.md": allow`);
    lines.push(`    "*/reviews/*/${persona}.md": allow`);
  } else if (!tools.has('Write') && !tools.has('Edit')) {
    lines.push('  edit: deny');
  }

  if (!tools.has('Bash')) lines.push('  bash: deny');
  if (!tools.has('WebFetch')) lines.push('  webfetch: deny');
  return lines.length > 1 ? lines.join('\n') : '';
}

function skillFiles() {
  const skillsRoot = join(PLUGIN_ROOT, 'skills');
  const names = readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const files = [];

  for (const name of names) {
    const sourceDir = join(skillsRoot, name);
    const sourceFile = join(sourceDir, 'SKILL.md');
    const sourceText = readFileSync(sourceFile, 'utf8');
    const { fields } = splitFrontmatter(sourceText, sourceFile);
    const openName = `research-${name}`;
    const outDir = join('skills', openName);
    const content = [
      '---',
      `name: ${yamlScalar(openName)}`,
      `description: ${yamlScalar(fields.description || '')}`,
      '---',
      bodyFor(sourceText, sourceFile),
    ].join('\n');

    files.push({ kind: 'file', rel: join(outDir, 'SKILL.md'), content });

    for (const extra of readdirSync(sourceDir, { withFileTypes: true })
      .map((entry) => entry.name)
      .filter((entry) => entry !== 'SKILL.md')
      .sort()) {
      files.push({
        kind: 'symlink',
        rel: join(outDir, extra),
        target: join(sourceDir, extra),
      });
    }
  }

  return { names, files };
}

function agentFiles() {
  const agentsRoot = join(PLUGIN_ROOT, 'agents');
  const names = readdirSync(agentsRoot)
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => entry.slice(0, -3))
    .sort();
  const files = [];

  for (const name of names) {
    const sourceFile = join(agentsRoot, `${name}.md`);
    const sourceText = readFileSync(sourceFile, 'utf8');
    const { fields } = splitFrontmatter(sourceText, sourceFile);
    const permission = permissionBlock(name, toolSet(fields));
    const frontmatter = [
      '---',
      `description: ${yamlScalar(fields.description || '')}`,
      'mode: subagent',
    ];
    if (permission) frontmatter.push(permission);
    frontmatter.push('---', bodyFor(sourceText, sourceFile));
    const content = frontmatter.join('\n');

    files.push({ kind: 'file', rel: join('agents', `research-${name}.md`), content });
  }

  return { names, files };
}

function commandFiles(skillNames) {
  return skillNames.map((name) => {
    const sourceFile = join(PLUGIN_ROOT, 'skills', name, 'SKILL.md');
    const { fields } = splitFrontmatter(readFileSync(sourceFile, 'utf8'), sourceFile);
    const openName = `research-${name}`;
    const content = [
      '---',
      `description: ${yamlScalar(fields.description || '')}`,
      '---',
      `Use the \`skill\` tool to load the \`${openName}\` skill and follow it.`,
      '',
      'Arguments: $ARGUMENTS',
      '',
    ].join('\n');
    return { kind: 'file', rel: join('commands', `${openName}.md`), content };
  });
}

function sameFile(abs, content) {
  try {
    if (!lstatSync(abs).isFile()) return false;
    return readFileSync(abs, 'utf8') === content;
  } catch {
    return false;
  }
}

function sameSymlink(abs, target) {
  try {
    return lstatSync(abs).isSymbolicLink() && readlinkSync(abs) === target;
  } catch {
    return false;
  }
}

function ensureParent(abs) {
  mkdirSync(dirname(abs), { recursive: true });
}

function removePath(abs) {
  try {
    const stat = lstatSync(abs);
    if (stat.isDirectory() && !stat.isSymbolicLink()) rmSync(abs, { recursive: true, force: true });
    else rmSync(abs, { force: true });
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

function applyInstall(prefix, files, version, dryRun) {
  const manifest = {
    version,
    plugin_root: PLUGIN_ROOT,
    files: files.map((file) => file.rel.split(sep).join('/')).sort(),
  };
  const operations = files.concat([{
    kind: 'file',
    rel: MANIFEST,
    content: `${JSON.stringify(manifest, null, 2)}\n`,
  }]);

  let changed = 0;
  let unchanged = 0;

  for (const operation of operations) {
    const abs = join(prefix, operation.rel);
    if (operation.kind === 'file') {
      const same = sameFile(abs, operation.content);
      if (same) {
        unchanged++;
        if (dryRun) console.log(`unchanged  ${operation.rel}`);
        continue;
      }
      changed++;
      console.log(`${dryRun ? 'would write' : 'write'}  ${operation.rel}`);
      if (!dryRun) {
        ensureParent(abs);
        writeFileSync(abs, operation.content);
      }
    } else {
      const same = sameSymlink(abs, operation.target);
      if (same) {
        unchanged++;
        if (dryRun) console.log(`unchanged  ${operation.rel}`);
        continue;
      }
      changed++;
      console.log(`${dryRun ? 'would link' : 'link'}   ${operation.rel} -> ${operation.target}`);
      if (!dryRun) {
        ensureParent(abs);
        removePath(abs);
        symlinkSync(operation.target, abs);
      }
    }
  }

  const verb = dryRun ? 'Dry run' : 'Installed';
  console.log(`\n${verb}: agentic-research ${version} -> ${prefix} (${changed} changed, ${unchanged} unchanged)`);
  return changed;
}

function pruneEmptySkillDirs(prefix, absFile) {
  const skillsRoot = resolve(prefix, 'skills');
  let dir = dirname(absFile);
  while (dir !== skillsRoot && dir.startsWith(`${skillsRoot}${sep}`)) {
    try {
      if (readdirSync(dir).length > 0) break;
      rmdirSync(dir);
    } catch {
      break;
    }
    dir = dirname(dir);
  }
}

function applyUninstall(prefix, dryRun) {
  const manifestPath = join(prefix, MANIFEST);
  if (!existsSync(manifestPath)) {
    console.log(`No manifest at ${manifestPath}; nothing to uninstall.`);
    return 0;
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    throw new Error(`${manifestPath}: ${err.message}`);
  }
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  let removed = 0;
  let absent = 0;

  for (const rel of files) {
    const abs = resolve(prefix, rel);
    const root = resolve(prefix);
    if (abs !== root && !abs.startsWith(`${root}${sep}`)) {
      throw new Error(`refusing to remove path outside prefix: ${rel}`);
    }

    let exists = false;
    try {
      lstatSync(abs);
      exists = true;
    } catch {
      exists = false;
    }

    if (!exists) {
      absent++;
      continue;
    }

    console.log(`${dryRun ? 'would remove' : 'remove'}  ${rel}`);
    if (!dryRun) {
      rmSync(abs, { force: true });
      pruneEmptySkillDirs(prefix, abs);
    }
    removed++;
  }

  console.log(`${dryRun ? 'would remove' : 'remove'}  ${MANIFEST}`);
  if (!dryRun) rmSync(manifestPath, { force: true });

  const verb = dryRun ? 'Dry run' : 'Uninstalled';
  console.log(`\n${verb}: ${removed} file(s) removed, ${absent} already absent.`);
  return removed;
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`error: ${err.message}\n`);
    console.error(USAGE);
    process.exit(2);
  }

  if (opts.help) {
    console.log(USAGE);
    return;
  }

  const version = readVersion();

  try {
    if (opts.uninstall) {
      applyUninstall(opts.prefix, opts.dryRun);
      return;
    }

    const skills = skillFiles();
    const agents = agentFiles();
    const commands = commandFiles(skills.names);
    applyInstall(opts.prefix, skills.files.concat(agents.files, commands), version, opts.dryRun);
  } catch (err) {
    console.error(`error: ${err.message}`);
    process.exit(1);
  }
}

main();
