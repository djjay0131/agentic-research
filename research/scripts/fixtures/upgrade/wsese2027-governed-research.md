# Research Delta: wsese2027-governed-research

Status: Active
Last updated: 2026-11-13
Research: agentic-research v1.8.0

This file localizes the `agentic-research` plugin for this repository. Every
agent and skill in the plugin resolves its paths from here, so the plugin
itself hardcodes no layout. Declare project facts only — durable decisions
belong in ADRs or the design-authority document, not here.

## Paper Type

Type: research-paper

<!-- paper-agent leads. The WSESE category (Experience/WIP vs Technical) is a
     submission-form choice, not a paper type; it is recorded under Venue. -->

## The Research

**About:** When an AI agent drafts the protocol, scripts, numbers and citations
of an empirical study, each artifact can look plausible while the links between
them break: a reported value no longer matches the current analysis, an
analysis was not re-run after its input changed, or a claim was strengthened
after its source was checked. Working title: *From Agent Output to Research
Evidence: An Executable Method for AI-Assisted Empirical Studies*.

**Core claim / contribution:** Most links in an AI-assisted study's evidence
chain can be checked mechanically, and the ones that cannot (semantic support,
construct validity, who made a judgment) can be made visible as human queues.
Contribution: the method (manifest + controls C1–C9,
`llm/construction/design/method-spec.md`), a worked package on public data, a
seeded-fault evaluation, and an explicit boundary of what the controls cannot
establish.

**State of the work:** results in hand — first full draft compiles; evaluation
run twice with identical results; independent review addressed. Pending: human
support verdicts, external reference verification, authorship, overlap
sign-off.

**Audience:** WSESE 2027 attendees — empirical SE researchers integrating AI
into their studies, and reviewers who must assess AI-assisted studies.

**Co-authors:** Jason Cusati (owner). Dr. Chris Brown is a collaborator on this
repo; authorship is not decided — never invented.

**Builds on:** reporting guidance for LLM-assisted empirical SE (Baltes et al.
2025; PRIMES 2.0), reproducible-computation practice (Sandve et al. 2013;
noWorkflow), and the data-to-paper platform's result-to-code traceability. The
author's `agentic-research` tooling supplies bibliographic checks (C7 is not
claimed as new). See `paper/references.bib`.

## Layout Paths

The paper subtree is fully self-contained: document, sections, figures, scripts
and build output all live under `paper/`, so it can be moved to another repo
intact and never collides with code at the repo root.

Output included: `latexmk -outdir` funnels the PDF *and* every intermediate into
`paper/build/`, so nothing is ever written loose beside `main.tex` and no
build directory appears at the repo root. That directory is git-ignored and safe
to delete at any time.

One deliberate exception sits at the repo root: `files/` — source material,
because the code side may draw on it too.

| Field | Value | Where |
|---|---|---|
| Paper Path | `paper/` | repo root |
| Main Tex | `main.tex` | in the paper subtree |
| Bibliography | `paper/references.bib` | in the paper subtree |
| Figures | `paper/figures/` | in the paper subtree |
| Scripts | `paper/scripts/` | in the paper subtree |
| Build Output | `paper/build/` | in the subtree, git-ignored, derived |
| Construction Path | `llm/construction/` | under `llm/` |
| Sprints | `llm/construction/sprints/` | from llm/governance/governance-delta.md §Repository Layout (Sprints slot) — do not change here |
| Memory Bank | `llm/memory_bank/` | from llm/governance/governance-delta.md — do not change here |
| Source Material | `files/` | repo root, shared with code |
| Code | `src/`, `study/`, `eval/`, `tests/` | repo root — research code, not production source |

## Venue

| Field | Value |
|---|---|
| Venue | WSESE 2027 (ICSE 2027 workshop) — category: Experience report / WIP (provisional) |
| Template | IEEEtran |
| Template files | `paper/IEEEtran.cls`, `paper/IEEEtran.bst` (vendored V1.8b) |
| Page Limit | 6 |
| Page Limit Counts | including references |
| Submission Deadline | 2026-11-27 AoE |
| Submission Portal | https://icse2027-wsese.hotcrp.com/ |
| Anonymised | yes |

<!-- Verified CFP facts: docs/cfp-facts-2026-10-29.md. WSESE does not say
     whether references count; 6 pp including references is the conservative
     reading. Real author details for camera-ready: not decided (see Co-authors). -->

## Own Bibliography

Path: none

<!-- Add a .bib of the authors' prior publications before running
     /research:originality-check for self-plagiarism. -->

## Governance Composition

Governance delta present: yes

<!-- The governance delta is at llm/governance/governance-delta.md
     (agentic-governance v0.9 layout, not the pre-v0.3 docs/ path). It is
     authoritative for the memory-bank and sprints paths; this file mirrors
     them. Its L0 allowlist carries the research denials:

       deny paper/**
       deny llm/construction/design/**
       deny llm/construction/requirements/**
       deny docs/research-delta.md

     Known tool gap: research-checks.mjs v1.8.0 looks for the governance
     delta only at docs/governance-delta.md, so its governance.sync and
     governance.l0 checks cannot see a v0.9-layout delta. -->

## Section Word Budgets

<!-- `./paper/scripts/wordcount.sh` reads "% WORD BUDGET: N" from the top of
     each section file; this is the planning view for a 6-page IEEE paper. -->

| Section | Budget |
|---|---|
| Abstract | 250 |
| Introduction | 500 |
| Background and Related Work | 400 |
| Method | 1,100 |
| Evaluation Design | 500 |
| Results | 800 |
| Discussion | 650 |
| Conclusion | 200 |

## Domain Review Questions

- Is every number in the paper generated (`paper/generated/`), not typed?
- Is every seeded fault described as synthetic, and no detection count read as a rate?
- Does the text claim anything the controls cannot establish (method spec §5)?
- Does anything reuse SANER 2027 findings or the Springer chapter's framework as new?
- Do both cited support judgments carry a human verdict before submission?

## Related Repos

- [`agentic-governance`](https://github.com/djjay0131/agentic-governance) — governance canon; its delta here is `llm/governance/governance-delta.md`.
- [`agentic-research`](https://github.com/djjay0131/agentic-research) — this plugin.
- [`website`](https://github.com/djjay0131/website) — research hub; this repo publishes as satellite `wsese2027` (private items only).
- `ai-empirical-se-chapter` — Springer chapter (accepted proposal); boundary in `llm/construction/design/contribution-boundary.md`.
