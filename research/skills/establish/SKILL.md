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

## Step 1 — Preflight

- Confirm the target is a git repo. If not, offer `git init` (default branch `main`).
- Read `${CLAUDE_PLUGIN_ROOT}/../VERSION` for the version to pin.
- If `docs/research-delta.md` already exists, this is an **upgrade**, not a fresh
  install: skip to the upgrade path at the end of this file.
- Check for `docs/governance-delta.md`. If present, this repo also uses
  `agentic-governance` — see Step 3.
- Check the toolchain and report honestly what is missing:
  `latexmk`, `pdflatex`, `node` (≥18), `pdfinfo`, and `git`. A missing
  `latexmk` is not fatal to scaffolding, but say that the build scripts will
  not run until it is installed.

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
   - `paper/` + `construction/` + `llm/memory_bank/` **(recommended default)**
   - `proposal/` instead of `paper/` when the type is a proposal
   - keep an existing layout you detected, if the repo already has one
6. **Does code live here too?** If yes, also create `experiments/`, `scripts/`,
   `data/`, `results/`.
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

  ```
  | Memory Bank | `llm/memory_bank/` (from docs/governance-delta.md — do not change here) |
  ```

  Set `Governance delta present: yes`. Do not choose a different path, and do
  not leave the field blank: `research-checks.mjs` can only verify a path that
  is declared, and an undeclared path is reported as a skipped check, never as
  a passed one. If the two files ever disagree, the governance delta wins.
- Print the L0 allowlist lines the paper layout needs and ask the user to add
  them to the governance delta (do not edit that file yourself — changing it is
  L1 semantic work):

  ```
  deny <paper>/**
  deny <construction>/design/**
  deny <construction>/requirements/**
  ```

  Explain why: paper prose is semantic work, and an L0 fast track that could
  touch the draft would let an agent merge writing without human review.
- If the governance delta pins a version, note both pins in your final report.

## Step 4 — Scaffold the layout

```
<paper>/           main.tex (from templates/latex/<template>/), sections/, references.bib
<construction>/    design/, requirements/, sprints/, spec_builder.md
<memory-bank>/     the 9 memory-bank files, archive/
files/             (empty, with a README explaining it holds source material)
figures/           (empty)
build/             (git-ignored)
docs/              research-delta.md
scripts/           build.sh watch.sh wordcount.sh arxiv-package.sh overleaf-sync.sh
                   _paths.sh research-checks.mjs
```

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

Copy `templates/scripts/*` into `scripts/` and `chmod +x` them. Then write
`scripts/_paths.sh` with this repo's real values:

```bash
PAPER_DIR="paper"        # or proposal/, writeup/
MAIN_TEX="main.tex"
BUILD_DIR="build"
FIGURES_DIR="figures"
PAGE_LIMIT="10"          # 0 for no limit
```

Every script sources this file, so a repo using `proposal/` needs no script edits.

Copy `scripts/research-checks.mjs` from `${CLAUDE_PLUGIN_ROOT}/scripts/`.

Tell the user, in these words, what they now have:

```
./scripts/build.sh          one-shot build -> build/main.pdf
./scripts/watch.sh          rebuild on every save, Ctrl-C to stop
./scripts/watch.sh --view   same, plus open the PDF viewer
./scripts/wordcount.sh      words per section against its budget
./scripts/arxiv-package.sh  arXiv tarball with the .bbl shipped
./scripts/overleaf-sync.sh  push/pull to an Overleaf project
node scripts/research-checks.mjs --compile
```

## Step 6 — CLAUDE.md

Copy `templates/CLAUDE.md.template` → `CLAUDE.md`, substituting the real values
and naming the lead agent for this paper type. If a `CLAUDE.md` already exists,
do not overwrite it — show the user the sections to merge in.

## Step 7 — Git and CI

- Append to `.gitignore`: `build/`, and the LaTeX intermediates
  (`*.aux *.log *.out *.bbl *.blg *.fls *.fdb_latexmk *.synctex.gz *.toc`).
  **Do not** ignore `*.pdf` blindly — some venues want the PDF committed; ask.
- Copy `templates/github/pr-review.yml` → `.github/workflows/` and adjust it to
  run `node scripts/research-checks.mjs --compile`.
- Ask before creating a remote or pushing.

## Step 8 — Seed the memory bank

Fill `<memory-bank>/projectbrief.md` and `activeContext.md` with what the
interview established: the paper's goal, venue, deadline, and the immediate
next action. Leave the rest as templates.

## Step 9 — Verify, then report

Run, in order:

1. `./scripts/build.sh` — **the skeleton must compile before you report success.**
   If it fails on a missing class, go back to Step 4a. If it fails on a missing
   font package (acmart needs `libertine` and friends), print the exact `tlmgr
   install` line. Do not tell the user the repo is ready while the build is red.
2. `node scripts/research-checks.mjs` — expect passes with warnings; no FAILs.

Then report:

- What was created, as a tree
- What the user must fill in next (title, abstract, the first outline)
- The exact command to start writing: `./scripts/watch.sh`
- Whether `agentic-governance` was detected and what to paste into its delta
- Anything missing from the toolchain, with the command to fix it

## Upgrade path (delta already exists)

Do not overwrite. Instead:

1. Read the pinned version in the existing delta and compare with the plugin's `VERSION`.
2. Diff the existing delta against `templates/research-delta-template.md` and add
   only the fields the template has and the delta lacks. Never change a value
   the user has set.
3. Refresh `scripts/` and `scripts/research-checks.mjs` from the templates
   (these are plugin-owned), preserving `scripts/_paths.sh`.
4. Report every change as a list, and update the version pin last.
