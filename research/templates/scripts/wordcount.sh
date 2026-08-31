#!/usr/bin/env bash
# Word count per section against the budget in each section's header.
# Put "% WORD BUDGET: 450" at the top of each sections/*.tex file.
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/_paths.sh"
cd "$PAPER_ROOT"

if ! compgen -G "sections/*.tex" >/dev/null; then
  echo "No sections/*.tex found. Counting $MAIN_TEX:"
  sed 's/%.*//' "$MAIN_TEX" | wc -w
  exit 0
fi

printf '%-30s %8s %8s %8s\n' SECTION WORDS BUDGET DELTA
printf '%-30s %8s %8s %8s\n' ------------------------------ -------- -------- --------
TOTAL=0; TOTAL_B=0
for f in sections/*.tex; do
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
echo "The page count from build.sh is authoritative; this is the early-warning"
echo "signal. Rough guide: one two-column page is ~700-800 words of body text."
