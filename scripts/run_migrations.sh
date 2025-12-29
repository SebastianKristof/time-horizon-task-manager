#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

load_env_file() {
  local env_file="$1"
  if [ -f "$env_file" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
  fi
}

load_env_file "$ROOT_DIR/.env"
load_env_file "$ROOT_DIR/.env.local"

DB_URL="${SUPABASE_DB_URL:-${DATABASE_URL:-}}"

if [ -z "$DB_URL" ]; then
  echo "Missing DB URL. Set SUPABASE_DB_URL or DATABASE_URL." >&2
  exit 1
fi

MIGRATIONS=(
  "scripts/001_create_tables.sql"
  "scripts/002_add_snapshot_rls_public.sql"
  "scripts/003_add_task_ordering_and_subtasks.sql"
)

for migration in "${MIGRATIONS[@]}"; do
  path="$ROOT_DIR/$migration"
  if [ ! -f "$path" ]; then
    echo "Migration not found: $path" >&2
    exit 1
  fi
  echo "Running $migration"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$path"
done
