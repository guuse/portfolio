/**
 * OKLCH → sRGB, for the places that need a colour as hex or as luminance: the theme-color
 * meta and the web manifest (built from tokens), and the contrast tests.
 * Formulas from Björn Ottosson's OKLab reference, sRGB transfer per IEC 61966-2-1.
 */

const OKLCH = /^oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\)$/;

/** Linear sRGB (each channel clipped to 0..1), or null if `value` isn't an opaque oklch(). */
function oklchToLinearRgb(value) {
  const m = OKLCH.exec(String(value).trim());
  if (!m) return null;
  const L = +m[1] / 100,
    C = +m[2],
    h = (+m[3] * Math.PI) / 180;
  const a = C * Math.cos(h),
    b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clip = (v) => Math.min(1, Math.max(0, v));
  return [
    clip(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s),
    clip(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s),
    clip(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s),
  ];
}

/** WCAG relative luminance of an opaque oklch() colour. */
export function luminance(value) {
  const rgb = oklchToLinearRgb(value);
  if (!rgb) throw new Error(`not an opaque oklch colour: ${value}`);
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/** `#rrggbb`, or null if `value` isn't an opaque oklch(). */
export function oklchToHex(value) {
  const rgb = oklchToLinearRgb(value);
  if (!rgb) return null;
  const encode = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
  return (
    "#" +
    rgb
      .map((c) =>
        Math.round(encode(c) * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
