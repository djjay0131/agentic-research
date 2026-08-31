#!/usr/bin/env bash
# Written by /research:establish. Single source of truth for layout paths,
# mirroring docs/research-delta.md. Every script sources this, so a repo that
# uses proposal/ instead of paper/ needs no script edits.
PAPER_DIR="${PAPER_DIR:-__PAPER_DIR__}"     # paper/ | proposal/ | writeup/
MAIN_TEX="${MAIN_TEX:-__MAIN_TEX__}"        # main.tex
BUILD_DIR="${BUILD_DIR:-build}"
FIGURES_DIR="${FIGURES_DIR:-figures}"
PAGE_LIMIT="${PAGE_LIMIT:-__PAGE_LIMIT__}"  # 0 = no limit
