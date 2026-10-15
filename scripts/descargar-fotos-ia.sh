#!/usr/bin/env bash
# Descarga las fotos listadas en scripts/fotos-ia.txt y las guarda optimizadas
# (JPG progresivo + WebP) en public/assets/img/ia/. Requiere curl e ImageMagick.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=public/assets/img/ia
mkdir -p "$OUT"
tmp=$(mktemp -d)
ok=0
while read -r name url; do
  [[ -z "${name:-}" || "$name" == \#* ]] && continue
  if [[ -f "$OUT/$name.jpg" && -f "$OUT/$name.webp" ]]; then echo "✔ $name (ya existe)"; ok=$((ok+1)); continue; fi
  if curl -fsSL --retry 3 -o "$tmp/$name.png" "$url"; then
    convert "$tmp/$name.png" -resize '1920x>' -strip -interlace Plane -quality 84 "$OUT/$name.jpg"
    convert "$tmp/$name.png" -resize '1920x>' -strip -quality 80 "$OUT/$name.webp"
    echo "✔ $name descargada"; ok=$((ok+1))
  else
    echo "✘ $name: no se pudo descargar (¿URL caducada?)" >&2
  fi
done < scripts/fotos-ia.txt
rm -rf "$tmp"
echo "$ok foto(s) listas en $OUT"
