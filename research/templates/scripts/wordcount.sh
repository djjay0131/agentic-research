#!/usr/bin/env bash
# Word count per section against the budget declared in each section's header.
# Put "% WORD BUDGET: 450" at the top of each sections/*.tex file so the person
# writing the section sees the constraint where the work happens.
#
# Comments are stripped before counting, because the budget headers are
# themselves comments.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
. "$ROOT/scripts/_paths.sh"
cd "$ROOT"

SECS="$PAPER_DIR/sections"
if ! compgen -G "$SECS/*.tex" >/dev/null; then
  echo "No $SECS/*.tex found. Single-file paper? Counting $PAPER_DIR/$MAIN_TEX:"
  sed 's/%.*//' "$PAPER_DIR/$MAIN_TEX" | wc -w
  exit 0
fi

printf '%-30s %8s %8s %8s\n' SECTION WORDS BUDGET DELTA
printf '%-30s %8s %8s %8s\n' ------------------------------ -------- -------- --------
TOTAL=0; TOTAL_B=0
for f in "$SECS"/*.tex; do
  W=$(sed 's/%.*//' "$f" | wc -w | tr -d ' ')
  B=$(grep -o 'WORD BUDGET: *[0-9]*' "$f" | head -1 | grep -o '[0-9]*' || true)
  B=${B:-0}
  TOTAL=$((TOTAL + W)); TOTAL_B=$((TOTAL_B + B))
  D=$((W - B)); FLAG=""; [ "$B" -gt 0 ] && [ "$D" -gt 0 ] && FLAG=" OVER"
  printf '%-30s %8d %8d %+8d%s\n' "$(basename "$f")" "$W" "$B" "$D" "$FLAG"
done
printf '%-30s %8s %8s %8s\n' ------------------------------ -------- -------- --------
printf '%-30s %8d %8d %+8d\n' TOTAL "$TOTAL" "$TOTAL_B" "$((TOTAL - TOTAL_B))"
echo
echo "The page count from ./scripts/build.sh is authoritative; this is the"
echo "early-warning signal. Rough guide: one two-column page of body text is"
echo "~700-800 words once the title block and references are paid for."
