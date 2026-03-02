#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

fail() {
  echo "❌ $1" >&2
  exit 1
}

# Enforce Bun as the single package manager lockfile source of truth.
for lock in package-lock.json yarn.lock pnpm-lock.yaml; do
  if find . -name "$lock" -not -path "./node_modules/*" -not -path "./.git/*" | grep -q .; then
    fail "Found unsupported lockfile '$lock'. Use bun.lock only."
  fi
done

if ! find . -name bun.lock -not -path "./node_modules/*" -not -path "./.git/*" | grep -q .; then
  fail "No bun.lock found at repository root."
fi

invalid=()
while IFS= read -r file; do
  if [[ "$file" != "./bun.lock" ]]; then
    invalid+=("$file")
  fi
done < <(find . -name bun.lock -not -path "./node_modules/*" -not -path "./.git/*" | sort)

if [[ ${#invalid[@]} -gt 0 ]]; then
  printf '❌ Nested bun.lock files are not allowed:\n' >&2
  printf ' - %s\n' "${invalid[@]}" >&2
  printf 'Keep only ./bun.lock in this monorepo.\n' >&2
  exit 1
fi

echo "✅ Lockfile policy check passed"
