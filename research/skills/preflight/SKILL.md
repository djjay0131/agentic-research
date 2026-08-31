---
name: preflight
description: Check the machine for everything an agentic-research paper repo needs - latexmk and a TeX distribution, the LaTeX packages the chosen venue class depends on, Node 18+, and pdfinfo - then offer to install exactly what is missing, one approved command at a time. Use before /research:establish, or when a build fails on a missing package.
argument-hint: "[acm | ieee | springer | arxiv]"
allowed-tools: Read, Glob, Grep, Bash, AskUserQuestion
---

# research:preflight

Find out what is missing and offer to fix it, so nobody spends their first
twenty minutes guessing at package names.

**Never install anything without asking.** Show the exact command, say what it
does and roughly how large it is, and run it only on an explicit yes. Ask per
command, not once for the batch — the TeX download is in a different league from
the others and deserves its own decision.

## 1. Detect

```bash
uname -s                                  # Darwin | Linux
command -v latexmk pdflatex node pdfinfo git
node --version 2>/dev/null
kpsewhich <class>.cls 2>/dev/null         # acmart | IEEEtran | llncs | article
```

For the venue's class, also check the packages it pulls in. `acmart` is the one
that bites: `kpsewhich libertine.sty newtxtext.sty inconsolata.sty comment.sty
ncctools.sty preprint.sty totpages.sty environ.sty trimspaces.sty textcase.sty`.

Report a table — tool, found/missing, and what it is needed for — **before**
proposing anything. Someone may only want the report.

## 2. What is actually required

| Need | Required for | If missing |
|---|---|---|
| `latexmk` + `pdflatex` | building the PDF at all | the scaffold still works; the build does not |
| venue class file | that venue's format | the plugin vendors `acmart`; IEEE and Springer need installing, or switch to the arXiv template |
| acmart font stack | acmart only | build fails with a font error |
| `node` ≥ 18 | `research-checks.mjs` | the mechanical checks cannot run |
| `pdfinfo` (poppler) | page count vs limit | page-limit check is skipped, everything else works |
| `git` | everything | stop; nothing works without it |

Only `git` is a hard stop. Say clearly which gaps are blocking and which merely
disable one feature — a missing `pdfinfo` is not a reason to install 5 GB.

## 3. Offer the install

### macOS

```bash
# TeX — the small one. ~100 MB installed, plus packages below.
brew install --cask basictex
# then, in a NEW shell so PATH picks up /Library/TeX/texbin:
sudo tlmgr update --self
sudo tlmgr install latexmk

# Full TeX Live instead — ~5 GB, everything included, no package chasing:
brew install --cask mactex-no-gui

# acmart's font stack (BasicTeX only; MacTeX already has these):
sudo tlmgr install libertine newtx txfonts inconsolata comment ncctools \
                   preprint totpages environ trimspaces textcase

# venue classes not vendored here
sudo tlmgr install ieeetran      # IEEE
sudo tlmgr install llncs         # Springer LNCS

brew install node poppler        # Node 18+, pdfinfo
```

**Recommend BasicTeX over MacTeX** unless they say they want everything. It is
100 MB against 5 GB, and the `tlmgr install` lines above cover the difference for
this plugin's templates. Say that trade-off out loud — do not silently start a
5 GB download.

### Debian / Ubuntu

```bash
sudo apt update
sudo apt install -y texlive-latex-recommended texlive-latex-extra \
                    texlive-fonts-recommended latexmk poppler-utils
sudo apt install -y texlive-publishers    # IEEEtran, llncs
sudo apt install -y nodejs npm            # check: node --version >= 18
```

If the distro's Node is older than 18, point at nodesource or nvm rather than
fighting apt.

### Windows

Assume WSL and use the Debian path. Native Windows is not tested here; say so
rather than guessing.

## 4. Run it

For each command the user approves:

- Say what it will do and the rough download size first.
- Run it. `sudo` will prompt for a password **in their terminal** — tell them to
  expect that, and never ask them to type a password to you.
- `brew install --cask basictex` needs a **new shell** afterwards for
  `/Library/TeX/texbin` to be on `PATH`. Say so, and re-verify with
  `command -v latexmk` before claiming success.
- If a command fails, show the real error. Do not retry it with `sudo` bolted on,
  and do not try a different package manager on your own.

## 5. Re-verify and report

Re-run the detection and report the final state. Then say exactly one of:

- **Ready** — `/research:establish` will build a PDF on this machine.
- **Ready except <feature>** — e.g. no `pdfinfo`, so page-limit checking is off.
- **Not ready** — what is still missing and the one command that would fix it.

If TeX is still missing and the user does not want to install it, say the
scaffold will be created correctly and the build will work the moment TeX
arrives — the repo is not wasted.
