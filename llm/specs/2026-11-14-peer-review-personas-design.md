# Peer-Review Personas: Design

Status: Approved by owner (2026-11-14, in session)
Date: 2026-11-14
Owner: Jason Cusati
Target release: agentic-research v1.9.0 (the OpenCode-compatibility work previously scoped as 1.9.0 moves to 1.10.0)

## 1. Problem

The plugin reviews **form**, not **substance**. `review-agent` checks
citations, compilation, placeholders and consistency. `citation-agent` owns the
reference store. `originality-agent` checks overlap with sources. None of them
reads the paper the way a program committee does, so a paper can pass every
check and still be rejected for an unsupported claim, a missing related work,
or an introduction that promises more than the paper delivers.

## 2. Decision

Add three **independent** reviewer personas, modeled on a program committee,
plus a meta-review, behind one skill: `/research:peer-review`.

| Persona | Agent file | Question it answers | Rubric source |
|---|---|---|---|
| Methods reviewer | `methods-reviewer.md` | Is it sound? | ACM SIGSOFT Empirical Standards for the paper's method (resolved from the delta) |
| Venue expert | `venue-reviewer.md` | Is it new, and does it fit? | The venue's own call and review form from `files/`; for proposals, the program's merit criteria |
| Reader | `reader-reviewer.md` | Does it land? | Narrative contract and the delta's House Style |

The reviews are **advisory**. `review-agent` stays the merge gate. A human
decides what to act on.

## 3. Personas

All three share these rules:

- Read only: the paper source under `<paper>`, the delta, `files/`, and the
  reference store. Never read another persona's review. Never read the memory
  bank's opinions about the paper's quality (it is written by the authors'
  agents and would anchor the reviewer).
- Never edit the paper. Output is one review file.
- Every criticism cites a location (section, figure, line or claim) and says
  what would fix it. Distinguish **essential** from **desirable** fixes.
- No praise padding. Strengths are listed only when they are specific.
- State confidence (1–5) and what the reviewer could not assess.

### 3.1 Methods reviewer: "Is it sound?"

- Identify the method type(s) and the matching Empirical Standard(s). The delta
  names them; if it does not, infer, say so, and ask the user to record it.
  The standards are referenced, not vendored: point to
  `https://github.com/acmsigsoft/EmpiricalStandards`, or use a copy the
  author placed in `files/`.
- Walk the standard's essential attributes, then desirable ones. For each
  essential attribute: met / partly / not met / not applicable, with location.
- RQ-to-evidence trace: list each RQ, the evidence offered, and whether the
  evidence answers it. Flag any claim in the abstract or conclusion with no
  supporting result.
- Validity: construct, internal, external, conclusion. Flag ceiling and floor
  effects, missing baselines, sample size against the claim's strength,
  multiple comparisons, and agreement statistics without a calibration step.
- Reproducibility: is there an artifact, is it enough to rerun, are versions
  and seeds pinned.
- Apply the standards' two reviewer rules: do not reject for not doing a
  different study, and do not demand attributes outside the method's standard.

### 3.2 Venue expert: "Is it new, and does it fit?"

- Persona: a senior program-committee member for the venue in the delta
  (or a grant panelist when Paper Type is proposal).
- Read the call and review form from the paths the delta's Peer Review
  section names. Score on the venue's own scale. If no form exists, use a
  generic accept-to-reject scale and say so.
- Novelty: compare the contribution against the reference store, and name the
  closest prior work. Flag related work that a PC member at this venue would
  expect and that is missing. Do not invent references: every suggested
  missing work must be found and verified (Consensus first, as `review-agent`
  §1 does) or labeled "search suggestion, unverified".
- Significance and fit: does the contribution matter to this venue's
  audience; is the track right; does it meet the call's mandatory items
  (page limit, anonymity, artifact or data statements, LLM-use disclosure if
  the venue requires one).
- For proposals: the program's merit criteria (for NSF, Intellectual Merit and
  Broader Impacts), feasibility, and fit with the solicitation.

### 3.3 Reader: "Does it land?"

- Persona: an informed outsider in the field who reads the title, abstract,
  introduction, figures and conclusion, and decides whether to read the rest.
- Narrative contract: list what the abstract and introduction promise, then
  check whether the body delivers each. Report gaps both ways (promised, not
  delivered; delivered, never promised).
- First-page test: after the abstract and first page, can the reader state
  the problem, the contribution and the evidence in one sentence each?
- Figures and tables: each understandable from its caption alone.
- House Style: apply the rules listed in the delta's Peer Review section.
  Ship none by default. A typical entry: "no em-dashes", "vary sentence
  length", "no claims that components fit together perfectly". Also report
  signs of LLM-generated prose (uniform sentence rhythm, stock transitions,
  hedging stacks), as observations with locations, never as accusations.

## 4. The skill: `/research:peer-review`

```
/research:peer-review [--stage outline|draft|camera-ready] [--persona methods|venue|reader]...
```

1. Resolve paths from `docs/research-delta.md` (and the governance delta if
   present). Stop if no delta exists.
2. Record the paper commit under review (`git rev-parse HEAD`, and the tree
   hash of `<paper>`).
3. Stage defaults to `draft`. Stage changes depth: `outline` reviews the
   outline and section plans only and skips line-level comments;
   `camera-ready` adds venue compliance and drops novelty debate.
4. Run each requested persona (default: all three) as a **separate subagent
   with a fresh context**, giving it only its agent file, the stage, and the
   paths. Personas run in parallel where the harness allows. No persona's
   output is passed to another.
5. Write each review to
   `<construction>/reviews/<YYYY-MM-DD>-<stage>/<persona>.md`.
6. Write `meta-review.md` in the same directory: points where all three
   agree, where they disagree (the useful part), essential fixes ranked, and
   the venue score. The meta-review only aggregates; it adds no new
   criticism.
7. Run `research-checks.mjs` so the `peer-review` check validates the set.
8. Report the paths and the top essential fixes. Do not edit the paper and do
   not open issues unless the user asks.

Reviews are control-plane records (review records), so they live under
`<construction>`, never under `<paper>` or `docs/`.

## 5. Review record format

Each persona file:

```markdown
---
persona: methods | venue | reader
stage: outline | draft | camera-ready
paper_commit: <40-char sha>
paper_tree: <tree sha of <paper>>
reviewer_session: <unique id for this subagent run>
plugin_version: <x.y.z>
confidence: <1-5>
score: <venue scale value or n/a>
---
# <Persona> review

## Summary
## Essential fixes
## Desirable fixes
## Strengths
## Could not assess
```

`meta-review.md` carries the same commit fields, `personas: [methods, venue, reader]`,
and sections `## Agreement`, `## Disagreement`, `## Ranked essential fixes`,
`## Scores`.

## 6. Deterministic check: `peer-review` in `research-checks.mjs`

For each directory under `<construction>/reviews/`:

| Condition | Result |
|---|---|
| No reviews directory | PASS ("no reviews yet") |
| A persona file missing required frontmatter or sections | FAIL |
| Two persona files with the same `reviewer_session` | FAIL (independence) |
| A persona file names another persona's file | FAIL (independence) |
| Persona files disagree on `paper_commit` | FAIL |
| `meta-review.md` missing, or missing a persona it should aggregate | FAIL |
| Latest review set's `paper_tree` differs from the current tree of `<paper>` | WARN ("reviews are of an older draft") |
| Delta has no Peer Review section | WARN |

The check verifies **structure and independence markers only**. It cannot
judge review quality, and the README says so.

## 7. Delta and lifecycle changes

- `templates/research-delta-template.md`: new `## Peer Review` section with
  Empirical Standard(s), Venue Call path, Review Form path, Score Scale,
  House Style (bullet list, may be empty).
- `establish`: Step 2b asks (skippable) for the standard and house style; the
  upgrade path adds the section without changing set values.
- `audit`: reports a missing Peer Review section, and the date and staleness
  of the latest review set.
- `review-agent`: Integration section notes that peer reviews are advisory and
  not part of its verdict.
- `paper-agent`, `proposal-agent`, `position-paper-agent`: the Internal Review
  stage points to `/research:peer-review`.
- README, CHANGELOG (1.9.0), `VERSION`, `plugin.json`, `marketplace.json`.

## 8. Tests

- `research/scripts/research-checks.test.mjs` (new, dependency-free): fixture
  repos for every row of §6, plus a clean repo with no reviews. Each fixture
  asserts the exact status. Runs twice and asserts identical output.
- `.github/workflows/ci.yml` (new) runs the test file.
- **Live trial (Claude, after build):** install the plugin build from the
  branch in a scratch clone of a real paper repo on the VM, run
  `/research:peer-review --stage draft`, and confirm the set passes the
  `peer-review` check and that the three reviews do not reference each other.
  The trial's LLM output is not deterministic; the check that judges it is.

## 9. Rollout

After merge and tag:

1. Update the installed plugin on the Mac and the VM (uninstall, marketplace
   update, install; restart sessions).
2. For each repo whose `docs/research-delta.md` pins agentic-research, run the
   upgrade path in a branch: add the Peer Review section (values left empty
   for the owner), refresh `<paper>/scripts/research-checks.mjs`, bump the pin
   to 1.9.0, run the checks, open a PR. The list of repos is computed by a
   script over the owner's repositories, not by memory.
3. The owner fills in each repo's Peer Review values (standard, venue form,
   house style) and merges.

## 10. Out of scope

- Running the personas under OpenCode (v1.10.0).
- Simulating rebuttal or discussion phases.
- Any automatic score that blocks a merge.
