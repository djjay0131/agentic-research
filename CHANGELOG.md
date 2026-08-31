# Changelog

## 1.3.0 — 2026-08-31

Build output moves back inside the paper subtree: `<paper>/build/`, not a
`build/` at the repo root.

v1.2.0 fixed the real problem — `latexmk -outdir` stops intermediates being
written loose beside `main.tex` — but sent them to a new root-level `build/`.
That added a top-level directory for no benefit the subtree could not provide
itself. The paper now adds **exactly one** top-level entry, and the subtree is
self-contained in source *and* output: move `paper/` to another repo and its
build still works.

`.gitignore` needs one line, `<paper>/build/`. The `paper.clean` check now scans
only the top level of the subtree, since `build/` is where output belongs.

Upgrading from v1.2.0: delete the root `build/` (it is derived) and rebuild.

## 1.2.0 — 2026-08-31

From a real `/research:establish` test run. Six findings, all addressed.

### Build artifacts never touch the paper subtree
`latexmk` ran *in* `<paper>/` and left `main.aux`, `.log`, `.bbl`, `.fls`,
`.fdb_latexmk` and `main.pdf` beside the source, then copied only the PDF out.
The scripts now pass `-outdir`, so the PDF **and** every intermediate land in
`build/<paper>/` at the repo root and the subtree stays source-only.

This also fixes the backwards `.gitignore`: there is no longer a `main.pdf`
beside `main.tex` to accidentally commit. One `build/` line covers everything
derived, for the paper and the code side alike.

### Empty directories now survive a clone
Git does not track empty directories, so `files/`, `figures/`, `archive/` and
the construction dirs vanished on first clone and the checker then reported the
layout as broken. `establish` now writes a `README.md` or `.gitkeep` into every
directory that would otherwise be empty, and a new `clone-safety` check warns
about any that remain.

### Double-blind anonymity is now enforced
A delta saying `Anonymised: yes` alongside a `main.tex` carrying
`\author`/`\affiliation`/`\email` is a desk reject, and nothing caught it.
New `anonymity` check: FAILs on identifying metadata when the delta declares a
double-blind venue, passes when the `anonymous` class option is set and the
metadata is scrubbed, and warns when the option is set but identifying text
remains.

### No more duplicate `scripts/`
Answering "code lives here too" created an empty `scripts/` at the repo root
beside the paper's own — the exact near-duplication this plugin exists to
remove. `establish` no longer creates it.

### Upgrade path documented
`claude plugin install` does not upgrade an installed plugin: it reports
"already installed" and leaves the old version pinned, and there is no
`claude plugin update`. Anyone who installed before v1.1.0 was silently still
scaffolding the pre-`llm/` layout. The README and `establish` now spell out the
uninstall/update/install sequence, and that plugins bind at session start so a
restart is required.

### Also
- One fault, one finding: a fabricated citation no longer produces both a
  `citations.missing` FAIL and a `citations.matrix` warning.
- `research-checks.mjs` header comment updated to the `paper/scripts/` path.

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
