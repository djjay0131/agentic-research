# Tech context

## Runtime

- Claude Code plugin: `.claude-plugin/marketplace.json` → `./research`
- `research-checks.mjs`: Node 18+, **dependency-free by design** — a checker that
  needs `npm install` will not be run
- Scripts: bash, `latexmk`, `pdfinfo` (poppler)

## Environment facts learned in testing

- A minimal TeX Live ships **only `article.cls`** — no `acmart`, `IEEEtran` or
  `llncs`. The plugin vendors `acmart.cls` + `ACM-Reference-Format.bst`.
- CTAN was unreachable from both build environments, so `IEEEtran` and `llncs`
  could not be vendored. `preflight` installs them instead.
- `acmart` needs a font stack absent from BasicTeX: `libertine newtx txfonts
  inconsolata comment ncctools preprint totpages environ trimspaces textcase`.
- BasicTeX (~100 MB) plus those packages beats MacTeX (~5 GB) for this use.

## Path resolution

- `<paper>/scripts/_paths.sh` derives `PAPER_ROOT` from its own location and
  `REPO_ROOT` from `git rev-parse`. Only `MAIN_TEX` and `PAGE_LIMIT` are
  substituted at scaffold time.
- `research-checks.mjs` walks up for `docs/research-delta.md`, so it runs from
  the repo root, inside the paper subtree, or from CI.

## Platform constraint

`claude plugin install` will not upgrade an installed plugin; there is no
`claude plugin update`. Plugins bind at session start. Uninstall → marketplace
update → install → restart is the only path.
