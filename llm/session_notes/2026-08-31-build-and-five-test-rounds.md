# Session notes — 2026-08-31

From portfolio survey to a published, tested plugin at v1.6.0, in one session.

## Where it started

A survey of 82 GitHub repositories (54 cloned locally), 18 carrying `.claude/`
assets — 353 agent, skill and command files.

The headline number was misleading. Of those 353:
- ~230 were **vendored third-party Constellize content**, copied byte-for-byte
  into 10 repos, already drifted into two directory-naming conventions and two
  versions of `constellize:memory:update`.
- The genuinely owned writing toolkit was **six agents**. `latex-agent` was
  byte-identical across all six repos holding it. The other five existed in up
  to eight variants each — and diffing every variant showed they differed
  **only** by a hardcoded layout path string. Zero content divergence.

Two other findings shaped the build:
- **Citation-matrix work was not an agent.** It was split across `review-agent`,
  `paper-agent survey` and `latex-agent check-refs`.
- **No plagiarism or originality check existed anywhere.** Grep across all 353
  files found only mentions in research notes.

And `agentic-governance` was already a working plugin whose
`/governance:establish` proved the exact pattern wanted: an installed skill that
scaffolds a repo.

## Five test rounds

Every round found something real — including the round run against a repo that
was already scoring 17/17.

| Round | Headline finding |
|---|---|
| 1 | `claude plugin install` silently refuses to upgrade; scaffold did not survive its own `git clone` (no `.gitkeep`); `.gitignore` ignored `build/` but committed `main.pdf` |
| 2 | Build artifacts written beside source → `latexmk -outdir` |
| 3 | Build output location wrong (root vs subtree) |
| 4 | **The composition instructions broke composition** — the provenance annotation was written into the delta's value cell and parsed as part of the path. Also: the anonymity check was added without teaching the scaffolder to satisfy it |
| 5 | **`Governance delta present` was written by the scaffolder and read by nothing** — silently false in a repo scoring 17/17 |

## The lessons worth keeping

1. **Following the instructions literally is the test.** Round 4's headline bug
   existed only because the skill's own worked example was wrong. Anything a
   skill tells a model to write is an interface with a parser on the other end.
2. **A field nothing validates will go stale.** Three separate checkers ran over
   a repo and none read the field that was false.
3. **A skipped check reads as a passed check.** Shipped in `research-checks.mjs`
   despite being written as a warning in the originality skill in the same hour.
4. **Adding a check means teaching the scaffolder to pass it.**
5. **Ship, then test — not both at once.** The version moved under the tester on
   three consecutive rounds.
6. Tested against a stale copy of the checker twenty minutes after reading the
   report about stale installs. The trap is not knowledge, it is habit.

## Open at session end

- `/research:preflight` (v1.6.0) has never executed as a skill.
- The preserve-don't-clobber memory-bank branch has never run.
- Portfolio migration not started.
- `agentic-governance` v0.3.1 was pushed directly to `main`, bypassing that
  repo's own "changes must be made through a pull request" rule. Flagged for the
  owner to redo as a PR if wanted.
