# Research Delta: icse2027-doctoral-symposium

Status: Draft
Last updated: 2026-10-29
Research: agentic-research v1.8 (layout followed by hand from the installed templates; `/research:establish` was not run in this session — run `/research:audit` from Claude Code to confirm)

## Paper Type

Type: position-paper
<!-- A doctoral-symposium extended abstract: a research plan, closest to position-paper. -->

## The Research

**About:** Dissertation plan for the ICSE 2027 Doctoral Symposium: keeping agent-built research knowledge checkable at the point of reuse — representation (claims + evidence + transformation history), governed transformations, and reliability of downstream reuse.
**Core claim / contribution:** Typed claims bound to source evidence and transformation provenance, with gated agent transformations, let later agents and humans detect unsupported claims more reliably than text/citation retrieval, at practical cost. (Thesis statement — planned evaluation.)
**State of the work:** idea + implemented substrate; no evaluation results
**Audience:** ICSE DS chairs and panel
**Co-authors:** none — the DS requires a single author. Collaborators are credited by citation and acknowledgment.
**Builds on:** ICSE 2026 FoSE (Cusati & Brown); agentic-kg, agentic-kgis, agentic-kgcs, agentic-kgps; PA-AKG proposal lineage

## Layout Paths

| Field | Value | Where |
|---|---|---|
| Paper Path | `paper/` | repo root |
| Main Tex | `main.tex` | in the paper subtree |
| Bibliography | `paper/references.bib` | in the paper subtree |
| Figures | `paper/figures/` | in the paper subtree |
| Scripts | `paper/scripts/` | in the paper subtree |
| Build Output | `paper/build/` | git-ignored |
| Construction Path | `llm/construction/` | under `llm/` |
| Memory Bank | `llm/memory_bank/` | under `llm/` |
| Source Material | `files/` | repo root |

## Venue

| Field | Value |
|---|---|
| Venue | ICSE 2027 Doctoral Symposium |
| Template | IEEEtran (`[10pt,conference]`, no compsoc) |
| Template files | system TeX (`kpsewhich IEEEtran.cls`) |
| Page Limit | 3 |
| Page Limit Counts | including references (camera-ready: 2 + 1 references-only page) |
| Submission Deadline | 2026-11-14 AoE |
| Submission Portal | https://icse2027-ds.hotcrp.com |
| Anonymised | no — single-authored, named |

## Own Bibliography

Path: `../cv/own-bib.bib` (sibling checkout)

## Governance Composition

Governance delta present: yes — `llm/governance/governance-delta.md`
(agentic-governance v0.9.1, adopted 2026-11-14). Memory bank:
`llm/memory_bank/` (matches the governance delta). Steward activation: INACTIVE.
L0 fast track denies `paper/**`, `llm/construction/design/**`,
`llm/construction/requirements/**`, and `docs/research-delta.md`.

**Known finding (2026-11-14, deadline exception).** Research control-plane
records (`docs/research-delta.md`, `docs/source-audit.md`,
`docs/contribution-boundaries.md`, `docs/evaluation-plan.md`,
`docs/timeline.md`, `docs/review-1.md`, `docs/review-2.md`) sit under the
declared artifacts directory `docs/`. They are sources of truth. Moving
them under `llm/` is deferred past the submission deadline and recorded rather
than done silently.

## Domain Review Questions

- Does any sentence identify, quote or summarize the SANER submission beyond "a related study is under review"?
- Is every "implemented/tested/planned/published" label consistent with `docs/source-audit.md`?
- Does the body fit 2 pages with references on page 3 (camera-ready shape)?
- Does every RQ have done / to-do / method / baseline / endpoint / limitation?

## Related Repos

agentic-kg, agentic-kgis, agentic-kgcs, agentic-kgps (instrument); fose2026 (published anchor); ai-empirical-se-chapter (sibling, boundary); saner2027-governed-agents, green-but-wrong-artifact (reserved); phd-milestones (timeline authority); cv.
