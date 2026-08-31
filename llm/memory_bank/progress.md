# Progress

| Version | Shipped |
|---|---|
| 1.0.0 | 8 agents, 5 skills, delta mechanism, build scripts, `research-checks.mjs` |
| 1.1.0 | `construction/` and memory bank moved under `llm/`; paper subtree made self-contained |
| 1.2.0 | `latexmk -outdir`; `.gitkeep`/README so the scaffold survives a clone; anonymity check; no duplicate root `scripts/`; upgrade path documented |
| 1.3.0 | Build output moved back inside `<paper>/build/`; no root `build/` |
| 1.4.0 | Provenance annotation moved out of the delta's value cell (it was being parsed into the path); `establish` anonymises the title block; memory bank backfilled when governance declares but does not create; `references.json` seeded |
| 1.5.0 | `governance.sync` and `governance.l0` checks; `deny docs/research-delta.md`; audit reverse-order path |
| 1.6.0 | `/research:preflight` |

## Test rounds

Every round found something real, including the round on a repo already scoring
17/17. Findings are recorded in `llm/session_notes/`.
