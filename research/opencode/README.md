# OpenCode support

`agentic-research` ships one source: the Claude Code plugin under `research/`.
`install.mjs` generates the OpenCode copies from it. Do not edit the generated
files; re-run the installer after updating the plugin.

The installer is dependency-free and needs Node 18+.

## Install

From a checkout of this repository:

```bash
node research/opencode/install.mjs
```

That writes global OpenCode files under `~/.config/opencode/`:

| Generated | From |
|---|---|
| `skills/research-<skill>/SKILL.md` | `research/skills/<skill>/SKILL.md` |
| `agents/research-<agent>.md` | `research/agents/<agent>.md` |
| `commands/research-<skill>.md` | one thin command per skill |

OpenCode command names come from the file name, so the commands are
`/research-add-paper`, `/research-peer-review`, and so on. Names are prefixed
`research-` because OpenCode skill names cannot contain `:`.

Start a new OpenCode session after installing so it discovers the new skills,
agents and commands.

Any other files beside a source `SKILL.md` are symlinked into the generated
skill directory. The source tree is never modified.

## Update

Pull the new plugin version and run the installer again:

```bash
git pull
node research/opencode/install.mjs
```

It is idempotent: files whose content has not changed are left untouched, so a
second run changes nothing.

## Uninstall

```bash
node research/opencode/install.mjs --uninstall
```

The installer owns exactly the paths listed in
`~/.config/opencode/research-install.json`. Uninstall removes those files and
the manifest, and leaves every other skill, agent or command alone.

## Options

```text
--prefix <dir>  OpenCode config directory (default: ~/.config/opencode)
--uninstall     Remove the files listed in research-install.json
--dry-run       Print what would change; write nothing
-h, --help      Show help
```

Use `--prefix` to install somewhere else, or to try the installer in a temp
directory:

```bash
tmp=$(mktemp -d)
node research/opencode/install.mjs --prefix "$tmp" --dry-run
node research/opencode/install.mjs --prefix "$tmp"
node research/opencode/install.mjs --prefix "$tmp" --uninstall
```

## What the generated files contain

OpenCode does not set `${CLAUDE_PLUGIN_ROOT}`, so every generated Markdown body
has the absolute path of this `research/` directory substituted for it. That
keeps the existing references to templates, the version file and the check
script working under both harnesses.

### Skills

Generated skill frontmatter is only:

```yaml
---
name: research-<skill>
description: <the source description>
---
```

`allowed-tools` and `argument-hint` are Claude Code fields; OpenCode ignores
them and they are not copied.

### Agents

Every agent is generated with `mode: subagent`, so the primary OpenCode agent
delegates to it. Its permissions are translated from the source
`allowed-tools`:

| Source `allowed-tools` lacks | Generated permission |
|---|---|
| `Write` and `Edit` | `edit: deny` |
| `Bash` | `bash: deny` |
| `WebFetch` | `webfetch: deny` |

The methods, venue and reader reviewers have no `Edit`, but they must write
their one review file. OpenCode 1.18.35 folds edit, write and patch into one
`edit` permission, so `edit: deny` would also forbid that write. The installer
therefore scopes each reviewer's `edit` permission to its own review file name:

```yaml
permission:
  edit:
    "*": deny
    "**/reviews/*/methods.md": allow
    "*/reviews/*/methods.md": allow
```

They can write their review record and cannot edit the paper. `bash` and
`webfetch` follow the same table.

## Confirmed against OpenCode 1.18.35

The design was checked against the installed `~/.opencode/bin/opencode`
(1.18.35), its documentation, `opencode --help`, and throwaway files loaded via
`XDG_CONFIG_HOME`:

- Global skills in `<config>/opencode/skills/<id>/SKILL.md` are discovered by
  `opencode debug skill`. Skills under `~/.claude/skills` are discovered too.
- Skill frontmatter exposes `name` and `description`; `allowed-tools` and
  `argument-hint` do not appear in the loaded skill.
- Global agents in `<config>/opencode/agents/<name>.md` are discovered, with
  the file name as the agent name; `mode: subagent` is accepted.
- Global commands in `<config>/opencode/commands/<name>.md` are discovered and
  `$ARGUMENTS` is substituted into the command template.
- `--prefix` is an option of this installer, not of the `opencode` CLI.
- OpenCode 1.18.35 reads V1 agent permissions from a nested `permission:` map.
  Top-level `edit: deny`, `bash: deny` and `webfetch: deny` are accepted into
  the agent's unused `options` and do **not** disable the tools. Use the nested
  form above.
- In V1, denying `edit` also disables the `write` tool. Path-scoped `edit`
  rules are accepted, which is why the reviewers use a path scope rather than
  `edit: deny`.
- `task: deny` under `permission` disables the `task` tool, which is how a
  source agent's `Task` permission is expressed. The peer-review skill spawns
  its personas through that mechanism.

## Tests

```bash
node research/opencode/install.test.mjs
```

The suite installs into temp prefixes and checks every generated skill, agent
and command, the permission translation, the manifest, idempotence, dry-run,
and that uninstall removes exactly the manifest's files. It uses no npm
dependencies, and two runs produce identical output.
