from __future__ import annotations

import json
from pathlib import Path

try:
    from PIL import Image
except ImportError as exc:
    raise SystemExit(f"Pillow is required: {exc}")


ASSET_DIR = Path(__file__).parent / "assets"
OUTPUT_DIR = ASSET_DIR / "optimized"
TARGET_WIDTHS = (640, 960, 1440)
QUALITY = 82


def build_variants(image_path: Path) -> dict:
    with Image.open(image_path) as image:
        width, height = image.size
        image = image.convert("RGB")
        relative_stem = image_path.relative_to(ASSET_DIR).with_suffix("")
        output_stem = "-".join(relative_stem.parts)

        output_variants = []
        widths = sorted({candidate for candidate in TARGET_WIDTHS if candidate <= width - 80} | {width})

        for variant_width in widths:
          variant_height = round(height * (variant_width / width))
          resized = image.resize((variant_width, variant_height), Image.Resampling.LANCZOS)
          variant_name = f"{output_stem}-{variant_width}.webp"
          variant_path = OUTPUT_DIR / variant_name
          resized.save(variant_path, "WEBP", quality=QUALITY, method=6)
          output_variants.append(
              {
                  "file": variant_name,
                  "width": variant_width,
                  "height": variant_height,
              }
          )

    return {
        "source": image_path.relative_to(ASSET_DIR).as_posix(),
        "width": width,
        "height": height,
        "variants": output_variants,
    }


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    manifest = {}

    image_paths = sorted(
        image_path
        for pattern in ("*.png", "*.jpg", "*.jpeg")
        for image_path in ASSET_DIR.rglob(pattern)
        if OUTPUT_DIR not in image_path.parents
    )

    for image_path in image_paths:
        key = image_path.relative_to(ASSET_DIR).with_suffix("").as_posix()
        manifest[key] = build_variants(image_path)

    manifest_path = OUTPUT_DIR / "image-manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(manifest_path)


if __name__ == "__main__":
    main()
