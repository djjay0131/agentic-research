---
name: citation-matrix
description: Rebuild and verify the whole citation matrix - extract every cite key from the document, resolve each in the bibliography, verify metadata against Crossref/arXiv/OpenAlex, flag fabricated or mismatched references, orphans, missing entries, preprints cited as published, and undisclosed self-citations. Use before submission or after a batch of new references.
argument-hint: "[--verify-only] [--quick]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, WebFetch
---

# research:citation-matrix

Delegate to the `citation-agent`. This skill is the entry point; the agent
holds the procedure and the schema.

Resolve `<paper>`, `<bib>`, and `<construction>` from `docs/research-delta.md`.

## Modes

| Invocation | Does |
|---|---|
| (none) | `citation-agent build` — full pass: extract, resolve, verify, write JSON, regenerate matrix |
| `--verify-only` | Re-verify existing records; add no new ones |
| `--quick` | Structural only — missing and orphan keys. No network. Seconds, not minutes. |

## Before you start

Tell the user how many keys will be verified and that a full pass makes one
network request per unverified key. On a paper with 60 references that is a
minute or two — offer `--quick` if they are mid-draft and just want the
structural answer.

## After

Report in the `citation-agent` output format. Lead with anything flagged
`NOT_FOUND` — a reference that resolves against no external source is the
finding that matters most, and it must never be buried under a table of passes.

Then state plainly what changed: how many records were added, how many
verified, how many still unverified and why.
