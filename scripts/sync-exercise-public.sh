#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/exercicios_python/analise_pedidos_guiado.py"
DEST_DIR="$ROOT/public/exercicios_python"
DEST="$DEST_DIR/analise_pedidos_guiado.py"

if [[ ! -f "$SRC" ]]; then
  echo "sync-exercise-public: arquivo não encontrado: $SRC" >&2
  exit 1
fi

mkdir -p "$DEST_DIR"
# Corrige aspas escapadas se o fonte ainda tiver \"\"\"
sed 's/\\"/"/g' "$SRC" > "$DEST"
echo "sync-exercise-public: $DEST"
