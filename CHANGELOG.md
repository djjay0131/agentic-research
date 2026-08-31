# Changelog

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
