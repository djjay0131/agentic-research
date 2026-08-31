---
name: add-paper
description: Add a reference to the bibliography from a DOI, arXiv id, or URL - fetch the metadata, verify it against Crossref/arXiv/OpenAlex, generate a bibtex entry in the repo's key convention, append it to the .bib, and record a verified entry in the citation matrix. Use whenever adding a citation.
argument-hint: "<doi | arxiv-id | url> [--cite-in <file>]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, WebFetch
---

# research:add-paper

Add one reference, verified, in one step. Rescued and generalised from the
`add-paper` skill that lived only in the `cv` repo.

Resolve `<bib>` and `<construction>` from `docs/research-delta.md`.

## 1. Identify the input

| Input looks like | Source of truth |
|---|---|
| `10.xxxx/…` or a doi.org URL | Crossref: `https://api.crossref.org/works/{doi}` |
| `arxiv:NNNN.NNNNN`, `arXiv.org/abs/…` | `https://export.arxiv.org/api/query?id_list={id}` |
| ACM DL / IEEE Xplore / Springer URL | Extract the DOI from the page, then Crossref |
| Any other URL | Fetch, extract title and authors, confirm via OpenAlex title search |
| A bare title | OpenAlex title search; **show the user the match and confirm before writing** |

## 2. Verify before writing

Never write an entry from a single unconfirmed source. Confirm at minimum the
first author's family name, the year, and the title. If nothing resolves, say
so and **do not invent an entry** — offer to add it as a `@misc` with the URL
and an explicit `% UNVERIFIED` marker instead.

If the work is an arXiv preprint that now has a published version, say so and
offer the published record.

## 3. Generate the key

Match the convention already in `<bib>`; if it is empty, use
`firstauthorlastnameYYYYkeyword` (lowercase, ASCII-folded), e.g.
`smith2024agents`. On collision, append `b`, `c`, …

## 4. Write

- Append the entry to `<bib>`, keeping the file's existing sort order
- Include `doi` and `url` whenever available
- Use the right entry type — `@inproceedings` for conference papers, not `@article`
- Add a verified record to `<construction>/requirements/references.json` and
  regenerate `citation-matrix.md` (see `citation-agent`)

## 5. Report

Show the entry you wrote, the key, and the verification source. If
`--cite-in <file>` was given, insert `\cite{key}` at the end of that file and
say where. Otherwise remind the user the entry is an orphan until cited.
