# Changelog

## 1.8.0 — 2026-08-31

Both changes from a collaborator's first run — a grant writer, not the author.

### `establish` now asks what the research is about
The interview collected venue, page limit, deadline and layout, and **never
asked what the paper was about**. Step 8 then said to seed `projectbrief.md`
"with what the interview established: the paper's goal" — a goal the interview
never collected. The same doc-promises-what-the-step-does-not-deliver pattern as
the last three findings.

New Step 2a, asked **before** the paperwork: what this is about in plain
language, the core claim or contribution, the state of the work (idea / results
in hand / revision / resubmission), the audience, co-authors, and what it builds
on. It reads a CFP or abstract already sitting in `files/` and proposes a summary
rather than interrogating someone who has written this down once already, and
every question can be skipped.

That material now seeds `projectbrief.md`, `productContext.md`, `activeContext.md`
and the top of `CLAUDE.md`, and is recorded in a new **The Research** section of
the delta. Where a question was skipped, the field says so — `establish` is
explicitly forbidden from inventing a project brief, because every agent
downstream treats it as fact.

`/research:audit` reports a delta or memory bank still holding template text.

### Custom and bring-your-own templates
The template question offered ACM, IEEE, Springer and arXiv only. Grant and
fellowship programmes almost always ship their own class or sample document, so
a proposal writer — the likeliest user of the proposal path — had no option that
fit, and the run ended without a compiling PDF.

New Step 4a-custom handles three cases: they have the template files (copy them
in, and if it came as a **sample document**, build on that rather than
generating a skeleton over the top of the programme's required headings); they
have a class but no sample (generate a minimal preamble and say it is a guess);
or the file has not arrived yet (scaffold with `article` so the repo compiles
today, and record `PLACEHOLDER` in the delta so `/research:audit` reports it
every run rather than letting it be forgotten).

## 1.7.0 — 2026-08-31

### `src/` and `tests/` are created for a code-bearing repo
Answering "code lives here too" created `experiments/`, `data/` and `results/`
but **not** `src/` or `tests/` — while this skill's own layout diagram listed
`src/ tests/ data/`. The diagram promised what the step did not deliver, and
`src/`/`tests/` are the two directories every other tool expects at the root.

All five are now created, each with a one-line `README.md` so it survives a
clone, and an existing directory is never touched — only gaps are filled, and
the report says which were created and which were left alone.

### The `.gitkeep` divergence from `agentic-governance` is documented
`governance:establish` creates only the directories its delta declares and
explicitly refuses `.gitkeep`, on the grounds that an empty directory misstates
the repo's shape. That is right for governance, which asserts a declared
structure — and wrong here, where the scaffold creates directories the *writer*
fills later (`figures/`, `archive/`, `sprints/`). If those vanish on first clone,
the layout the delta declares stops being true for whoever cloned it.

The two rules now coexist deliberately, with the reasoning written down in
`establish` rather than left to be rediscovered as a bug. Where there is
something useful to say, a `README.md` is preferred over a bare `.gitkeep`: same
guarantee, and it states the shape instead of merely pinning it.

## 1.6.0 — 2026-08-31

### New: `/research:preflight`
Detects `latexmk`, a TeX distribution, the packages the chosen venue class
depends on (acmart's font stack is the usual culprit), Node 18+, `pdfinfo` and
`git` — then offers to install exactly what is missing, one approved command at
a time, with the download size stated up front.

It recommends **BasicTeX (~100 MB)** over full MacTeX (~5 GB) plus the specific
`tlmgr install` lines that close the gap for these templates, rather than
silently starting a 5 GB download. Only `git` is treated as a hard stop; the
report distinguishes gaps that block the build from ones that merely disable a
feature, so nobody installs a TeX distribution to get a page count.

`establish` now runs this detection and offers the installs when the toolchain
is incomplete, instead of listing gaps and leaving the user to work out package
names.

## 1.5.0 — 2026-08-31

From the reverse-order test (research established first, governance second).
That order survives — nothing was overwritten, one memory bank, 17/17 still
green — but it survives by luck rather than design, and it exposed a field with
no owner.

### `Governance delta present` is now validated
The scaffolder wrote this field and **nothing ever read it**. Adopt governance
after scaffolding and it silently becomes false, in a repo that otherwise scores
17/17. Three separate checkers ran over such a repo and none noticed.

New `governance.sync` check reconciles the claim against reality and FAILs both
mismatches: the field saying `no` while `docs/governance-delta.md` exists (the
reverse-order case), and the field saying `yes` when it does not (deleted, or
hand-edited — every mirrored path is then unsourced).

### The missing L0 denials are now reported
In reverse order, `research:establish` runs before there is a governance delta to
print denials into, so they are never printed. New `governance.l0` check warns
when the governance allowlist does not mention the paper and construction paths.
It is a warning, not a failure, because `checkL0Paths` is default-deny — the
absence is missing explicitness, not an open door. `/research:audit` gained a
reverse-order path that reports the same thing and, with `--fix`, corrects the
field and mirrors the memory-bank path.

### `deny docs/research-delta.md` added to the printed denials
Governance's `HARD_DENY` protects its own delta but nothing protected the
research delta, and a generic `allow docs/** link-target-only` rule matches it —
so an L0 change could edit link targets inside the file every research agent
reads for its paths. The denial now ships in the printed lines and the delta
template. Keeping this line in the research plugin, rather than adding a
research path to governance's `HARD_DENY`, points the coupling the right way.

### `establish` warns about later adoption
When no governance delta is present, the final report now says that adopting
governance later requires a return trip through `/research:audit`.

## 1.4.0 — 2026-08-31

From the composition test against `agentic-governance`. The composition itself
passed on every count; these are the faults it exposed.

### The composition instructions broke composition (headline)
Step 3 told the skill to annotate the mirrored memory-bank path *inside the
value cell*:

```
| Memory Bank | `llm/memory_bank/` (from docs/governance-delta.md — do not change here) |
```

`field()` captures everything up to the next pipe, so the annotation became part
of the path and the layout check FAILed with "missing on disk". Following the
instructions literally was what broke it. Fixed at both ends: the instruction now
puts provenance in the table's third column, and the parser strips a trailing
`(from …)` / `(source …)` / `(see …)` annotation and HTML comments from any value.

### The scaffolder contradicted its own anonymity check
v1.2.0 added a check that FAILs when the delta says `Anonymised: yes` and
`main.tex` carries author metadata — but `establish` never mentioned anonymity and
the templates hardcoded a full author block. A faithful run for any double-blind
venue produced a repo that failed its own check. `establish` now has Step 4a0:
ACM gets `{{ANON_OPT}}` → `,anonymous` plus a scrubbed title block, and IEEE,
Springer and arXiv each carry the right instruction. Verified: an anonymised
scaffold builds and passes 17/17.

### A governance-declared memory bank is now created
`governance:establish` writes a memory-bank *path* into its delta but never
creates the directory. `research:establish` now scaffolds it at that path when it
is absent, instead of leaving the delta pointing at nothing.

### `references.json` is seeded
`/research:audit` and `citation-agent` expect it; nothing created it. `establish`
now writes an empty store, so the audit reports a real state rather than an
absence the scaffolder caused.

### The running version is announced
The upgrade trap fired a second time during testing. `establish` now states its
version in its first message and its final report, so a stale run is visible
immediately rather than after someone diffs the layout.

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
