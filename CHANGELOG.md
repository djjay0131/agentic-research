# Changelog

## 1.1.0 — 2026-08-31

Layout change, from testing `/research:establish` on a real repo.

### The paper subtree is now self-contained
`figures/`, `scripts/` and `build/` moved from the repo root to inside
`<paper>/`. The whole subtree can now be moved or copied to another repo
intact, and a repo that also holds source code has no collision between `src/`
and the paper's own `scripts/` or `build/`.

`files/` stays at the repo root by design — source material is often needed by
the code side too.

### `construction/` and the memory bank live under `llm/`
`establish` was scaffolding a bare `construction/` at the repo root. The default
is now `llm/construction/` and `llm/memory_bank/`, matching the newest layout in
the portfolio.

### Also
- `_paths.sh` derives `PAPER_ROOT` from its own location and `REPO_ROOT` from
  git, so the scripts need no path substitution beyond `MAIN_TEX` and `PAGE_LIMIT`.
- `research-checks.mjs` walks up for `docs/research-delta.md`, so it runs from
  the repo root, from inside the paper subtree, or from CI.
- `\graphicspath` is now `{figures/}` — figures sit beside `main.tex`.
- `overleaf-sync.sh` operates on the repo root and warns that Overleaf needs its
  main document pointed at the subtree.
- `establish` gained an **Upgrade: layout move** section that migrates a pre-v1.1
  repo with `git mv` so history follows.

## 1.0.0 — 2026-08-31

First release. Replaces the practice of copying `template-paper` and its
`.claude/` directory into each new writing project.

### Agents (8)
- `latex-agent` — promoted verbatim from the version that was already
  byte-identical across six repositories.
- `paper-agent`, `position-paper-agent`, `proposal-agent` — reconciled from
  the `soa-agentic-se` lineage. The 23 variants found across the portfolio
  differed *only* in hardcoded layout paths; those are now resolved from
  `docs/research-delta.md`.
- `review-agent` — taken from the `ebay_erupt_2027` lineage, which carried a
  `references.json` canonical store the other copies lacked.
- `memory-agent` — the paper-flavoured lineage. The 6.3 KB code-flavoured
  variant was left behind for a future code plugin.
- `citation-agent` — **new.** Citation work was previously split across
  `review-agent`, `paper-agent survey`, and `latex-agent check-refs`. It is now
  one agent that owns `references.json` and verifies metadata against Crossref,
  arXiv, and OpenAlex rather than trusting the `.bib`.
- `originality-agent` — **new.** No originality or plagiarism check existed in
  any repository in the portfolio.

### Skills (5)
`establish`, `audit`, `add-paper` (rescued from `cv`), `citation-matrix`,
`originality-check`.

### Scripts
`build.sh`, `watch.sh`, `wordcount.sh`, `arxiv-package.sh`, `overleaf-sync.sh`
generalised from `soa-agentic-se` and `reliable-trustworthy-se` — they now read
layout from `scripts/_paths.sh` instead of hardcoding `paper/`.
`research-checks.mjs` is new: dependency-free mechanical verification.

### Composition
`establish` detects `docs/governance-delta.md` and defers to it for memory-bank
and roadmap paths, and prints the L0 allowlist denials the paper layout needs.

### Known limitations
- `originality-agent` compares only against locally available sources. It
  cannot and does not certify originality.
- LaTeX class files come from the user's TeX distribution; `establish` reports
  the `tlmgr install` line when one is missing.
