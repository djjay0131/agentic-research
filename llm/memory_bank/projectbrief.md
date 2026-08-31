# Project brief

`agentic-research` makes academic writing projects **installable tooling**
instead of a template repository you copy.

## The problem it was built for

A survey of 82 repositories (2026-08-31) found the same six writing agents
copied into repo after repo in **23 near-identical variants**. Diffing them
showed the variants differed *only* by a hardcoded layout path string —
`construction/` vs `llm/construction/` vs `llm/`. No content divergence at all.
Roughly 230 of 353 `.claude/` files were vendored third-party content that had
already begun to drift into two naming conventions and two versions.

## The mechanism

One file per repo, `docs/research-delta.md`, declares that repo's paths, venue,
page limit and deadline. Every agent resolves paths from it. That single
indirection collapses all 23 variants into one installed copy.

## What it is not

- Not a plagiarism service. `originality-agent` compares a draft against locally
  available sources only and **cannot certify originality**. Saying otherwise
  would leave a researcher worse off than running no check at all.
- Not a governance system. It composes with `agentic-governance` and defers to
  it, but never depends on it.
- Not a code-project tool. The code-review agent swarm found in the survey was
  deliberately left out for a future plugin.
