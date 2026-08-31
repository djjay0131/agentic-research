#!/usr/bin/env bash
# Produce an arXiv-ready submission tarball in build/arxiv/.
#
# arXiv does NOT run BibTeX, so the .bbl must be shipped. arXiv prefers a flat
# directory, so \input paths are inlined with latexpand where available.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/_paths.sh"
OUT="$BUILD_DIR/arxiv"
STEM="${MAIN_TEX%.tex}"
rm -rf "$OUT" && mkdir -p "$OUT"
cd "$PAPER_ROOT"

latexmk -pdf -interaction=nonstopmode -halt-on-error "$MAIN_TEX"

if command -v latexpand >/dev/null 2>&1; then
  latexpand --empty-comments "$MAIN_TEX" > "$OUT/$MAIN_TEX"
else
  echo "latexpand not found (tlmgr install latexpand); shipping the tree unflattened."
  cp "$MAIN_TEX" "$OUT/$MAIN_TEX"
  [ -d sections ] && mkdir -p "$OUT/sections" && cp sections/*.tex "$OUT/sections/"
fi

cp "$STEM.bbl" "$OUT/" 2>/dev/null || echo "WARNING: no $STEM.bbl — arXiv will not resolve citations."
for f in *.cls *.bst *.sty; do [ -e "$f" ] && cp "$f" "$OUT/"; done 2>/dev/null || true
[ -d "$FIGURES_DIR" ] && cp -R "$FIGURES_DIR" "$OUT/figures" 2>/dev/null || true

printf '%%%% arXiv: compile with pdflatex\n' > "$OUT/00README.XXX"

cd "$OUT" && tar czf ../arxiv-submission.tar.gz .
echo "arXiv package -> ${BUILD_DIR#$REPO_ROOT/}/arxiv-submission.tar.gz"
echo "Sanity check: compile it in a clean directory before uploading."
