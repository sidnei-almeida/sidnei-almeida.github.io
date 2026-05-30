#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/public/assets/projects"
MAX_SIZE="960x960>"
QUALITY=82

if ! command -v magick >/dev/null 2>&1; then
  echo "ImageMagick (magick) is required." >&2
  exit 1
fi

shopt -s nullglob
pngs=("$DIR"/*.png)

if ((${#pngs[@]} == 0)); then
  echo "No PNG files found in $DIR"
  exit 0
fi

for png in "${pngs[@]}"; do
  webp="${png%.png}.webp"
  magick "$png" -resize "$MAX_SIZE" -strip -quality "$QUALITY" "$webp"
  echo "✓ $(basename "$png") → $(basename "$webp") ($(du -h "$webp" | cut -f1))"
done

echo "Done. Update src/data/projects.ts if filenames changed."
