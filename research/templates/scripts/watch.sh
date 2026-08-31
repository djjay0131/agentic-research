#!/usr/bin/env bash
# Continuous local build: recompiles on every save. Ctrl-C to stop.
#
#   ./paper/scripts/watch.sh            # watch, no viewer
#   ./paper/scripts/watch.sh --view     # watch + open the PDF viewer
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/_paths.sh"
cd "$PAPER_ROOT"
mkdir -p "$BUILD_DIR"

if grep -q 'documentclass.*acmart' "$MAIN_TEX" 2>/dev/null \
   && ! kpsewhich libertine.sty >/dev/null 2>&1 && [ ! -f acmart.cls ]; then
  cat >&2 <<'MSG'
WARNING: `libertine` is missing and acmart needs it. Install acmart's fonts:

  sudo tlmgr update --self
  sudo tlmgr install libertine newtx txfonts inconsolata comment ncctools \
                     preprint totpages environ trimspaces textcase

MSG
fi

if [[ "${1:-}" == "--view" ]]; then
  exec latexmk -pdf -pvc -outdir="$BUILD_DIR" -interaction=nonstopmode -halt-on-error "$MAIN_TEX"
else
  exec latexmk -pdf -pvc -view=none -outdir="$BUILD_DIR" -interaction=nonstopmode -halt-on-error "$MAIN_TEX"
fi
