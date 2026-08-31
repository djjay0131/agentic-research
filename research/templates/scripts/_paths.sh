#!/usr/bin/env bash
# Written by /research:establish. Mirrors docs/research-delta.md.
#
# These scripts live INSIDE the paper subtree (<paper>/scripts/), so the whole
# subtree — document, figures, scripts, build output — can be moved or copied
# to another repo intact, and repo-root code directories never collide with it.
#
#   PAPER_ROOT  the paper subtree itself (contains main.tex)
#   REPO_ROOT   the git repo root (for files/, docs/, and Overleaf sync)

PAPER_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$PAPER_ROOT" && git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then REPO_ROOT="$(cd "$PAPER_ROOT/.." && pwd)"; fi

MAIN_TEX="${MAIN_TEX:-__MAIN_TEX__}"          # main.tex
BUILD_DIR="${BUILD_DIR:-$PAPER_ROOT/build}"   # where the PDF lands
FIGURES_DIR="${FIGURES_DIR:-$PAPER_ROOT/figures}"
FILES_DIR="${FILES_DIR:-$REPO_ROOT/files}"    # shared source material, repo root
PAGE_LIMIT="${PAGE_LIMIT:-__PAGE_LIMIT__}"    # 0 = no limit
