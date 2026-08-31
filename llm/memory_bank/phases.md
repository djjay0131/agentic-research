# Phases

## Done — v1.0.0 → v1.6.0
Plugin built, published, and hardened across five test rounds. See `progress.md`.

## Next — validation
1. Run `/research:preflight` for real; it has never executed as a skill.
2. Reach the preserve-don't-clobber memory-bank branch: governance writes real
   memory-bank content first, then research runs.
3. Collaborator dry run (see `llm/session_notes/`).

## Then — portfolio migration
1. `soa-agentic-se` — the reference layout; should be near a no-op.
2. `mats-12-application` — drop the hand-copied governance agents, install the
   plugin instead.
3. Retire `template-paper`; delete `claude-template` (an abandoned earlier
   attempt at this same project).
4. De-vendor Constellize across ~10 repos.
5. Clone `ncsu-las-2026` locally — it holds 7 agents and was invisible to the
   local survey.

## Later — out of scope for v1
The 11-agent code-review swarm and `construction-agent` are code-project
concerns. Own plugin, same pattern, different repo.
