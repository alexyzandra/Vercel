// Trial order, adaptive difficulty and scoring for one play session.
//
// NOTE: the level steps and pass/flag cut-offs below are reasoned defaults,
// not clinically validated numbers. They need a pilot with children of known
// colour vision before the result should be trusted.

import type { Axis } from './color';

export type TrialKind = 'practice' | 'control' | 'protan' | 'deutan';

export interface TrialSpec {
  kind: TrialKind;
  axis: Axis;
  /** Fraction of the axis's maximum contrast (1 = easiest). */
  level: number;
  levelIdx: number;
}

export interface TrialResult extends TrialSpec {
  hit: boolean;
  taps: number;
  ms: number;
}

/** Contrast steps, strongest first. A find moves one step fainter, a miss one step stronger. */
export const LEVELS = [1, 0.6, 0.35, 0.2, 0.12];
const CONTROL_LEVEL = 0.5;

// Two obvious practice plates, then red-green plates interleaved with
// blue-yellow "control" plates that a red-green colour-blind child can still see.
export const ORDER: TrialKind[] = [
  'practice', 'practice',
  'protan', 'deutan', 'control',
  'protan', 'deutan', 'control',
  'protan', 'deutan', 'control',
  'protan', 'deutan', 'control',
  'protan', 'deutan',
];

export function specFor(index: number, results: TrialResult[]): TrialSpec {
  const kind = ORDER[index];
  if (kind === 'practice') return { kind, axis: 'tritan', level: 1, levelIdx: 0 };
  if (kind === 'control') return { kind, axis: 'tritan', level: CONTROL_LEVEL, levelIdx: 0 };
  const last = results.filter((r) => r.kind === kind).pop();
  const idx = last
    ? Math.min(LEVELS.length - 1, Math.max(0, last.levelIdx + (last.hit ? 1 : -1)))
    : 0;
  return { kind, axis: kind, level: LEVELS[idx], levelIdx: idx };
}

export type AxisVerdict = 'clear' | 'flag' | 'unsure';
export type Verdict = 'clear' | 'check' | 'unsure' | 'inconclusive';

export interface AxisSummary {
  verdict: AxisVerdict;
  found: number;
  total: number;
  /** 1-based index of the faintest level found, 0 if none. */
  faintestFound: number;
}

export interface Summary {
  verdict: Verdict;
  protan: AxisSummary;
  deutan: AxisSummary;
  controlFound: number;
  controlTotal: number;
  practiceFound: number;
}

function summarizeAxis(results: TrialResult[], kind: 'protan' | 'deutan'): AxisSummary {
  const rs = results.filter((r) => r.kind === kind);
  const hits = rs.filter((r) => r.hit);
  const faintestIdx = hits.reduce((m, r) => Math.max(m, r.levelIdx), -1);
  const strongMisses = rs.filter((r) => !r.hit && r.levelIdx <= 1).length;
  let verdict: AxisVerdict = 'unsure';
  if (faintestIdx >= 2 && strongMisses <= 1) verdict = 'clear';
  else if (strongMisses >= 2 && faintestIdx < 2) verdict = 'flag';
  return { verdict, found: hits.length, total: rs.length, faintestFound: faintestIdx + 1 };
}

export function summarize(results: TrialResult[]): Summary {
  const protan = summarizeAxis(results, 'protan');
  const deutan = summarizeAxis(results, 'deutan');
  const control = results.filter((r) => r.kind === 'control');
  const controlFound = control.filter((r) => r.hit).length;
  const practiceFound = results.filter((r) => r.kind === 'practice' && r.hit).length;

  let verdict: Verdict;
  // If the child missed plates everyone can see, they weren't playing the
  // game as intended (too young, bored, distracted) and misses mean nothing.
  if (practiceFound === 0 || controlFound < Math.ceil(control.length * 0.75)) verdict = 'inconclusive';
  else if (protan.verdict === 'flag' || deutan.verdict === 'flag') verdict = 'check';
  else if (protan.verdict === 'clear' && deutan.verdict === 'clear') verdict = 'clear';
  else verdict = 'unsure';

  return { verdict, protan, deutan, controlFound, controlTotal: control.length, practiceFound };
}
