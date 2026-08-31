# Research Delta: {{PROJECT_NAME}}

Status: Draft
Last updated: {{DATE}}
Research: agentic-research v{{VERSION}}

This file localizes the `agentic-research` plugin for this repository. Every
agent and skill in the plugin resolves its paths from here, so the plugin
itself hardcodes no layout. Declare project facts only — durable decisions
belong in ADRs or the design-authority document, not here.

## Paper Type

Type: {{PAPER_TYPE}}

<!-- one of: research-paper | proposal | position-paper | preprint -->
<!-- Determines which agent leads: paper-agent, proposal-agent, or
     position-paper-agent. A repo may hold more than one; name the primary. -->

## Layout Paths

The paper subtree is self-contained: the document, its figures, its scripts and
its build output all live under `{{PAPER_DIR}}/`, so it can be moved to another
repo intact and never collides with code at the repo root. `files/` is the
exception — it stays at the root because code and paper may both draw on it.

| Field | Value | Where |
|---|---|---|
| Paper Path | `{{PAPER_DIR}}/` | repo root |
| Main Tex | `{{MAIN_TEX}}` | in the paper subtree |
| Bibliography | `{{BIB_PATH}}` | in the paper subtree |
| Figures | `{{PAPER_DIR}}/figures/` | in the paper subtree |
| Build Output | `{{PAPER_DIR}}/build/` | in the paper subtree, git-ignored |
| Scripts | `{{PAPER_DIR}}/scripts/` | in the paper subtree |
| Construction Path | `{{CONSTRUCTION_DIR}}/` | under `llm/` |
| Memory Bank | `{{MEMORY_BANK_DIR}}/` | under `llm/` |
| Source Material | `files/` | repo root, shared with code |

## Venue

| Field | Value |
|---|---|
| Venue | {{VENUE}} |
| Template | {{LATEX_TEMPLATE}} |
| Page Limit | {{PAGE_LIMIT}} |
| Page Limit Counts | {{PAGE_LIMIT_SCOPE}} |
| Submission Deadline | {{DEADLINE}} |
| Submission Portal | {{PORTAL}} |
| Anonymised | {{ANONYMOUS}} |

<!-- Page Limit Counts: "body only" | "including references" | "including appendix" -->
<!-- Page Limit: an integer, or 0 for no limit. research-checks reads this. -->

## Own Bibliography

Path: {{OWN_BIB}}

<!-- The author's own prior publications, used by originality-agent for the
     self-plagiarism check. A path, or "none". -->

## Governance Composition

Governance delta present: {{HAS_GOVERNANCE}}

<!-- If yes, docs/governance-delta.md is authoritative for the memory-bank and
     roadmap paths, and this file defers to it rather than redeclaring them.
     Add these lines to that delta's L0 allowlist — paper prose is semantic
     work and must never ride the L0 fast track:

       deny {{PAPER_DIR}}/**
       deny {{CONSTRUCTION_DIR}}/design/**
       deny {{CONSTRUCTION_DIR}}/requirements/**
       allow {{PAPER_DIR}}/build/** path-only
-->

## Section Word Budgets

<!-- Optional. `./scripts/wordcount.sh` reads "% WORD BUDGET: N" from the top of
     each {{PAPER_DIR}}/sections/*.tex instead of this table; this is the
     planning view. Delete if unused. -->

| Section | Budget |
|---|---|
| Introduction | |
| Related Work | |
| Approach | |
| Evaluation | |
| Discussion | |
| Conclusion | |

## Domain Review Questions

<!-- Added to review-agent's checklist for this project specifically. -->

- Does this ...?

## Related Repos

<!-- Sibling repos: a code repo this paper reports on, a proposal that preceded
     it, the venue's artifact repo. -->
