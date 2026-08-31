---
name: establish
description: Scaffold the current repository as a paper, proposal, position-paper, or preprint project - research delta, LaTeX skeleton for the target venue, construction and memory-bank directories, local build/watch/wordcount/arXiv scripts, and CI. Detects an existing agentic-governance delta and composes with it. Use to start a new writing project or to adopt agentic-research in an existing repo.
argument-hint: "[repo-path (default: cwd)]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
---

# research:establish

Onboard a repository onto `agentic-research`. Work in the target repo (the
argument, else cwd).

**Template source.** Every file this skill writes is copied from
`${CLAUDE_PLUGIN_ROOT}/templates/`. Never read templates from a hardcoded path
like `~/code/...` — this plugin runs on other people's machines.

Announce each step as you do it. Ask before any GitHub-remote mutation
(creating a repo, pushing, changing settings). Never overwrite a file the user
has already written content into — if a target exists and is non-trivial, show
the diff and ask.

## Before you begin: are you running the current version?

`claude plugin install` does **not** upgrade an already-installed plugin — it
replies "already installed" and leaves the old version pinned, and there is no
`claude plugin update`. Plugins also bind at session start, so a freshly
installed version is not active until the session restarts.

**State the version you are running, out loud, in your first message and again
in your final report** — "scaffolding with agentic-research v1.4.0". A stale run
is otherwise invisible until someone diffs the layout, which is exactly how this
was missed twice.

At Step 1 you read the plugin `VERSION`. Compare it against what the delta of
any existing repo pins, and if you have any reason to think the installed copy
is stale, tell the user to run:

```
/plugin uninstall research@agentic-research
/plugin marketplace update agentic-research
/plugin install research@agentic-research
```

and then **restart the session**. Scaffolding a repo with a stale version
produces the old layout with no warning, which is worse than failing.

## Step 1 — Preflight

- Confirm the target is a git repo. If not, offer `git init` (default branch `main`).
- Read `${CLAUDE_PLUGIN_ROOT}/../VERSION` for the version to pin.
- If `docs/research-delta.md` already exists, this is an **upgrade**, not a fresh
  install: skip to the upgrade path at the end of this file.
- Check for `docs/governance-delta.md`. If present, this repo also uses
  `agentic-governance` — see Step 3.
- Check the toolchain: `latexmk`, `pdflatex`, `node` (≥18), `pdfinfo`, `git`.
  If anything is missing, **run the `preflight` skill's detection and offer its
  installs** rather than just listing gaps — a user who has to go and work out
  package names will not come back. Only `git` is a hard stop; a missing
  `latexmk` still lets the scaffold be created correctly, and the build works
  the moment TeX arrives.

## Step 2 — Interview

Use `AskUserQuestion`. Ask only what you cannot derive from the repo (README,
existing `.tex` files, directory names, git remote).

1. **Paper type** — research paper / proposal or CFP response / position or
   vision paper / arXiv preprint. This picks the lead agent and the section
   skeleton.
2. **Venue and template** — ACM (`acmart`), IEEE (`IEEEtran`), Springer
   (`llncs`), or plain arXiv (`article`). Offer the one matching the paper
   type as the default.
3. **Page limit and what it counts** — body only, including references, or
   including appendix. Store the integer; `research-checks.mjs` enforces it.
4. **Deadline** — a date, or "none".
5. **Layout generation** — offer, in this order:
   - `paper/` (self-contained) + `llm/construction/` + `llm/memory_bank/`
     **(recommended default)**
   - `proposal/` instead of `paper/` when the type is a proposal
   - keep an existing layout you detected, if the repo already has one
6. **Does code live here too?** If yes, also create `experiments/`, `data/`,
   and `results/` at the repo root.

   **Do not create a root `scripts/`.** The paper's scripts live in
   `<paper>/scripts/`, and an empty second `scripts/` at the root is exactly the
   kind of near-duplicate this plugin exists to eliminate. If the code side
   later needs its own scripts, the user creates that directory when they have
   something to put in it.
7. **Own bibliography path** — for the self-plagiarism check. Offer to skip.

Derive title, author, institution, and email from git config and the README
where you can; confirm rather than ask cold.

## Step 3 — Write the research delta

Copy `templates/research-delta-template.md` → `docs/research-delta.md` and
substitute every `{{PLACEHOLDER}}`. Leave none behind — `research-checks.mjs`
fails the repo if any survive.

**If `docs/governance-delta.md` exists:**

- **Mirror, do not invent.** Read the memory-bank and roadmap paths out of the
  governance delta and write *those exact values* into the research delta, each
  annotated with where it came from:

  The layout table has a third column for exactly this. Put the value alone in
  the value cell and the provenance in the **third** column — an annotation
  inside the value cell becomes part of the path when the delta is parsed:

  ```
  | Memory Bank | `llm/memory_bank/` | from docs/governance-delta.md — do not change here |
  ```

  Set `Governance delta present: yes`. Do not choose a different path, and do
  not leave the field blank: `research-checks.mjs` can only verify a path that
  is declared, and an undeclared path is reported as a skipped check, never as
  a passed one. If the two files ever disagree, the governance delta wins.
- **Create the directory if governance only declared it.** `governance:establish`
  writes a memory-bank *path* into its delta but does not create the directory.
  If the declared path does not exist on disk, scaffold the memory bank there in
  Step 4 — a delta pointing at a directory that is not there fails every check
  that reads it.
- Print the L0 allowlist lines the paper layout needs and ask the user to add
  them to the governance delta (do not edit that file yourself — changing it is
  L1 semantic work):

  ```
  deny <paper>/**
  deny <construction>/design/**
  deny <construction>/requirements/**
  deny docs/research-delta.md
  ```

  The last line matters and is easy to miss: governance's `HARD_DENY` protects
  its own `governance-delta.md`, but nothing protects the research delta, and a
  generic `allow docs/** link-target-only` rule matches it. Without this line an
  L0 change could edit link targets inside the file that every research agent
  reads for its paths.

  Explain why: paper prose is semantic work, and an L0 fast track that could
  touch the draft would let an agent merge writing without human review.
- If the governance delta pins a version, note both pins in your final report.

### Step 3a — Governance adopted later

If `docs/governance-delta.md` is **absent**, write `Governance delta present: no`
— and tell the user, in the final report, that if they adopt `agentic-governance`
later they must come back and run `/research:audit`, because that field will
then be stale and the L0 denial lines will never have been printed.

`research-checks.mjs` FAILs on that mismatch, so it is caught rather than
silently believed — but it is caught after the fact, and saying so up front costs
one sentence.

## Step 4 — Scaffold the layout

**The paper subtree is self-contained.** The document, its figures, its scripts
and its build output all live under `<paper>/`. That keeps every paper artifact
together, lets the subtree be moved or copied to another repo intact, and means
a repo that also holds source code has no collision between `src/` and the
paper's own `scripts/` or `build/`.

Output lives in the subtree too. The scripts pass `latexmk -outdir`, so the PDF
*and* every `.aux`, `.log`, `.bbl`, `.fls` and `.fdb_latexmk` land in
`<paper>/build/` and **nothing is ever written loose beside `main.tex`.**
Never create a `build/` at the repo root — the whole point is that the paper
adds exactly one top-level directory.

`files/` is the one deliberate exception: it stays at the repo root, because
source material (a CFP, reference PDFs, notes) is often needed by the code side
too.

```
<paper>/                  paper/ | proposal/ | writeup/  — self-contained
  main.tex                from templates/latex/<template>/
  sections/               the section skeleton, with word-budget headers
  references.bib
  figures/
  scripts/                build.sh watch.sh wordcount.sh arxiv-package.sh
                          overleaf-sync.sh _paths.sh research-checks.mjs
  build/                  the PDF AND every LaTeX intermediate — git-ignored,
                          derived, safe to delete
llm/
  construction/           design/  requirements/  sprints/  spec_builder.md
  memory_bank/            the 9 memory-bank files, archive/
docs/
  research-delta.md
files/                    shared source material — REPO ROOT, not the subtree
src/  tests/  data/       untouched if the repo also holds code
```

**Every directory you create must survive a clone.** Git does not track empty
directories, so a scaffold of empty dirs silently disappears the first time
someone clones the repo — and the checker then reports the layout as broken.
Into every directory you create that would otherwise be empty, write either:

- a short `README.md` saying what belongs there — preferred for `files/`,
  `<construction>/design/`, `<construction>/sprints/`, and `results/`; or
- an empty `.gitkeep` — for `<paper>/figures/`, `<memory-bank>/archive/`, and
  anything else with no useful thing to say.

Do not skip this for `build/`: that one is git-ignored by design and must
**not** get a `.gitkeep`.

**Defaults, unless the user chose otherwise in Step 2:** `<construction>` is
`llm/construction/` and `<memory-bank>` is `llm/memory_bank/` — both under
`llm/`, never at the repo root. Do not scaffold a bare `construction/` at the
top level.

The memory bank is created **unconditionally** — it is part of the research
scaffold and does not come from `agentic-governance`. This plugin has no
dependency on that one.

**But never clobber a memory bank that already has content.** A repo that
already adopted `agentic-governance`, or that has simply been worked in, will
have real project memory at that path. Copy a template file only where no file
of that name exists; list any you skipped, and say the existing content was
kept. Losing someone's `activeContext.md` to a scaffolding step is the worst
thing this skill could do.

Substitute `{{TITLE}}`, `{{AUTHOR}}`, `{{INSTITUTION}}`, `{{CITY}}`,
`{{COUNTRY}}`, `{{EMAIL}}`, `{{KEYWORDS}}`, `{{PROJECT_NAME}}` in the LaTeX
main file. Copy `templates/sections/*.tex` into `<paper>/sections/`.

For a **proposal**, rename the section skeleton to the proposal structure
(problem statement, approach, contributions, feasibility and timeline, impact)
and keep the word-budget headers.

### Step 4a0 — Anonymise the title block when the venue is double-blind

If Step 2 established that the venue is double-blind, the scaffold must be
anonymous **from the start**. `research-checks.mjs` FAILs a repo whose delta says
`Anonymised: yes` while `main.tex` carries author metadata — do not hand the user
a repo that fails its own check.

- **ACM.** Substitute `{{ANON_OPT}}` with `,anonymous` so the class becomes
  `\documentclass[sigconf,nonacm,anonymous]{acmart}`, and fill the title block
  with `\author{Anonymous}`, `\institution{Anonymous Institution}`,
  `\city{Anonymous}`, `\country{Anonymous}`,
  `\email{anonymous@example.org}`. When not anonymous, substitute `{{ANON_OPT}}`
  with an empty string and use the real values.
- **IEEE.** Replace the whole `\author` block with
  `\author{\IEEEauthorblockN{Anonymous Author(s)}}`.
- **Springer.** `\author{Anonymous}` and `\institute{Anonymous Institution}`.
- **arXiv.** Preprints are not anonymous; keep the real author block.

In every case, record the real author details in the delta or `CLAUDE.md` so the
user can restore them for the camera-ready, and say in your final report that the
title block is anonymised and where the real details are kept.

`{{ANON_OPT}}` must never survive into the written file — substitute it either
way, or the placeholder check fails the repo.

### Step 4a — Resolve the document class (do not skip this)

A minimal TeX Live has only `article.cls`. `acmart`, `IEEEtran`, and `llncs` are
all commonly missing, and a scaffold that will not compile is worse than no
scaffold. For the chosen template, run `kpsewhich <class>.cls`:

| Result | Do |
|---|---|
| Found | Nothing. Do not vendor a copy that would shadow the user's install. |
| Missing, and the plugin ships it | Copy the class (and its `.bst`/`.bbx`/`.cbx`/`.dbx` companions) from `${CLAUDE_PLUGIN_ROOT}/templates/latex/<template>/` into `<paper>/`. This is what the working repos in this portfolio already do. |
| Missing, and the plugin does not ship it | Print the exact install command, then **offer the arXiv/`article` template as a working fallback** so the user leaves with something that compiles today. Record the intended venue template in the delta either way, so `/research:audit` can remind them to switch back. |

The plugin currently ships `acmart.cls` and `ACM-Reference-Format.bst` (plus the
`acm*.bbx/cbx/dbx` biblatex files). It does **not** ship `IEEEtran.cls` or
`llncs.cls`; for those the install commands are:

```bash
# IEEE
sudo tlmgr install ieeetran        # TeX Live
sudo apt-get install texlive-publishers   # Debian/Ubuntu

# Springer LNCS
sudo tlmgr install llncs
```

Whatever you vendor, add a one-line comment at the top of the copied file saying
it was vendored by `/research:establish` and may be replaced by a system install.

## Step 5 — Install the local build scripts

Copy `templates/scripts/*` into **`<paper>/scripts/`** and `chmod +x` them.
Also copy `research-checks.mjs` from `${CLAUDE_PLUGIN_ROOT}/scripts/` into the
same directory.

`_paths.sh` derives `PAPER_ROOT` from its own location and `REPO_ROOT` from
git, so only these need substituting:

```bash
MAIN_TEX="main.tex"
PAGE_LIMIT="10"          # 0 for no limit
```

Every script sources it, so a repo using `proposal/` needs no script edits.

Tell the user, in these words, what they now have:

```
./<paper>/scripts/build.sh          one-shot build -> <paper>/build/main.pdf
./<paper>/scripts/watch.sh          rebuild on every save, Ctrl-C to stop
./<paper>/scripts/watch.sh --view   same, plus open the PDF viewer
./<paper>/scripts/wordcount.sh      words per section against its budget
./<paper>/scripts/arxiv-package.sh  arXiv tarball with the .bbl shipped
./<paper>/scripts/overleaf-sync.sh  push/pull to an Overleaf project
node <paper>/scripts/research-checks.mjs --compile
```

`research-checks.mjs` walks up for `docs/research-delta.md`, so it works from
the repo root, from inside the paper subtree, or from CI.

### Step 5a — Seed the citation stores

`/research:audit` and `citation-agent` both expect
`<construction>/requirements/references.json`. Create it now as an empty store so
the audit reports a real state rather than a missing file the scaffolder was
responsible for:

```json
{ "version": 1, "generated": null, "records": [] }
```

Copy `templates/construction/requirements/citation-matrix.md` alongside it as the
human-readable mirror.

## Step 6 — CLAUDE.md

Copy `templates/CLAUDE.md.template` → `CLAUDE.md`, substituting the real values
and naming the lead agent for this paper type. If a `CLAUDE.md` already exists,
do not overwrite it — show the user the sections to merge in.

## Step 7 — Git and CI

- Append to `.gitignore`: `<paper>/build/`. That one line covers everything derived,
  because `-outdir` keeps intermediates out of the source tree. Add the LaTeX
  intermediate patterns too, as a backstop for anyone who runs `pdflatex` by
  hand: `*.aux *.log *.out *.bbl *.blg *.fls *.fdb_latexmk *.synctex.gz *.toc`.
  **Do not** ignore `*.pdf` blindly — some venues want the PDF committed; ask.
  With `-outdir` there is no PDF beside `main.tex` to ignore in the first place:
  the only PDF is the derived one under `build/`.
- Copy `templates/github/pr-review.yml` → `.github/workflows/` and adjust it to
  run `node scripts/research-checks.mjs --compile`.
- Ask before creating a remote or pushing.

## Step 8 — Seed the memory bank

Fill `<memory-bank>/projectbrief.md` and `activeContext.md` with what the
interview established: the paper's goal, venue, deadline, and the immediate
next action. Leave the rest as templates.

## Step 9 — Verify, then report

Run, in order:

1. `./<paper>/scripts/build.sh` — **the skeleton must compile before you report success.**
   If it fails on a missing class, go back to Step 4a. If it fails on a missing
   font package (acmart needs `libertine` and friends), print the exact `tlmgr
   install` line. Do not tell the user the repo is ready while the build is red.
2. `node <paper>/scripts/research-checks.mjs` — expect passes with warnings; no FAILs.

Then report:

- What was created, as a tree
- What the user must fill in next (title, abstract, the first outline)
- The exact command to start writing: `./<paper>/scripts/watch.sh`
- Whether `agentic-governance` was detected and what to paste into its delta
- Anything missing from the toolchain, with the command to fix it

## Upgrade path (delta already exists)

Do not overwrite. Instead:

1. Read the pinned version in the existing delta and compare with the plugin's `VERSION`.
2. Diff the existing delta against `templates/research-delta-template.md` and add
   only the fields the template has and the delta lacks. Never change a value
   the user has set.
3. Refresh `<paper>/scripts/` and its `research-checks.mjs` from the templates
   (these are plugin-owned), preserving `<paper>/scripts/_paths.sh`. If the repo
   predates v1.1 and has `scripts/` or `construction/` at the root, say so and
   offer the migration in §Upgrade: layout move.
4. Report every change as a list, and update the version pin last.


## Upgrade: layout move (pre-v1.1 repos)

Repos scaffolded before v1.1 have `scripts/`, `figures/` and `build/` at the
repo root and may have a bare `construction/`. Offer to migrate, and use
`git mv` so history follows:

```bash
git mv scripts <paper>/scripts
git mv figures <paper>/figures
mkdir -p llm && git mv construction llm/construction
```

If the repo has a root `build/` from v1.2, delete it (it is derived) and let the
new scripts recreate `<paper>/build/`. Also delete any
`.aux`/`.log`/`.bbl`/`.fls`/`.fdb_latexmk` sitting beside `main.tex` — with
`-outdir` they will not come back.

Then update `docs/research-delta.md` to the new paths, replace
`<paper>/scripts/_paths.sh` with the current template, fix `\graphicspath` in
the main `.tex` (it becomes `{{figures/}}` once figures sit beside it), and
update `.github/workflows/` and `CLAUDE.md` to the new script paths. Rebuild and
re-run the checks before reporting done. Never move a directory the user has
declined to move.
