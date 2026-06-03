#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/exercicios_python/analise_pedidos_guiado.py"

if [[ ! -f "$SRC" ]]; then
  echo "sync-exercise-public: arquivo não encontrado: $SRC" >&2
  exit 1
fi

fix_and_copy() {
  local dest_dir="$1"
  local dest="$dest_dir/analise_pedidos_guiado.py"
  mkdir -p "$dest_dir"
  sed 's/\\"/"/g' "$SRC" > "$dest"
  echo "sync-exercise-public: $dest"
}

fix_and_copy "$ROOT/public/exercise_python"
fix_and_copy "$ROOT/public/exercicios_python"
