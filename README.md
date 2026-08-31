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
./scripts/watch.sh          # rebuild on every save
./scripts/wordcount.sh      # words per section against its budget
./scripts/build.sh          # one-shot -> build/main.pdf
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

They read your layout from `scripts/_paths.sh`, so a repo using `proposal/`
instead of `paper/` needs no edits.

## The delta

The plugin hardcodes no paths. Each repo carries `docs/research-delta.md`
declaring its own layout, venue, page limit, and deadline; every agent resolves
paths from it. That is what lets one installed copy serve every project — and
what stopped the same six agents from existing in twenty-three near-identical
variants.

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
