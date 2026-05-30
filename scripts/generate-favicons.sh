#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC="$ROOT/public"
SVG="$PUBLIC/favicon.svg"

if ! command -v magick >/dev/null 2>&1; then
  echo "ImageMagick (magick) is required to generate favicons." >&2
  exit 1
fi

magick -background none "$SVG" -resize 16x16 "$PUBLIC/favicon-16x16.png"
magick -background none "$SVG" -resize 32x32 "$PUBLIC/favicon-32x32.png"
magick -background none "$SVG" -resize 180x180 "$PUBLIC/favicon-180x180.png"
magick "$PUBLIC/favicon-16x16.png" "$PUBLIC/favicon-32x32.png" "$PUBLIC/favicon.ico"

echo "Favicons generated in public/"
