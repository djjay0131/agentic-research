---
name: audit
description: Audit the current repo against the agentic-research plugin - delta freshness and version pin, layout drift, citation matrix coverage, unverified references, placeholder text, page limit, stale memory bank, vendored copies that should be installed dependencies, and governance-delta composition. Use before a submission deadline or when a repo has drifted.
argument-hint: "[repo-path (default: cwd)] [--fix]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# research:audit

Report how far this repo has drifted from the plugin it pins. Read-only by
default; `--fix` may repair only the plugin-owned files named in §6.

## 1. Delta

- `docs/research-delta.md` exists? If not: stop, tell the user to run
  `/research:establish`.
- Version pin present, and how far behind `${CLAUDE_PLUGIN_ROOT}/../VERSION`?
- Any `{{PLACEHOLDER}}` left unfilled?
- Do the declared paths exist on disk? A delta that points at a directory that
  was renamed is the most common failure, and every agent inherits it.

## 2. Mechanical checks

Run `node scripts/research-checks.mjs --compile` and fold its output in. If the
script is missing or older than the plugin's copy, say so (`--fix` refreshes it).

## 3. Citations

- Every `\cite` key resolves in the `.bib` (FAIL if not)
- Orphan `.bib` entries (WARN)
- `references.json` exists and covers every cited key
- Count unverified records, and **list every `NOT_FOUND` by key** — those are
  possibly fabricated references and belong at the top of the report
- Matrix mirror is in sync with the JSON

## 3b. Is the paper actually described?

- Does the delta's **The Research** section still say `{{ABOUT}}` or
  "not captured"? Report it — an agent working from an empty brief will
  confidently produce off-target work, and nothing else in this audit catches it.
- Does `<memory-bank>/projectbrief.md` describe the research, or is it still the
  template? Same finding.
- Does the **Template** field contain `PLACEHOLDER`? Then the repo is building
  with a stand-in class and the venue's real template never arrived. Report it as
  a FAIL if a deadline is within 30 days, otherwise a warning, and say what to
  do: drop the class file into `<paper>/`, update `\documentclass` and the
  Template field, rebuild.

## 4. Deadline and budget

If the delta declares a deadline, report days remaining. Report current page
count against the limit, and run `./scripts/wordcount.sh` for the per-section
picture. Approaching a deadline over the page limit is the finding that
actually matters to the author.

## 5. Memory bank

- Core files present (`activeContext.md`, `projectbrief.md`, `progress.md`)
- `activeContext.md` older than the newest commit touching `<paper>/`? Then it
  is stale — the repo has moved on and the memory has not.

## 6. Vendored copies (the drift this plugin exists to end)

Flag anything that should be an installed dependency instead of a copy:

- `.claude/agents/` containing any of: `paper-agent`, `proposal-agent`,
  `position-paper-agent`, `latex-agent`, `review-agent`, `citation-agent`,
  `originality-agent` — these now come from the plugin. Diff each against the
  plugin's version and report whether the local copy has real changes worth
  upstreaming, or is just stale.
- `.claude/skills/constellize*` or `design:tui-*` — third-party content that
  should be installed from its own marketplace.
- Copied `agentic-governance` agents (`chief-architect`, `chief-reviewer`,
  `chief-product-officer`, `repository-steward`) or renamed governance skills —
  install the `governance` plugin instead.

`--fix` may: refresh `scripts/*` and `scripts/research-checks.mjs`, add missing
delta fields, and regenerate the citation matrix from `references.json`. It may
**not** delete vendored agents, edit prose, or touch `docs/governance-delta.md`.

## 7. Governance composition

**Reverse-order adoption.** If `docs/governance-delta.md` exists but the research
delta says `Governance delta present: no`, governance was adopted *after* this
repo was scaffolded. Nothing printed the L0 denials at the time, and no path was
ever mirrored. Report it as a FAIL, and with `--fix` set the field to `yes` and
mirror the governance delta's memory-bank path into the third column. Print the
denial lines for the user to paste — never edit the governance delta yourself.

If `docs/governance-delta.md` exists:

- Does its L0 allowlist deny `<paper>/**` and `<construction>/**`? If not, this
  is a **FAIL**: an L0 fast track that can reach the draft would let an agent
  merge prose without human review. Print the exact lines to add.
- Do the two deltas disagree about the memory-bank path? The governance delta wins.
- Report both version pins.

## Output

```markdown
## Research Audit — <repo> — YYYY-MM-DD

Pinned: agentic-research v0.9  ·  Current: v1.0  (1 minor behind)
Deadline: 2026-09-14 — 14 days

### ⛔ Fail (3)
- citations.missing — \cite{chen2023} has no bib entry (03_approach.tex:88)
- governance — L0 allowlist does not deny paper/**; add: deny paper/**
- page-limit — 11 pages, limit is 10

### ⚠ Warn (4)
- 6 bib entries never cited
- activeContext.md is 12 commits stale
- .claude/agents/paper-agent.md is a vendored copy, 2 versions behind
- constellize skills vendored in .claude/skills/ — install the plugin instead

### ✓ Pass (9)
…

**Do first:** the missing citation and the page limit — both block submission.
```

End with the single highest-value next action, not a list. The author is
usually short on time.
