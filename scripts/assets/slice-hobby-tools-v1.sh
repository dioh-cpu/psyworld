#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 || ! -f "$1" ]]; then
  echo "usage: $0 <transparent-2x8-tool-atlas.png>" >&2
  exit 2
fi

root="$(cd "$(dirname "$0")/../.." && pwd)"
out="$root/assets/hobbies/tools"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$out"
cp "$1" "$out/psyworld-hobby-tools-atlas-v1.png"
magick "$1" -crop 2x8@ +repage "$tmp/cell-%02d.png"
materials=(copper iron silver gold coal ruby sapphire jade)

for row in "${!materials[@]}"; do
  for col in 0 1; do
    cell=$((row * 2 + col))
    if [[ $col -eq 0 ]]; then kind=pickaxe; else kind=axe; fi
    index=$(printf '%02d' "$cell")
    # The generated atlas contains faint alpha noise in empty pixels. Make the
    # pixel-art silhouette crisp before trimming so invisible haze cannot move
    # the sprite inside its 64x64 frame.
    magick "$tmp/cell-$index.png" -channel A -threshold 50% +channel -trim +repage -filter point -resize 58x58 \
      -background none -gravity center -extent 64x64 \
      "$out/$kind-${materials[$row]}.png"
  done
done

cat > "$out/manifest.json" <<'JSON'
{
  "schema": "psyworld.hobby-tools.v1",
  "source": "psyworld-hobby-tools-atlas-v1.png",
  "sourceNote": "New PSYWORLD pixel-art tools authored because the requested 2026-09-16 pack was unavailable in the project, Git refs, local files, and connected Drive.",
  "cell": [64, 64],
  "materials": ["copper", "iron", "silver", "gold", "coal", "ruby", "sapphire", "jade"],
  "tools": ["pickaxe", "axe"],
  "atlasOrder": "8 material rows top-to-bottom; pickaxe left, axe right"
}
JSON
