# Research Delta: saner2027-governed-agents

Status: Active
Last updated: 2026-10-08
Research: agentic-research v1.8.0

This file localizes the `agentic-research` plugin for this repository. Every
agent and skill in the plugin resolves its paths from here, so the plugin
itself hardcodes no layout. Declare project facts only — durable decisions
belong in ADRs or the design-authority document, not here.

## Paper Type

Type: research-paper

<!-- one of: research-paper | proposal | position-paper | preprint -->
<!-- paper-agent leads. The paper is a controlled empirical study (ADR-0002). -->

## The Research

<!-- Captured from the owner's setup brief (files/setup-prompt.md) and
     mirrored into the memory bank. If a field says "not captured", fill it in
     and run /research:audit. -->

**About:** A controlled study of whether AI coding agents can tell when
green verification evidence does not support a "done" claim. Tasks are real
verification failures reconstructed from five agent-built repositories, each
paired with its fixed version as a clean control. Design: verifier context
(Continued vs Fresh) × protocol (Replay vs agent-built Falsify). Working
title: *Green but Wrong: Can Coding Agents Falsify Broken Verification
Evidence?* RQ1 context, RQ2 protocol, RQ3 probe quality, RQ4 cost. Design
authority: `llm/specs/2026-10-08-verification-study-design.md` (ADR-0002).

**Core claim / contribution:** (1) a paired task set of real verification
failures with oracles; (2) controlled evidence on verifier context and on
falsify vs replay, measured as false certification and false alarms; (3) an
analysis of how valid agent-built falsification probes are; (4) an
anonymized replication package. No claim that a governance framework
"improves" software.

**State of the work:** design — 41-incident pool mined (2026-10-08), design
spec and plan proposed, no tasks packaged, no runs, nothing drafted.
Schedule: `llm/plans/2026-10-08-saner2027-project-plan.md`.

**Audience:** SANER Agentic AI4SE reviewers and attendees — researchers and
practitioners studying agents as software engineering systems, including
"safety, security, privacy, accountability, and governance for AI agents"
and "industrial experiences, case studies, and lessons learned" (CFP topics).
What they already believe that this has to move: that a green test
suite or check run, re-run by an agent, is adequate evidence that agent work
is done; and that a second agent reviewing the work is enough to catch it.

**Co-authors (decided 2026-10-17, Jason):** Jason Cusati and Chris Brown.
Yovi Solomon is **tentative**: to be confirmed or declined before the abstract
is registered on EasyChair (target Sun 2026-10-18), because the author list
freezes then. Order, affiliations and emails as Jason enters them in
EasyChair; do not invent any. Nothing of this goes into `paper/` before
acceptance: the title block stays
`\author{\IEEEauthorblockN{Anonymous Author(s)}}` (double-anonymous review).

**Builds on:** the evidence repos `agentic-governance`, `agentic-research`,
`agentic-kg`, `agentic-kgis`, `agentic-kgcs` (all cited in the third person,
via anonymized links). `agentic-kg-research` is related work only. Works the
paper is positioned against (all to be verified before citing): LLM
self-correction/self-verification limits; studies of weak tests behind
"resolved" agent patches on SWE-bench; mutation analysis and test adequacy;
LLM-as-judge and reviewer agents for code. See the design spec §13.

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
| Roadmap | `llm/plans/roadmap.md` | from llm/governance/governance-delta.md — do not change here |
| Source Material | `files/` | repo root, shared with code |

## Venue

| Field | Value |
|---|---|
| Venue | SANER 2027 (34th IEEE Int. Conf. on Software Analysis, Evolution and Reengineering), Agentic AI4SE Track — Richmond, VA, 9–12 March 2027 |
| Template | IEEEtran |
| Template files | system install (`tlmgr install ieeetran`); not vendored |
| Page Limit | 12 |
| Page Limit Counts | including references |
| Submission Deadline | 2026-10-23 |
| Submission Portal | https://easychair.org/conferences/?conf=saner27tracks |
| Anonymised | yes |

<!-- The CFP rule is 10 body pages + up to 2 pages of references only
     (files/cfp-saner2027-agentic-ai4se.md). research-checks.mjs knows one
     total, so Page Limit is the total (12). The body limit (10) is enforced
     separately by paper/scripts/page-check.sh, which build.sh and CI both run;
     BODY_PAGE_LIMIT lives in paper/scripts/_paths.sh. -->
<!-- Class line prescribed by the CFP: \documentclass[10pt,conference]{IEEEtran},
     without compsoc or compsocconf. -->
<!-- Other dates (AoE): abstract (mandatory) 2026-10-19; notification
     2026-12-08; camera-ready and author registration 2027-01-08. Select the
     "Agentic AI4SE Track" on EasyChair. -->
<!-- Review: double-anonymous; desk reject if violated. Omit authors,
     affiliations, acknowledgments; cite own work in the third person;
     anonymize links (e.g. anonymous.4open.science). -->
<!-- AI use: IEEE authorship policy applies, including generative-AI use. AI
     use must be disclosed per IEEE policy (the conference guideline puts it in
     the acknowledgments, which the review copy must omit — open question in
     llm/memory_bank/activeContext.md). -->
<!-- Review criteria: relevance, originality, significance, soundness,
     evaluation quality, open science/verifiability, presentation. -->

## Own Bibliography

Path: none

<!-- The author's own prior publications, used by originality-agent for the
     self-plagiarism check. Add a .bib when authorship is settled. Note the
     overlap constraint with ai-empirical-se-chapter (Related Repos). -->

## Governance Composition

Governance delta present: yes

<!-- The governance delta is at llm/governance/governance-delta.md
     (agentic-governance v0.9.1 layout, not the pre-v0.3 docs/ path).
     paper/scripts/research-checks.mjs carries the same local patch as
     ai-empirical-se-chapter so it finds the delta there. The governance delta
     is authoritative for the memory-bank and roadmap paths; this file mirrors
     them. Its L0 allowlist already carries the research denials:

       deny paper/**
       deny llm/construction/design/**
       deny llm/construction/requirements/**
       deny docs/research-delta.md
-->

## Section Word Budgets

<!-- `./paper/scripts/wordcount.sh` reads "% WORD BUDGET: N" from the top of
     each paper/sections/*.tex; this is the planning view. Ten IEEE two-column
     pages hold roughly 8,000-9,000 words with no figures; the budget leaves
     room for tables and figures. -->

| Section | Budget |
|---|---|
| Abstract | 200 |
| Introduction | 850 |
| Background and Related Work | 850 |
| Study Design (task set + 2×2 design + measures) | 1700 |
| Results (RQ1–RQ4) | 2300 |
| Discussion and Threats to Validity | 1050 |
| Conclusion | 200 |

## Domain Review Questions

<!-- Added to review-agent's checklist for this project specifically. -->

- Does every result trace to rows in `experiment/runs/raw.jsonl` via the frozen `experiment/results/analysis.py`, and every task to a validated oracle and its buggy/fix SHAs?
- Is every deviation from the `protocol-lock` tag reported?
- Is the paper still anonymous — no names, affiliations, acknowledgments, first-person self-citation, or non-anonymized links?
- Does the change stay on the engineering artifact and its evidence, rather than the chapter's GAER framework?
- Is AI use in producing the paper and the dataset disclosed per IEEE policy without breaking anonymity?
- Does the body end by page 10, with only references on pages 11–12?

## Related Repos

- [`agentic-governance`](https://github.com/djjay0131/agentic-governance) — governance canon (delta here: `llm/governance/governance-delta.md`); also the primary evidence repo and subject of the paper.
- [`agentic-research`](https://github.com/djjay0131/agentic-research) — this plugin; also an evidence repo.
- Evidence repos: `agentic-kg`, `agentic-kgis`, `agentic-kgcs`. Related work only: `agentic-kg-research`.
- `ai-empirical-se-chapter` — the Springer chapter proposal due the same day; it cites this paper and must not reuse its evidence.
