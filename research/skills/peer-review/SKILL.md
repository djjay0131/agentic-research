---
name: peer-review
description: Run independent program-committee reviews of the paper - methods, venue expert, and reader - each in a fresh context, then aggregate a meta-review. Advisory only; review-agent remains the merge gate. Reviews substance, not form.
argument-hint: "[--stage outline|draft|camera-ready] [--persona methods|venue|reader]..."
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task
---

# research:peer-review

Reviews **substance**, not form. Three personas read the paper independently —
a methods reviewer, a venue expert, and a reader — and a meta-review aggregates
what they found. The reviews are **advisory**: `review-agent` stays the merge
gate, and a human decides what to act on.

The personas are independent on purpose. Do not let one reviewer see another's
review, and do not pass any persona's output into another persona's context.
The meta-review is the only place their findings meet.

## Path resolution

Read `docs/research-delta.md`. If it does not exist, stop and tell the user to
run `/research:establish`. If a governance delta exists, it is authoritative for
the memory-bank and roadmap paths. Look for
`llm/governance/governance-delta.md` first, then the legacy
`docs/governance-delta.md`.

Resolve every placeholder from the research delta:

| Placeholder | Delta field |
|---|---|
| `<construction>` | Construction Path |
| `<paper>` | Paper Path |
| `<bib>` | Bibliography |
| `<memory-bank>` | Memory Bank |

Reviews are control-plane records. They live under
`<construction>/reviews/`, never under `<paper>` or `docs/`.

If the delta has no `## Peer Review` section, say so, continue with the
information available, and note that the `peer-review` check will warn until
the section is added. The methods reviewer will infer a standard and ask the
author to record it; the venue reviewer will use a generic scale and say so.

## Arguments

```
/research:peer-review [--stage outline|draft|camera-ready] [--persona methods|venue|reader]...
```

- `--stage` defaults to `draft`.
- `--persona` may be repeated. The default is all three personas.
- `outline` reviews the outline and section plans only; skip line-level
  comments.
- `draft` is the normal full review.
- `camera-ready` adds venue compliance and drops the novelty debate.

## Procedure

1. **Resolve paths and stage.** Read the delta, confirm the paper subtree and
   construction path, and parse the stage and requested personas. Stop if there
   is no delta.

2. **Record the draft under review.** Run, from the repo root:

   ```bash
   git rev-parse HEAD
   git rev-parse HEAD:<paper>
   ```

   The first is `paper_commit`; the second is `paper_tree`. If either command
   fails, stop and report that the paper subtree is not tracked in git. If the
   working tree is dirty, say so in the final report — the recorded commit
   describes HEAD, not uncommitted edits.

3. **Create the review directory.** Use the local date and the stage:

   ```bash
   mkdir -p <construction>/reviews/<YYYY-MM-DD>-<stage>
   ```

4. **Run each requested persona as a separate subagent with a fresh context.**
   Give the subagent **only**:
   - its agent file (`methods-reviewer`, `venue-reviewer`, or
     `reader-reviewer`),
   - the stage,
   - the resolved paths.

   Run them in parallel where the harness allows. Do **not** pass any persona's
   output or findings to another persona. Each persona writes exactly one file:

   ```
   <construction>/reviews/<YYYY-MM-DD>-<stage>/<persona>.md
   ```

   If a persona cannot complete, do not invent its review. Report the failure
   and leave the file absent so the `peer-review` check fails rather than
   silently accepting an incomplete set.

5. **Write the meta-review.** After every requested persona has finished, read
   the persona files and write
   `<construction>/reviews/<YYYY-MM-DD>-<stage>/meta-review.md`. The
   meta-review **only aggregates**: it adds no new criticism, no new citation,
   and no new judgement of the paper. It must contain:

   ```markdown
   ---
   paper_commit: <40-char sha>
   paper_tree: <tree sha of <paper>>
   plugin_version: <x.y.z>
   personas: [methods, venue, reader]
   ---
   # Meta-review

   ## Agreement
   ## Disagreement
   ## Ranked essential fixes
   ## Scores

   ## Dispositions

   | # | Essential fix | Decision | Evidence |
   |---|---|---|---|
   | 1 | <as ranked above> | pending | |
   | 2 | ... | pending | |
   ```

   - **Agreement** — points where all reviewers agree.
   - **Disagreement** — where they disagree; this is the useful part. State
     each position and its persona, without resolving it.
   - **Ranked essential fixes** — the essential fixes from the personas,
     ranked, with the persona(s) that raised each and its location. Do not add
     fixes none of them raised.
   - **Scores** — the venue score and any other score recorded by a persona.
   - **Dispositions** — one row per ranked essential fix, and **every Decision
     is written as `pending`**. The reviewers never fill this table. A human
     (or an agent instructed by one, through a normal PR) replaces each
     `pending` with `fixed`, `wont-fix`, or `deferred` and supplies evidence.

   `personas` lists exactly the personas that ran. If only some ran, aggregate
   only those and list only those.

6. **Validate the set.** Run the checks so the `peer-review` check verifies the
   structure and independence markers:

   ```bash
   node <paper>/scripts/research-checks.mjs
   ```

   If the script is not there, say so and run the plugin's copy instead. The
   check cannot judge review quality; it verifies structure only.

7. **Report.** Give the paths to each review and the meta-review, and the top
   essential fixes from the meta-review. Do not edit the paper. Do not open
   issues unless the user asks.

## Boundaries

- No persona edits the paper.
- No persona reads another persona's review or the memory bank's opinions about
  the paper's quality.
- No persona is given another persona's output.
- No persona names another persona's review file in its output, even to say it
  did not read it. The `peer-review` check treats that as an independence
  violation.
- The reviews are advisory records. `review-agent` is still the merge gate and
  a human decides what to act on.
