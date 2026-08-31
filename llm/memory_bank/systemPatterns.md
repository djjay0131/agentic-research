# System patterns

## 1. The delta owns every path

No agent, skill or script hardcodes a layout path. `docs/research-delta.md`
declares them; everything resolves from it. This is the whole reason one
installed copy can serve every repo, and why 23 agent variants collapsed to one.

**Corollary learned the hard way (v1.4.0):** the delta is *parsed*, so its
formatting is an interface. A provenance annotation written into a table's value
cell became part of the path. Values go in the value column; commentary goes in
its own column.

## 2. A skipped check must never read as a passed check

An undeclared path, a missing file, a check that could not run — each reports
explicitly as skipped. Silence is the failure mode: `research-checks.mjs` once
dropped two checks entirely when a delta field was absent and still printed
`0 failed`.

## 3. Every field must have an owner

`Governance delta present` was written by the scaffolder and read by nothing, so
it silently went false in a repo scoring 17/17. If something writes a field,
something must validate it.

## 4. The scaffolder and the checker must agree

v1.2.0 added an anonymity check the scaffolder then failed, because `establish`
never anonymised the title block. Adding a check means teaching the scaffolder to
satisfy it.

## 5. Point coupling in one direction

Research knows about governance; governance knows nothing about research. When
the research delta needed protecting from an L0 rule, the denial went into the
lines *research prints* rather than into governance's `HARD_DENY`.

## 6. Source and derived output are separated by tooling, not convention

`latexmk -outdir` funnels the PDF and every intermediate into `<paper>/build/`.
Relying on people to ignore `.aux` files beside their source does not work.

## 7. Say what a tool cannot do, every time

`originality-agent` states its limits before its findings. A researcher who
believes a check cleared their paper when it did not is worse off than one who
ran nothing.
