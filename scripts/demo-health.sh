#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-http://localhost:3000}"

ROUTES=(
  /developer
  /developer/proof
  /buyer/prescan
  /buyer/dsr-check
  /buyer/journey
  /agent
  /agent/case/DEMO-001
)

for p in "${ROUTES[@]}"; do
  echo "== $p =="
  curl -sI "$BASE$p" | head -n 5
  echo
done

