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

        output_variants = []
        widths = sorted({candidate for candidate in TARGET_WIDTHS if candidate <= width - 80} | {width})

        for variant_width in widths:
          variant_height = round(height * (variant_width / width))
          resized = image.resize((variant_width, variant_height), Image.Resampling.LANCZOS)
          variant_name = f"{image_path.stem}-{variant_width}.webp"
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
        "source": image_path.name,
        "width": width,
        "height": height,
        "variants": output_variants,
    }


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    manifest = {}

    image_paths = sorted(
        [
            *ASSET_DIR.glob("*.png"),
            *ASSET_DIR.glob("*.jpg"),
            *ASSET_DIR.glob("*.jpeg"),
        ]
    )

    for image_path in image_paths:
        manifest[image_path.stem] = build_variants(image_path)

    manifest_path = OUTPUT_DIR / "image-manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(manifest_path)


if __name__ == "__main__":
    main()
