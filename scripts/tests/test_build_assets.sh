#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
PYTHON_BIN="${PYTHON:-python3}"

"$PYTHON_BIN" build_assets.py

TMP=$(mktemp -d)
cp ../PocketAquarium.Godot/assets/manifest.json "$TMP/backup.json"
restore() {
    mv "$TMP/backup.json" ../PocketAquarium.Godot/assets/manifest.json
    rmdir "$TMP"
}
trap restore EXIT

echo '{"textures":{"missing":"sprites/does-not-exist.png"},"sheets":{}}' > ../PocketAquarium.Godot/assets/manifest.json
if "$PYTHON_BIN" build_assets.py; then
    echo "expected failure"
    exit 1
fi

trap - EXIT
restore
echo "OK"
