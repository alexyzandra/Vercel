'use client';

import { useEffect, useRef, useState } from 'react';
import { dotColor, LUM_NOISE } from '@/lib/hidey/color';
import type { TrialSpec } from '@/lib/hidey/session';
import { playSound } from '@/lib/hidey/sound';

interface Dot {
  x: number;
  y: number;
  r: number;
  brightness: number;
  inTarget: boolean;
}

interface Layout {
  dots: Dot[];
  target: { x: number; y: number; r: number };
}

const MAX_TAPS = 2; // one "oops" allowed; toddlers brush the screen
const TIMEOUT_MS = 12000;
const IGNORE_FIRST_MS = 400; // ignore a finger still down from the last plate
const REVEAL_MS = 1600;

function buildLayout(w: number, h: number): Layout {
  const short = Math.min(w, h);
  const tr = short * 0.17;
  const target = {
    x: tr + 10 + Math.random() * Math.max(1, w - 2 * (tr + 10)),
    y: tr + 10 + Math.random() * Math.max(1, h - 2 * (tr + 10)),
    r: tr,
  };

  // Pack non-overlapping dots, big ones first, using a grid for neighbour lookups.
  const base = short / 42;
  const maxR = base * 1.35;
  const cell = maxR * 2 + 2;
  const cols = Math.ceil(w / cell);
  const grid = new Map<number, Dot[]>();
  const dots: Dot[] = [];
  const attempts = Math.round(((w * h) / (base * base)) * 2.2);
  for (let i = 0; i < attempts; i++) {
    const r = base * (1.35 - 0.9 * (i / attempts));
    const x = r + Math.random() * (w - 2 * r);
    const y = r + Math.random() * (h - 2 * r);
    const cx = Math.floor(x / cell);
    const cy = Math.floor(y / cell);
    let clash = false;
    for (let gx = cx - 1; gx <= cx + 1 && !clash; gx++) {
      for (let gy = cy - 1; gy <= cy + 1 && !clash; gy++) {
        for (const d of grid.get(gy * cols + gx) ?? []) {
          if (Math.hypot(d.x - x, d.y - y) < d.r + r + 1.2) {
            clash = true;
            break;
          }
        }
      }
    }
    if (clash) continue;
    const dot: Dot = {
      x,
      y,
      r,
      brightness: LUM_NOISE[0] + Math.random() * (LUM_NOISE[1] - LUM_NOISE[0]),
      inTarget: Math.hypot(x - target.x, y - target.y) < target.r,
    };
    dots.push(dot);
    const key = cy * cols + cx;
    const bucket = grid.get(key);
    if (bucket) bucket.push(dot);
    else grid.set(key, [dot]);
  }
  return { dots, target };
}

function draw(canvas: HTMLCanvasElement, layout: Layout, trial: TrialSpec, reveal: boolean) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = canvas.width / canvas.clientWidth;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#f6f3ec';
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  for (const d of layout.dots) {
    if (d.inTarget && reveal) {
      ctx.fillStyle = '#ffb400';
    } else {
      // Practice plates also darken the patch so every child can see it.
      const brightness = d.inTarget && trial.kind === 'practice' ? d.brightness * 0.45 : d.brightness;
      ctx.fillStyle = dotColor(trial.axis, d.inTarget ? trial.level : -trial.level, brightness);
    }
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

interface Props {
  trial: TrialSpec;
  critter: string;
  onResult: (r: { hit: boolean; taps: number; ms: number }) => void;
}

/** One dot plate with a critter hiding in it. Remount (via `key`) for each trial. */
export default function Plate({ trial, critter, onResult }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutRef = useRef<Layout | null>(null);
  const startRef = useRef(0);
  const tapsRef = useRef(0);
  const doneRef = useRef(false);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const [revealed, setRevealed] = useState<{ x: number; y: number; hit: boolean } | null>(null);
  const [wobble, setWobble] = useState(false);

  function finish(hit: boolean) {
    const canvas = canvasRef.current;
    const layout = layoutRef.current;
    if (doneRef.current || !canvas || !layout) return;
    doneRef.current = true;
    const ms = performance.now() - startRef.current;
    draw(canvas, layout, trial, true);
    setRevealed({ x: layout.target.x, y: layout.target.y, hit });
    playSound(hit ? 'found' : 'peek');
    setTimeout(() => onResultRef.current({ hit, taps: tapsRef.current, ms }), REVEAL_MS);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const layout = buildLayout(w, h);
    layoutRef.current = layout;
    draw(canvas, layout, trial, false);
    startRef.current = performance.now();
    if (new URLSearchParams(location.search).has('debug')) {
      const box = canvas.getBoundingClientRect();
      (window as unknown as { __hideyTarget?: unknown }).__hideyTarget = {
        x: box.left + layout.target.x,
        y: box.top + layout.target.y,
        kind: trial.kind,
        level: trial.level,
      };
    }
    const timer = setTimeout(() => finish(false), TIMEOUT_MS);
    return () => clearTimeout(timer);
    // The plate is remounted per trial, so this runs exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const layout = layoutRef.current;
    if (doneRef.current || !layout) return;
    if (performance.now() - startRef.current < IGNORE_FIRST_MS) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    tapsRef.current += 1;
    // Generous hit area: small fingers are imprecise.
    if (Math.hypot(x - layout.target.x, y - layout.target.y) < layout.target.r * 1.2) {
      finish(true);
    } else if (tapsRef.current >= MAX_TAPS) {
      finish(false);
    } else {
      playSound('boop');
      setWobble(true);
      setTimeout(() => setWobble(false), 350);
    }
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${wobble ? 'hidey-wobble' : ''}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        className="block h-full w-full"
        style={{ touchAction: 'none' }}
        aria-label="Dotty picture with a hidden friend. Tap where the friend is hiding."
      />
      {revealed && (
        <div
          className="hidey-pop pointer-events-none absolute text-center"
          style={{ left: revealed.x, top: revealed.y }}
        >
          <div style={{ fontSize: 'min(26vmin, 140px)', lineHeight: 1 }}>{critter}</div>
          {revealed.hit && <div className="hidey-stars text-4xl">⭐✨⭐</div>}
        </div>
      )}
    </div>
  );
}
