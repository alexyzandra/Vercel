// Colour maths for the hidden-dot plates.
//
// Each plate hides a patch of dots that differs from its surroundings along a
// single cone axis (L, M or S). A child missing that cone type (or with a weak
// one) gets little or no signal from the patch, while random brightness noise
// on every dot hides any leftover luminance cue.

export type Axis = 'protan' | 'deutan' | 'tritan';

type Vec3 = [number, number, number];
type Mat3 = [Vec3, Vec3, Vec3];

// Linear sRGB -> LMS (Viénot, Brettel & Mollon 1999, Smith-Pokorny fundamentals).
const RGB2LMS: Mat3 = [
  [17.8824, 43.5161, 4.11935],
  [3.45565, 27.1554, 3.86714],
  [0.0299566, 0.184309, 1.46709],
];

function inv3(m: Mat3): Mat3 {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [
    [A / det, -(b * i - c * h) / det, (b * f - c * e) / det],
    [B / det, (a * i - c * g) / det, -(a * f - c * d) / det],
    [C / det, -(a * h - b * g) / det, (a * e - b * d) / det],
  ];
}

function mul(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

const LMS2RGB = inv3(RGB2LMS);
const GREY = 0.35; // linear-light mid grey the plates are built around
const GREY_LMS = mul(RGB2LMS, [GREY, GREY, GREY]);
const CONE_INDEX: Record<Axis, 0 | 1 | 2> = { protan: 0, deutan: 1, tritan: 2 };

/** Per-dot brightness multiplier range (luminance noise). */
export const LUM_NOISE: [number, number] = [0.72, 1.18];

/** Linear RGB for a dot whose chosen cone signal is shifted by `contrast`. */
function linearRgb(axis: Axis, contrast: number, brightness: number): Vec3 {
  const lms: Vec3 = [...GREY_LMS];
  lms[CONE_INDEX[axis]] *= 1 + contrast;
  const rgb = mul(LMS2RGB, lms);
  return [rgb[0] * brightness, rgb[1] * brightness, rgb[2] * brightness];
}

function inGamut(axis: Axis, contrast: number): boolean {
  return linearRgb(axis, contrast, LUM_NOISE[1]).every((v) => v >= 0 && v <= 1);
}

function maxContrast(axis: Axis): number {
  let c = 0;
  while (c < 2 && inGamut(axis, c + 0.002) && inGamut(axis, -(c + 0.002))) c += 0.002;
  return c * 0.85; // stay clear of the gamut edge, where phone screens are least accurate
}

/** Largest cone contrast (each side of grey) that every dot can display. */
export const MAX_CONTRAST: Record<Axis, number> = {
  protan: maxContrast('protan'),
  deutan: maxContrast('deutan'),
  tritan: maxContrast('tritan'),
};

function encode(v: number): number {
  const c = Math.min(1, Math.max(0, v));
  const s = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(s * 255);
}

/**
 * CSS colour for one dot.
 * @param signedLevel -1..1 fraction of the axis's max contrast (hidden patch
 *   dots are positive, surrounding dots negative)
 * @param brightness luminance-noise multiplier
 */
export function dotColor(axis: Axis, signedLevel: number, brightness: number): string {
  const [r, g, b] = linearRgb(axis, signedLevel * MAX_CONTRAST[axis], brightness);
  return `rgb(${encode(r)},${encode(g)},${encode(b)})`;
}
