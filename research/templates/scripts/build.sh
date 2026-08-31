#!/usr/bin/env bash
# One-shot build. All output — PDF and every intermediate — lands in $BUILD_DIR.
# Nothing is written into the paper subtree, which stays source-only.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/_paths.sh"
cd "$PAPER_ROOT"
mkdir -p "$BUILD_DIR"
latexmk -pdf -outdir="$BUILD_DIR" -interaction=nonstopmode -halt-on-error "$MAIN_TEX"
STEM="${MAIN_TEX%.tex}"
PAGES=$(pdfinfo "$BUILD_DIR/$STEM.pdf" 2>/dev/null | awk '/^Pages/{print $2}')
echo "Built -> ${BUILD_DIR#$REPO_ROOT/}/$STEM.pdf (${PAGES:-?} pages)"
if [ "${PAGE_LIMIT:-0}" -gt 0 ] && [ -n "${PAGES:-}" ] && [ "$PAGES" -gt "$PAGE_LIMIT" ]; then
  echo "OVER PAGE LIMIT: $PAGES / $PAGE_LIMIT" >&2
  exit 2
fi
