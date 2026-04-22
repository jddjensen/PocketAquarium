# Spec 09: Asset pipeline (Python)

## Goal

Validate `PocketAquarium.Godot/assets/manifest.json` against the PNGs that exist on disk. Fail loudly if a listed file is missing, the wrong size, or has a wrong channel count. Run this in CI before the Godot build so a broken manifest can't silently ship.

## Output

File: `scripts/build_assets.py`
Dependencies: stdlib only (use `struct` + `zlib` to read PNG IHDR chunks, or `Pillow` if the caller has it installed — detect and fall back).

```python
#!/usr/bin/env python3
"""
Validate PocketAquarium asset manifest against on-disk PNGs.

Usage:
    python scripts/build_assets.py              # validate
    python scripts/build_assets.py --check-dims # also enforce expected dims table

Exit codes:
    0  all good
    1  validation failure (missing file, mismatched dims, etc.)
    2  unexpected error (bad JSON, IO error)
"""
```

Expected dimensions per texture key (built-in table):

| key | dims |
| --- | --- |
| tile-grass | 32×32 |
| decor-tree | 48×64 |
| decor-bench | 48×32 |
| decor-flowerbed | 32×32 |
| decor-fountain | 48×56 |
| guest-down-0 / guest-down-1 / guest-up-0 / guest-up-1 / guest-left-0 / guest-left-1 / guest-right-0 / guest-right-1 | 24×24 |

Behavior:

- Parse `PocketAquarium.Godot/assets/manifest.json`.
- For every key in `textures`, verify the referenced file exists under `PocketAquarium.Godot/assets/`.
- With `--check-dims`, read each PNG's IHDR chunk (or use Pillow) and compare against the table above. Keys not in the table are validated only for existence.
- Print a summary: `OK: N validated, M skipped (no dims table entry)` or `FAIL: <reason>`.

## Tests

Shell tests via a small test harness. File: `scripts/tests/test_build_assets.sh`.

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Happy path
python build_assets.py

# Broken manifest → exit 1
TMP=$(mktemp -d)
cp ../PocketAquarium.Godot/assets/manifest.json "$TMP/backup.json"
echo '{"textures":{"missing":"sprites/does-not-exist.png"},"sheets":{}}' > ../PocketAquarium.Godot/assets/manifest.json
if python build_assets.py; then
    echo "expected failure"; mv "$TMP/backup.json" ../PocketAquarium.Godot/assets/manifest.json; exit 1
fi
mv "$TMP/backup.json" ../PocketAquarium.Godot/assets/manifest.json

echo "OK"
```
