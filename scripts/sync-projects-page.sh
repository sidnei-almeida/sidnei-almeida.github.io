#!/usr/bin/env bash
# Regenerates projects/index.html from includes/projects-section.html (full archive).
# The homepage uses a curated "Featured Projects" subset — do NOT extract the grid from index.html.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
python3 "$ROOT/scripts/assemble-projects-page.py"
