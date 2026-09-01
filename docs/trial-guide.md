# Try it in 20 minutes

A self-guided trial of `agentic-research`, written for someone who has not seen
it before. Everything here happens in a throwaway repo — nothing you care about
is touched.

Hand this to a colleague as-is.

---

## 1. Install — 2 min

```
/plugin marketplace add djjay0131/agentic-research
/plugin install research@agentic-research
```

**Restart your Claude Code session afterwards.** Plugins load at session start,
so the new commands will not appear until you do. Everyone hits this once.

Confirm with `/plugin list` that you are on **1.8.0** or later.

Already installed an earlier version? `install` does **not** upgrade it — it
reports "already installed" and leaves the old version pinned:

```
/plugin uninstall research@agentic-research
/plugin marketplace update agentic-research
/plugin install research@agentic-research
```

## 2. Check your machine — 3 min

```
/research:preflight
```

Finds what is missing — a TeX distribution, `latexmk`, the font packages your
venue's class needs, Node 18+, `pdfinfo` — and offers to install each one. It
asks per command and states the download size first.

It recommends **BasicTeX (~100 MB)** over full MacTeX (~5 GB), plus the handful
of packages that close the gap. Only `git` is a hard stop: a missing `pdfinfo`
just turns off page-count checking, and is not a reason to install 5 GB of TeX.

## 3. Scaffold a paper — 5 min

```bash
mkdir -p ~/code/paper-trial && cd ~/code/paper-trial
git init
claude
```

```
/research:establish
```

**Answer as though it were a real paper** — one you might actually write. The
output is far more interesting than with placeholder answers, and you will get a
truer read on whether the questions are the right ones.

It asks about the research first — what it is about, your core claim, whether you
have results yet — before it asks about venue and page limits. Then the
logistics: template, page limit, deadline, whether the venue is double-blind.

> **Grant writers:** choose **custom / bring your own** for the template. Point it
> at your programme's `.cls` — or better, at its sample document, which it will
> build on rather than generate over the top of. If the file has not arrived yet
> it scaffolds something that compiles today and flags the placeholder until the
> real template turns up.

It finishes by building the PDF. If the build fails it says so rather than
claiming success — that is deliberate.

## 4. Write something — 5 min

```bash
./paper/scripts/watch.sh
```

Leave it running. Open `paper/sections/01_introduction.tex`, type a sentence,
save — the PDF rebuilds. `Ctrl-C` to stop.

```bash
./paper/scripts/wordcount.sh
```

Every section carries a `% WORD BUDGET: N` comment in its header; this shows
words written against budget, per section. Edit the budgets to match how you
actually apportion a paper.

## 5. Add a real citation — 2 min

```
/research:add-paper 10.1145/3597503.3639180
```

Fetches the metadata, verifies it against Crossref, arXiv or OpenAlex, writes the
BibTeX entry, and records it in the citation matrix. **It refuses to invent an
entry it cannot verify** — a reference that resolves nowhere is flagged as
possibly fabricated rather than quietly written into your bibliography.

## 6. Break it on purpose — 3 min

```bash
node paper/scripts/research-checks.mjs --compile
```

Citations that resolve, no undefined references, page count against your limit,
no leftover `TODO`s. Now add `\cite{doesnotexist2024}` to a section and run it
again — it should fail with a non-zero exit code and name the key.

If you said your venue is double-blind, it also checks whether your author block
is still sitting in `main.tex`.

---

## Worth a look before you delete it

```bash
cat docs/research-delta.md
```

This one file is the whole design. Every path, your venue, page limit and
deadline live here, and every agent reads it. Move a directory, update this file,
and nothing else changes — that is what lets one installed copy serve every
project instead of twenty near-identical copies drifting apart.

Also open `CLAUDE.md`, which is what Claude reads when it opens the repo.

## What we would like to hear

1. **Did it finish with a compiling PDF?** If not, what broke?
2. **Did the interview ask the right things** — anything irrelevant to how you
   write, or anything obvious it failed to ask?
3. **Is the layout one you would tolerate?** `paper/` holds the document, its
   figures, scripts and build output; `llm/` holds working notes and project
   memory; `files/` is for the CFP and reference PDFs.
4. **Would `wordcount.sh` change how you draft**, or is it noise?
5. **What felt like ceremony rather than help?** The most useful answer, and the
   hardest to get.

## Known rough edges — not your fault if you hit these

**A class file is missing.** ACM's class ships with the plugin and is copied in
automatically. IEEE and Springer are not redistributed here:

```bash
sudo tlmgr install ieeetran      # IEEE
sudo tlmgr install llncs         # Springer LNCS
# Debian/Ubuntu: sudo apt install texlive-publishers
```

Or pick the arXiv template for the trial.

**acmart compiles but the fonts are wrong.**

```bash
sudo tlmgr install libertine newtx txfonts inconsolata comment \
                   ncctools preprint totpages environ trimspaces textcase
```

**It is not a plagiarism service.** The originality check compares your draft
against files you put in `files/`, cited works it can retrieve, and your own
prior papers. It has no access to published corpora and **cannot certify
originality** — use iThenticate or your venue's screening tool for that. It is
genuinely useful for close paraphrase, quotations that lost their attribution,
and claims with specific numbers that trace back to nothing in the repo.

**You already have a paper repo.** `/research:establish` detects it and switches
to upgrade mode: it diffs rather than overwrites, adds only what is missing, and
never changes a value you set. It will not overwrite an existing memory bank or
an existing `src/`.

**Do you need the governance plugin?** No. This one is standalone, project memory
included. If you install both, run `/governance:establish` **before**
`/research:establish` — that order is tested; the reverse works but is not
designed for.

**Citation verification needs network access** to reach Crossref, arXiv and
OpenAlex. Offline, use `/research:citation-matrix --quick` for the structural
check only.

## Throwing it away

```bash
rm -rf ~/code/paper-trial
/plugin uninstall research@agentic-research
```

Nothing is installed outside the plugin directory and the repo you made — except
any TeX packages you approved in step 2, which are yours to keep.
