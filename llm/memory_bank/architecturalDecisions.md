# Architectural decisions

## AD-001 — Separate repo, not a second plugin in `agentic-governance`
Governance is portfolio-wide; research applies to ~15 repos and to collaborators
who want nothing to do with governance. Separate versioning, and governance stays
project-agnostic by construction.

## AD-002 — Standalone first, composition second
A writing group installing this will not have governance. Research must be fully
functional alone — memory bank included, since that is part of the research
layout, not something inherited.

## AD-003 — Constellize is a dependency, never vendored
The survey found ~230 duplicated Constellize files across 10 repos, already
drifted into two naming conventions and two versions. Copying third-party content
is precisely the problem this plugin exists to end.

## AD-004 — The paper subtree is self-contained, including its output
`<paper>/` holds document, sections, figures, scripts and `build/`. It can be
moved to another repo intact, and adds exactly one top-level directory to a repo
that also holds code.

**Rejected:** `build/` at the repo root (v1.2.0). It added a top-level directory
for no benefit the subtree could not provide. Reverted in v1.3.0.

**Rejected:** nesting `src/`, `tests/`, `deploy/` under a `code/` wrapper to
reduce root entries. Those locations are near-universal conventions; fighting
tool defaults to save two lines of `ls` output would be a self-inflicted version
of the original problem.

## AD-005 — `files/` stays at the repo root
Source material is often needed by the code side too. The one deliberate
exception to the self-contained subtree.

## AD-006 — Reverse-order adoption is detected, not supported
`research:establish` defers to governance; `governance:establish` predates this
plugin and knows nothing about it. Testing showed the reverse order survives —
but by luck: governance's memory-bank step happened to take its append branch.
Rather than claim support, `governance.sync` **detects** the resulting stale
state and FAILs with instructions. Detection beats a fragile guarantee.

## AD-007 — `governance.l0` warns rather than fails
Governance's `checkL0Paths` is default-deny, so a missing `deny paper/**` is
absent explicitness, not an open door. Reporting it as a failure would overstate
it and train people to ignore failures.
