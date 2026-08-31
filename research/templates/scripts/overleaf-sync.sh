#!/usr/bin/env bash
# Overleaf git-bridge helper. Operates on the REPO root, not the paper subtree,
# because Overleaf syncs a whole git repository.
#
#   ./paper/scripts/overleaf-sync.sh init <PROJECT_ID>
#   ./paper/scripts/overleaf-sync.sh push | pull | status
#
# Auth: username = your Overleaf email, password = a Git integration token
# (Overleaf -> Account Settings -> Git integration -> Generate token).
set -euo pipefail
. "$(dirname "${BASH_SOURCE[0]}")/_paths.sh"
cd "$REPO_ROOT"

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
    echo "Note: Overleaf expects main.tex at the repo root. With the paper in a"
    echo "subdirectory, set the project's main document in Overleaf's Menu ->"
    echo "Main document, or keep a thin root main.tex that \\input's the paper."
    echo "Now run: $0 pull"
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
  *) sed -n '2,12p' "$0" ;;
esac
