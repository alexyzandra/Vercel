'use client';

import { useEffect, useState } from 'react';
import {
  detectDevice,
  getNativeReport,
  FAMILY_LABEL,
  MANUAL_STEPS,
  runAutoChecks,
  type AutoCheck,
  type DeviceFamily,
  type DeviceInfo,
  type NativeScreenReport,
} from '@/lib/hidey/device';

export interface ScreenCheckResult {
  /** Every manual step ticked and no automatic warning. */
  complete: boolean;
  deviceLabel: string;
}

const FAMILIES: DeviceFamily[] = ['iphone', 'ipad', 'samsung', 'pixel', 'android', 'desktop'];

export default function DeviceCheck({ onDone }: { onDone: (r: ScreenCheckResult) => void }) {
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [auto, setAuto] = useState<AutoCheck[]>([]);
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [picking, setPicking] = useState(false);
  // Only set inside the desktop app, which can read the real display settings.
  const [native, setNative] = useState<NativeScreenReport | null>(null);
  const [checking, setChecking] = useState(false);

  async function refresh() {
    setChecking(true);
    const report = await getNativeReport();
    setNative(report);
    setAuto([...(report?.checks ?? []), ...runAutoChecks()]);
    setChecking(false);
  }

  useEffect(() => {
    void refresh();
    void detectDevice().then(setDevice);
  }, []);

  if (!device) return <div className="p-8 text-center text-slate-500">Checking this screen…</div>;

  const steps = [
    ...MANUAL_STEPS[device.family].filter((s) => !native?.covered.includes(s.id)),
    ...(native?.extraSteps ?? []),
    { id: 'grey', title: 'The card below looks plain grey', where: 'If it looks yellow, orange or pink, a warm or tinted screen mode is still on.' },
  ];
  const warnings = auto.filter((c) => !c.ok);
  const allTicked = steps.every((s) => ticked[s.id]);
  const deviceLabel = native ? native.deviceLabel : device.model ? `${FAMILY_LABEL[device.family]} (${device.model})` : FAMILY_LABEL[device.family];
  const finish = (complete: boolean) => onDone({ complete, deviceLabel });

  return (
    <div className="mx-auto flex h-full max-w-xl flex-col gap-4 overflow-y-auto px-4 py-6 text-slate-800">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">For the grown-up · step 1 of 2</p>
        <h1 className="mt-1 text-2xl font-bold">Get the screen ready</h1>
        <p className="mt-1 text-sm text-slate-600">
          Tinted, dim or colour-boosted screens can hide or reveal the dots and give a wrong answer.
        </p>
      </header>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">This looks like</p>
            <p className="font-semibold">{deviceLabel}</p>
          </div>
          {!native && (
            <button
              type="button"
              onClick={() => setPicking((p) => !p)}
              className="rounded-full border border-slate-300 px-3 py-2 text-sm font-medium"
            >
              {picking ? 'Close' : 'Not right?'}
            </button>
          )}
        </div>
        {picking && (
          <div className="mt-3 flex flex-wrap gap-2">
            {FAMILIES.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setDevice({ family: f, model: null });
                  setTicked({});
                  setPicking(false);
                }}
                className={`rounded-full px-3 py-2 text-sm font-medium ${
                  f === device.family ? 'bg-emerald-600 text-white' : 'bg-slate-100'
                }`}
              >
                {FAMILY_LABEL[f]}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Checked automatically</h2>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={checking}
            className="rounded-full border border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {checking ? 'Checking…' : 'Check again'}
          </button>
        </div>
        <ul className="mt-2 space-y-2 text-sm">
          {auto.map((c) => (
            <li key={c.id} className="flex gap-2">
              <span aria-hidden className={c.ok ? 'text-emerald-600' : 'text-amber-600'}>{c.ok ? '✓' : '⚠'}</span>
              <span>
                <span className={c.ok ? '' : 'font-semibold'}>{c.label}</span>
                {c.detail && <span className="block text-slate-600">{c.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Please check these yourself</h2>
        <p className="text-sm text-slate-600">{native ? 'The app can’t read these' : 'A web page can’t read these settings'}, so tick each one once you’ve looked.</p>
        <ul className="mt-3 space-y-3">
          {steps.map((s) => (
            <li key={s.id}>
              <label className="flex cursor-pointer gap-3">
                <input
                  type="checkbox"
                  checked={!!ticked[s.id]}
                  onChange={(e) => setTicked((t) => ({ ...t, [s.id]: e.target.checked }))}
                  className="mt-1 h-6 w-6 shrink-0 accent-emerald-600"
                />
                <span>
                  <span className="font-medium">{s.title}</span>
                  <span className="block text-sm text-slate-600">{s.where}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-3 h-16 rounded-xl border border-slate-200" style={{ backgroundColor: 'rgb(128,128,128)' }} aria-label="Grey reference card" />
      </section>

      <div className="flex flex-col gap-2 pb-4">
        <button
          type="button"
          disabled={!allTicked || warnings.length > 0}
          onClick={() => finish(true)}
          className="rounded-full bg-emerald-600 px-6 py-4 text-lg font-bold text-white disabled:bg-slate-300"
        >
          Screen is ready
        </button>
        <button type="button" onClick={() => finish(false)} className="py-2 text-sm text-slate-600 underline">
          Skip the check (the result will be marked less reliable)
        </button>
      </div>
    </div>
  );
}
