#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

paths=(
  "/developer"
  "/developer/proof"
  "/buyer/prescan"
  "/buyer/dsr-check"
  "/buyer/journey"
  "/agent"
  "/agent/case/DEMO-001"
)

echo "Demo Health Check @ ${BASE_URL}"
echo

for p in "${paths[@]}"; do
  echo "== ${p} =="
  # NOTE: Avoid `curl | head` because with `set -o pipefail`, curl may exit nonzero on SIGPIPE and stop the script.
  # Use sed to print first 6 lines safely.
  curl -sS -I "${BASE_URL}${p}" | sed -n '1,6p'
  echo
done
