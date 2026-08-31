---
name: originality-check
description: Run an originality and drafting-hygiene review over the draft - verbatim and near-verbatim overlap with source material and cited works, self-plagiarism against the author's prior papers, quotations missing attribution, and claims with no traceable origin. Produces a reviewable report, never a pass/fail. Use before submitting or sharing a draft.
argument-hint: "[section…] [--self-check] [--unverified]"
allowed-tools: Read, Glob, Grep, Bash, WebFetch
---

# research:originality-check

Delegate to the `originality-agent`.

Resolve `<paper>`, `<construction>`, `<bib>`, and the own-bibliography path
from `docs/research-delta.md`.

## Say this first, every time

State the scope and the limits **before** showing findings:

> Compared `<paper>/` against N documents in `files/`, N cited works with
> retrievable text, N of your prior papers, and N earlier git revisions.
> This is not a plagiarism check against any published corpus — it cannot
> certify originality. For a submission-grade check use your institution's
> iThenticate or the venue's screening tool.

A researcher who thinks this cleared their paper is worse off than one who ran
nothing. Never let the report imply more coverage than it has.

## Modes

| Invocation | Does |
|---|---|
| (none) | Full review, all six checks, whole document |
| `<section…>` | Same, limited to named section files |
| `--self-check` | Self-plagiarism against the own-bibliography only |
| `--unverified` | Check 6 only: claims with no citation and no traceable origin in `results/`, `experiments/`, `data/`, or `files/`. The fastest useful pass, and the right one for an agent-drafted section. |

## Output

The `originality-agent` report format. Every finding shows the draft passage and
the source passage side by side, with a one-line "consider:" suggestion. No
finding is automatically a problem — each is a judgement call for the author,
and the report must read that way.

If the own-bibliography is not declared in the delta, say the self-plagiarism
check did not run and how to enable it. A skipped check reported as silence
reads as a passed check.
