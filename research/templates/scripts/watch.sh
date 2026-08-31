#!/usr/bin/env bash
# Continuous local build: recompiles on every save. Ctrl-C to stop.
#
#   ./scripts/watch.sh            # watch, no viewer (default: quiet)
#   ./scripts/watch.sh --view     # watch + auto-open the PDF viewer
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
. "$ROOT/scripts/_paths.sh"
cd "$ROOT/$PAPER_DIR"

# acmart pulls a font stack that is not in a minimal TeX Live.
if grep -q 'documentclass.*acmart' "$MAIN_TEX" 2>/dev/null \
   && ! kpsewhich libertine.sty >/dev/null 2>&1; then
  cat >&2 <<'MSG'
WARNING: `libertine` is missing and acmart needs it. Install acmart's fonts:

  sudo tlmgr update --self
  sudo tlmgr install libertine newtx txfonts inconsolata comment ncctools \
                     preprint totpages environ trimspaces textcase

MSG
fi

if [[ "${1:-}" == "--view" ]]; then
  exec latexmk -pdf -pvc -interaction=nonstopmode -halt-on-error "$MAIN_TEX"
else
  exec latexmk -pdf -pvc -view=none -interaction=nonstopmode -halt-on-error "$MAIN_TEX"
fi
