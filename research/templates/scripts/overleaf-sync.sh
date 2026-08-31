#!/usr/bin/env bash
# Overleaf git-bridge helper. Prefer Overleaf's native GitHub sync when the
# account has it; use this when it does not.
#
#   ./scripts/overleaf-sync.sh init <PROJECT_ID>
#   ./scripts/overleaf-sync.sh push
#   ./scripts/overleaf-sync.sh pull
#   ./scripts/overleaf-sync.sh status
#
# Auth: username = your Overleaf email, password = a Git integration token
# (Overleaf -> Account Settings -> Git integration -> Generate token).
set -euo pipefail
cd "$(cd "$(dirname "$0")/.." && pwd)"

cmd="${1:-help}"
case "$cmd" in
  init)
    pid="${2:?usage: overleaf-sync.sh init <PROJECT_ID>}"
    if git remote get-url overleaf >/dev/null 2>&1; then
      git remote set-url overleaf "https://git.overleaf.com/$pid"
    else
      git remote add overleaf "https://git.overleaf.com/$pid"
    fi
    echo "Remote 'overleaf' -> https://git.overleaf.com/$pid"
    git config credential.https://git.overleaf.com.helper "${GIT_CREDENTIAL_HELPER:-cache --timeout=86400}"
    echo "Now run: ./scripts/overleaf-sync.sh pull   (Overleaf projects start with a stub main.tex)"
    ;;
  push)
    git remote get-url overleaf >/dev/null 2>&1 || { echo "No 'overleaf' remote. Run: $0 init <PROJECT_ID>" >&2; exit 1; }
    [ -z "$(git status --porcelain)" ] || { echo "Working tree is dirty. Commit first." >&2; exit 1; }
    git push overleaf HEAD:master
    ;;
  pull)
    git remote get-url overleaf >/dev/null 2>&1 || { echo "No 'overleaf' remote. Run: $0 init <PROJECT_ID>" >&2; exit 1; }
    git fetch overleaf
    git merge --no-edit --allow-unrelated-histories overleaf/master
    ;;
  status)
    git remote -v | grep overleaf || echo "no overleaf remote configured"
    git fetch overleaf >/dev/null 2>&1 || true
    echo "--- commits on Overleaf not local ---"; git log --oneline HEAD..overleaf/master 2>/dev/null || true
    echo "--- commits local not on Overleaf ---"; git log --oneline overleaf/master..HEAD 2>/dev/null || true
    ;;
  *) sed -n '2,14p' "$0" ;;
esac
