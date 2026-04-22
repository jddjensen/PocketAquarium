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

from __future__ import annotations

import argparse
import json
import struct
import sys
from pathlib import Path
from typing import NamedTuple


REPO_ROOT = Path(__file__).resolve().parents[1]
ASSETS_DIR = REPO_ROOT / "PocketAquarium.Godot" / "assets"
MANIFEST_PATH = ASSETS_DIR / "manifest.json"

EXPECTED_DIMS: dict[str, tuple[int, int]] = {
    "tile-grass": (32, 32),
    "decor-tree": (48, 64),
    "decor-bench": (48, 32),
    "decor-flowerbed": (32, 32),
    "decor-fountain": (48, 56),
    "guest-down-0": (24, 24),
    "guest-down-1": (24, 24),
    "guest-up-0": (24, 24),
    "guest-up-1": (24, 24),
    "guest-left-0": (24, 24),
    "guest-left-1": (24, 24),
    "guest-right-0": (24, 24),
    "guest-right-1": (24, 24),
}

PNG_CHANNELS_BY_COLOR_TYPE = {
    0: 1,
    2: 3,
    3: 1,
    4: 2,
    6: 4,
}


class ValidationError(Exception):
    pass


class PngInfo(NamedTuple):
    width: int
    height: int
    channels: int


def read_png_info(path: Path) -> PngInfo:
    try:
        from PIL import Image  # type: ignore
    except ImportError:
        return read_png_info_stdlib(path)

    with Image.open(path) as image:
        channels = len(image.getbands())
        return PngInfo(image.width, image.height, channels)


def read_png_info_stdlib(path: Path) -> PngInfo:
    with path.open("rb") as fp:
        signature = fp.read(8)
        if signature != b"\x89PNG\r\n\x1a\n":
            raise ValidationError(f"{path} is not a PNG")

        length_bytes = fp.read(4)
        chunk_type = fp.read(4)
        if len(length_bytes) != 4 or chunk_type != b"IHDR":
            raise ValidationError(f"{path} has no PNG IHDR chunk")

        length = struct.unpack(">I", length_bytes)[0]
        if length != 13:
            raise ValidationError(f"{path} has invalid IHDR length {length}")

        data = fp.read(length)
        if len(data) != 13:
            raise ValidationError(f"{path} has truncated IHDR data")

        width, height, _bit_depth, color_type, _compression, _filter, _interlace = struct.unpack(
            ">IIBBBBB", data
        )
        channels = PNG_CHANNELS_BY_COLOR_TYPE.get(color_type)
        if channels is None:
            raise ValidationError(f"{path} has unsupported PNG color type {color_type}")

        return PngInfo(width, height, channels)


def load_manifest() -> dict[str, object]:
    with MANIFEST_PATH.open("r", encoding="utf-8") as fp:
        manifest = json.load(fp)
    if not isinstance(manifest, dict):
        raise ValidationError("manifest root must be an object")
    return manifest


def manifest_textures(manifest: dict[str, object]) -> dict[str, str]:
    textures = manifest.get("textures")
    if not isinstance(textures, dict):
        raise ValidationError("manifest.textures must be an object")

    result: dict[str, str] = {}
    for key, rel_path in textures.items():
        if not isinstance(key, str) or not isinstance(rel_path, str):
            raise ValidationError("manifest texture keys and paths must be strings")
        result[key] = rel_path
    return result


def resolve_asset_path(rel_path: str) -> Path:
    path = (ASSETS_DIR / rel_path).resolve()
    assets_root = ASSETS_DIR.resolve()
    if assets_root not in path.parents and path != assets_root:
        raise ValidationError(f"asset path escapes assets directory: {rel_path}")
    return path


def validate(check_dims: bool) -> tuple[int, int]:
    textures = manifest_textures(load_manifest())
    validated = 0
    skipped = 0

    for key, rel_path in textures.items():
        path = resolve_asset_path(rel_path)
        if not path.exists():
            raise ValidationError(f"{key} references missing file {rel_path}")
        if not path.is_file():
            raise ValidationError(f"{key} references non-file path {rel_path}")

        if check_dims and key in EXPECTED_DIMS:
            info = read_png_info(path)
            expected_width, expected_height = EXPECTED_DIMS[key]
            if (info.width, info.height) != (expected_width, expected_height):
                raise ValidationError(
                    f"{key} expected {expected_width}x{expected_height}, got {info.width}x{info.height}"
                )
            if info.channels != 4:
                raise ValidationError(f"{key} expected 4 channels, got {info.channels}")
        elif check_dims:
            skipped += 1

        validated += 1

    return validated, skipped


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate PocketAquarium asset manifest.")
    parser.add_argument("--check-dims", action="store_true", help="enforce built-in PNG dimension table")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        validated, skipped = validate(args.check_dims)
    except ValidationError as exc:
        print(f"FAIL: {exc}")
        return 1
    except Exception as exc:
        print(f"FAIL: unexpected error: {exc}")
        return 2

    print(f"OK: {validated} validated, {skipped} skipped (no dims table entry)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
