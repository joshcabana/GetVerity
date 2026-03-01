#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

found=0
targets=(src supabase)

if rg -n --hidden --glob '!**/*.md' --glob '!**/.env*' --glob '!**/docs/**' --glob '!**/dist/**' 'https://[a-z0-9]+\.supabase\.co' "${targets[@]}" 2>/dev/null; then
  echo "FAIL: hardcoded Supabase URL found outside allowed config files." >&2
  found=1
fi

if rg -n --hidden --glob '!**/*.md' --glob '!**/.env*' --glob '!**/docs/**' --glob '!**/dist/**' 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' "${targets[@]}" 2>/dev/null; then
  echo "FAIL: hardcoded JWT-like token found outside allowed config files." >&2
  found=1
fi

if [[ "$found" -ne 0 ]]; then
  exit 1
fi

echo "PASS: no hardcoded Supabase URLs or anon-key JWTs detected in source."
