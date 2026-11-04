#!/usr/bin/env python3
"""
Splits the two fonts the first screen needs (the body face and the heading face) into a
small "core" file with the characters the site's text actually uses, and a "rest" file with
the remainder of Fontsource's latin subset. integrations/local-fonts.ts serves them as two
@font-face rules with unicode-ranges, so a page downloads the rest only if it uses one of
those characters. Every glyph, kerning pair and the weight axis are kept.

Run it after a Fontsource upgrade (or when the copy starts using a character outside CORE):
    python3 -m pip install fonttools brotli
    python3 scripts/subset-fonts.py
"""
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src/assets/fonts"

# Keep in step with CORE in integrations/local-fonts.ts.
CORE = [(0x20, 0x7E), (0xA0, 0xA0), (0xA9, 0xA9), (0xB7, 0xB7), (0x2013, 0x2014), (0x2018, 0x2019),
        (0x201C, 0x201D), (0x2026, 0x2026), (0x20AC, 0x20AC)]

FONTS = {
    "schibsted-grotesk": "node_modules/@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2",
    "instrument-serif": "node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2",
}


def codepoints(ranges):
    return {c for a, b in ranges for c in range(a, b + 1)}


def write(src: Path, keep: set[int], dest: Path) -> None:
    font = TTFont(src)
    options = subset.Options()
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    options.flavor = "woff2"
    sub = subset.Subsetter(options)
    sub.populate(unicodes=keep)
    sub.subset(font)
    font.flavor = "woff2"
    font.save(dest)
    print(f"{dest.relative_to(ROOT)}: {dest.stat().st_size} bytes")


for name, rel in FONTS.items():
    src = ROOT / rel
    have = set(TTFont(src).getBestCmap())
    core = codepoints(CORE) & have
    write(src, core, OUT / f"{name}-core.woff2")
    write(src, have - core, OUT / f"{name}-rest.woff2")
