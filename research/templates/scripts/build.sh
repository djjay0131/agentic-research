#!/usr/bin/env bash
# One-shot build. Writes $PAPER_DIR/main.pdf and copies it to build/.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
. "$ROOT/scripts/_paths.sh"
cd "$ROOT/$PAPER_DIR"
latexmk -pdf -interaction=nonstopmode -halt-on-error "$MAIN_TEX"
STEM="${MAIN_TEX%.tex}"
mkdir -p "$ROOT/$BUILD_DIR"
cp "$STEM.pdf" "$ROOT/$BUILD_DIR/$STEM.pdf"
PAGES=$(pdfinfo "$STEM.pdf" 2>/dev/null | awk '/^Pages/{print $2}')
echo "Built -> $BUILD_DIR/$STEM.pdf (${PAGES:-?} pages)"
if [ "${PAGE_LIMIT:-0}" -gt 0 ] && [ -n "${PAGES:-}" ] && [ "$PAGES" -gt "$PAGE_LIMIT" ]; then
  echo "OVER PAGE LIMIT: $PAGES / $PAGE_LIMIT" >&2
  exit 2
fi
