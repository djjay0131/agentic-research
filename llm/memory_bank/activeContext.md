# Active context

**As of 2026-08-31 — v1.6.0, public, green.**

## State

Five test rounds against real repos. The last full run was 18 passed, 0
warnings, 0 failed. Every finding raised in every round is fixed.

- Standalone: verified end to end from a fresh clone.
- Composed with `agentic-governance`, governance first: all seven composition
  assertions pass.
- Reverse order (research first): survives, nothing overwritten — but survives by
  luck, not design. See `architecturalDecisions.md` AD-006.

## Immediately next

1. `/research:preflight` (new in 1.6.0) has **not been executed as a skill** yet.
   Same class of gap that produced findings in rounds 1–5.
2. The **preserve-don't-clobber memory-bank branch has never run.** In testing,
   governance either created nothing or research went first, so the branch was
   never reached. Needs a repo where governance has genuinely written memory-bank
   content first.
3. Portfolio migration has not started: `soa-agentic-se` first, then dropping the
   hand-copied governance agents from `mats-12-application`.

## Known external constraint

`claude plugin install` does not upgrade an installed plugin and there is no
`claude plugin update`. Plugins also bind at session start. This trapped testing
three rounds running; the only available mitigation is that `establish` now
announces its own version.
