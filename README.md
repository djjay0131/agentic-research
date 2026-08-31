# agentic-research

Academic writing projects as **installable tooling** instead of a repository you
copy.

Start a paper, proposal, or position paper by installing this plugin once and
running one command in an empty repo. You get the writing agents, a compiling
LaTeX skeleton for your venue, local build-on-save scripts, a citation matrix
that verifies references are real, and an originality review — without cloning
anyone's template.

## Install

```
/plugin marketplace add djjay0131/agentic-research
/plugin install research@agentic-research
```

## Use

```
cd my-new-paper
/research:establish
```

It interviews you (paper type, venue, page limit, deadline), writes
`docs/research-delta.md`, scaffolds the layout, installs the build scripts, and
verifies the skeleton compiles. Then:

```bash
./paper/scripts/watch.sh          # rebuild on every save
./paper/scripts/wordcount.sh      # words per section against its budget
./paper/scripts/build.sh          # one-shot -> paper/build/main.pdf
```

## Layout

The paper subtree is self-contained, so it never collides with source code at
the repo root and can be moved elsewhere intact:

```
repo/
├── paper/                  # or proposal/ — everything paper-related
│   ├── main.tex
│   ├── sections/           # each with a "% WORD BUDGET: N" header
│   ├── references.bib
│   ├── figures/
│   ├── scripts/            # build, watch, wordcount, arxiv, overleaf, checks
│   └── build/              # the PDF lands here (git-ignored)
├── llm/
│   ├── construction/       # design/ requirements/ sprints/
│   └── memory_bank/
├── docs/research-delta.md  # the single source of truth for all paths
├── files/                  # source material — shared with the code side
└── src/  tests/            # your code, untouched
```

## What you get

### Skills

| Skill | Does |
|---|---|
| `/research:establish` | Scaffold this repo — delta, LaTeX, dirs, scripts, CI |
| `/research:audit` | How far has this repo drifted? What blocks submission? |
| `/research:add-paper <doi\|arxiv\|url>` | Add one verified reference |
| `/research:citation-matrix` | Verify every citation against Crossref / arXiv / OpenAlex |
| `/research:originality-check` | Overlap, self-plagiarism, unverified claims |

### Agents

| Agent | Does |
|---|---|
| `paper-agent` | Research papers — outline, survey, draft, revise, camera-ready |
| `proposal-agent` | Proposals and CFP responses — analyse the call, design, then write |
| `position-paper-agent` | Position and vision papers — thesis, arguments, stress-test |
| `latex-agent` | Compilation, formatting, `.bib` syntax, page counts |
| `citation-agent` | Owns the citation matrix; verifies references are real |
| `originality-agent` | Drafting-hygiene review before you submit |
| `review-agent` | The merge gate |
| `memory-agent` | Keeps the memory bank current |

### Scripts, installed into your repo

`build.sh` · `watch.sh` · `wordcount.sh` · `arxiv-package.sh` ·
`overleaf-sync.sh` · `research-checks.mjs`

They live in `<paper>/scripts/` and derive their own paths, so a repo using
`proposal/` instead of `paper/` needs no edits.

## The delta

The plugin hardcodes no paths. Each repo carries `docs/research-delta.md`
declaring its own layout, venue, page limit, and deadline; every agent resolves
paths from it. That is what lets one installed copy serve every project — and
what stopped the same six agents from existing in twenty-three near-identical
variants.

## Does this need agentic-governance?

**No.** `agentic-research` is standalone. Installing it alone gives you the full
scaffold — the memory bank included, since that is part of the research layout,
not something inherited from the governance plugin. Nothing in this plugin
requires the other one to be installed.

## Composing with agentic-governance

If the repo also has `docs/governance-delta.md`, `/research:establish` detects
it, defers to it for the memory-bank and roadmap paths, and prints the L0
allowlist denials the paper layout needs:

```
deny paper/**
deny construction/design/**
deny construction/requirements/**
```

Paper prose is semantic work (L1–L3). An L0 fast track that could reach the
draft would let an agent merge writing without human review.

## Requirements

- Claude Code
- A TeX distribution with `latexmk` (TeX Live or MacTeX)
- Node 18+ for `research-checks.mjs`

### Document classes

`acmart.cls` (and `ACM-Reference-Format.bst`) ship with this plugin and are
copied into your `paper/` only when `kpsewhich` finds no system install.
`IEEEtran` and `llncs` are not redistributed here:

```bash
sudo tlmgr install ieeetran       # or: apt-get install texlive-publishers
sudo tlmgr install llncs
```

`acmart` also needs a font stack a minimal TeX Live does not ship:

```bash
sudo tlmgr install libertine newtx txfonts inconsolata comment \
                   ncctools preprint totpages environ trimspaces textcase
```

`/research:establish` checks for these and tells you exactly what is missing.

## Honest limitations

`originality-agent` compares your draft against the sources available to it —
files in `files/`, cited works it can retrieve, and your own prior papers. It has
no access to published corpora. **It cannot certify originality.** For a
submission-grade check use iThenticate or your venue's screening tool.

## Licence

MIT
