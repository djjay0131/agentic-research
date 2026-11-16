# Research Delta: ai-empirical-se-chapter

Status: Active
Last updated: 2026-09-10
Research: agentic-research v1.8.0

This file localizes the `agentic-research` plugin for this repository. Every
agent and skill in the plugin resolves its paths from here, so the plugin
itself hardcodes no layout. Declare project facts only — durable decisions
belong in ADRs or the design-authority document, not here.

## Paper Type

Type: research-paper

<!-- one of: research-paper | proposal | position-paper | preprint -->
<!-- proposal-agent leads. The one-page chapter proposal comes first; if it is
     accepted, the chapter itself is a second document in this repo (a
     research-paper type, Springer book template) and this file is updated. -->

## The Research

<!-- Captured by /research:establish Step 2a and mirrored into the memory bank.
     If a field says "not captured", fill it in and run /research:audit. -->

**About:** A chapter for the Springer edited book *Using Artificial
Intelligence in Empirical Software Engineering Research*. Working title
(plan §1): *Governed Agentic Research: Building Reproducible, Human-Auditable
AI Workflows for Empirical Software Engineering*. The plan is the design
authority: `files/springer_ai_empirical_se_chapter_plan.md`.

**Core claim / contribution:** Once AI is an active research participant,
rigor cannot rest on the final artifact or a disclosed prompt; the research
process itself must be engineered, governed, inspectable and reproducible.
Contribution: a framework (working name GAER) of six requirements — bounded
authority, durable provenance, layered validation, human semantic gates,
control-plane/artifact-plane separation, executable reproducibility —
turned into design patterns, grounded in the author's working artifacts.

**State of the work:** proposal accepted "exactly as is" (EasyChair #21, November 2026); chapter first draft in progress, week of 9 November 2026 (`llm/plans/2026-11-09-chapter-first-draft-week.md`). Earlier:  idea — plan in hand, nothing drafted. The plan
requires an evidence phase, three competing pitches and an adversarial
review before Jason chooses the direction; no proposal prose before that gate.

**Audience:** The book's stated audiences: empirical SE researchers
integrating AI into their practice; PhD/MSc and early-career researchers
designing AI-assisted studies; industry R&D researchers; educators teaching
research methods.

**Co-authors:** Jason Cusati (Virginia Tech) confirmed; advisor/co-authors
TBD before drafting (plan §6.1) — never invented.

**Builds on:** the author's `agentic-governance`, `agentic-research`,
`agentic-kg` (ground-truth reconciliation case), `agentic-kgcs`
(deterministic contracts around probabilistic steps), `agentic-kgis`, and
`reliable-trustworthy-se` (the reliability-of-process framing); positioned
against Gomes et al. 2026 (LLM-assisted empirical SE SLR) and recent
LLM-reporting guidance — see `llm/construction/research/literature-gap.md`.

## Layout Paths

The paper subtree is fully self-contained: document, sections, figures, scripts
and build output all live under `chapter/`, so it can be moved to another repo
intact and never collides with code at the repo root.

Output included: `latexmk -outdir` funnels the PDF *and* every intermediate into
`chapter/build/`, so nothing is ever written loose beside `main.tex` and no
build directory appears at the repo root. That directory is git-ignored and safe
to delete at any time.

One deliberate exception sits at the repo root: `files/` — source material,
because the code side may draw on it too.

| Field | Value | Where |
|---|---|---|
| Paper Path | `chapter/` | repo root |
| Main Tex | `main.tex` | in the paper subtree |
| Bibliography | `chapter/references.bib` | in the paper subtree |
| Figures | `chapter/figures/` | in the paper subtree |
| Scripts | `chapter/scripts/` | in the paper subtree |
| Build Output | `chapter/build/` | in the subtree, git-ignored, derived |
| Construction Path | `llm/construction/` | under `llm/` |
| Sprints | `llm/construction/sprints/` | from llm/governance/governance-delta.md §Repository Layout (Sprints slot) — do not change here |
| Memory Bank | `llm/memory_bank/` | from llm/governance/governance-delta.md — do not change here |
| Source Material | `files/` | repo root, shared with code |

## Venue

| Field | Value |
|---|---|
| Venue | Springer edited book: Using Artificial Intelligence in Empirical Software Engineering Research (chapter; proposal accepted, EasyChair #21) |
| Template | article (PLACEHOLDER — awaiting Springer svmult and the editors' chapter guidelines, due end of November 2026) |
| Template files | bundled |
| Page Limit | 0 |
| Page Limit Counts | including references |
| Submission Deadline | 2027-02-26 (first draft) |
| Submission Portal | https://easychair.org/conferences/?conf=aiemse2027 |
| Anonymised | no |

<!-- The call sets no formatting rules for the proposal, only "within one
     page", so the proposal uses plain `article`. The chapter itself will need
     Springer's book template (svmult or whatever the editors supply); when it
     arrives, drop it into the chapter's subtree and update this table. -->
<!-- Page Limit Counts: "body only" | "including references" | "including appendix" -->
<!-- Page Limit: an integer, or 0 for no limit. research-checks reads this. -->

## Own Bibliography

Path: none

<!-- The author's own prior publications, used by originality-agent for the
     self-plagiarism check. Add a .bib of Jason's prior papers when the
     chapter plan names what it builds on. -->

## Governance Composition

Governance delta present: yes

<!-- The governance delta is at llm/governance/governance-delta.md
     (agentic-governance v0.5 layout, not the pre-v0.3 docs/ path). It is
     authoritative for the memory-bank and roadmap paths; this file mirrors
     them. Its L0 allowlist already carries the research denials:

       deny proposal/**
       deny llm/construction/design/**
       deny llm/construction/requirements/**
       deny docs/research-delta.md
-->

## Section Word Budgets

<!-- `./proposal/scripts/wordcount.sh` reads "% WORD BUDGET: N" from the top of
     each proposal/sections/*.tex; this is the planning view. The whole
     proposal must fit one page (~530 words at 10pt with headings). -->

| Section | Budget |
|---|---|
| Abstract | 200 |
| 1 From AI tool to co-researcher | 1,000 |
| 2 Failure modes | 1,400 |
| 3 Governance framework | 2,000 |
| 4 Engineering reproducibility | 1,000 |
| 5 Two worked cases | 1,600 |
| 6 Adoption guide and agenda | 800 |

## Domain Review Questions

<!-- Added to review-agent's checklist for this project specifically. -->

- Does the proposal answer all five items the call requires, in one page?
- Does the chosen submission category match what the outline actually delivers?
- Is every piece of promised supplementary material something the author can release under FAIR principles?
- Does any claim attribute research, tools, or results to the author that the memory bank does not record?

## Related Repos

- [`agentic-governance`](https://github.com/djjay0131/agentic-governance) — governance canon; its delta here is `llm/governance/governance-delta.md`.
- [`agentic-research`](https://github.com/djjay0131/agentic-research) — this plugin.
- Evidence sources (plan §3): [`agentic-kg`](https://github.com/djjay0131/agentic-kg), [`agentic-kgcs`](https://github.com/djjay0131/agentic-kgcs), [`agentic-kgis`](https://github.com/djjay0131/agentic-kgis), [`reliable-trustworthy-se`](https://github.com/djjay0131/reliable-trustworthy-se) — read for concrete decisions, failures and lessons, not summarised.
