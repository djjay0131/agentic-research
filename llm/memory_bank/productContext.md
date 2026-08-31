# Product context

## Users

1. **The author** — writes papers and proposals continuously, was copying
   `template-paper` per project.
2. **A writing group** — colleagues installing it themselves on unfamiliar
   machines. This audience drove: standalone operation with no other plugin
   required, `${CLAUDE_PLUGIN_ROOT}` instead of any hardcoded `~/code` path,
   vendored `acmart.cls`, and `/research:preflight`.
3. **Governed projects** — repos already running `agentic-governance`, where a
   paper is one output among several.

## What they actually need

- A repo that compiles on the first try, on a machine with a minimal TeX install.
- Rebuild-on-save. In demos this lands harder than any agent.
- Per-section word budgets — the feature writers react to most.
- Citations verified against a real external source, not merely present in a
  `.bib`.
- Honesty about what the originality check cannot do.
