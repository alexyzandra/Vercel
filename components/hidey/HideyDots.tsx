'use client';

import { useRef, useState } from 'react';
import DeviceCheck, { type ScreenCheckResult } from './DeviceCheck';
import Plate from './Plate';
import { ORDER, specFor, summarize, type AxisSummary, type TrialResult, type Verdict } from '@/lib/hidey/session';
import { playSound, say, unlockAudio } from '@/lib/hidey/sound';

type Screen = 'intro' | 'check' | 'ready' | 'play' | 'party' | 'results';

const CRITTERS = ['🐸', '🦊', '🐞', '🐥', '🐙', '🦋', '🐢', '🐝', '🦉', '🐰', '🐠', '🦔', '🐨', '🦄', '🐳', '🦕'];
const HOLD_MS = 1500;

const VERDICT_COPY: Record<Verdict, { emoji: string; title: string; body: string }> = {
  clear: {
    emoji: '🟢',
    title: 'No sign of red-green colour blindness',
    body: 'Your child found the faint red-green friends. This is a reassuring result, but it is a game, not an eye exam. Mild colour vision differences can slip through.',
  },
  check: {
    emoji: '🟠',
    title: 'Worth asking an eye doctor',
    body: 'Your child found the blue-yellow friends but missed red-green ones that most children can see. Play once more on another day. If the same thing happens, mention it to an optometrist or paediatrician, who can run a proper colour vision test.',
  },
  unsure: {
    emoji: '🟡',
    title: 'Not clear this time',
    body: 'The answers were mixed: some red-green friends were found and some were missed. Try again another day when your child is rested.',
  },
  inconclusive: {
    emoji: '⚪',
    title: 'We couldn’t tell',
    body: 'Your child missed friends that every child can see, so they probably weren’t playing the game the way it expects. That is very common under age 3. Try again in a few months, or sit with them for the first two friends and then let them tap on their own.',
  },
};

function AxisRow({ label, s }: { label: string; s: AxisSummary }) {
  const tag = s.verdict === 'clear' ? 'Looks fine' : s.verdict === 'flag' ? 'Missed' : 'Mixed';
  const tone = s.verdict === 'clear' ? 'bg-emerald-100 text-emerald-800' : s.verdict === 'flag' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700';
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <span>
        <span className="font-medium">{label}</span>
        <span className="block text-sm text-slate-600">
          Found {s.found} of {s.total}
          {s.faintestFound > 0 && ` · faintest found: level ${s.faintestFound} of 5`}
        </span>
      </span>
      <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${tone}`}>{tag}</span>
    </li>
  );
}

export default function HideyDots() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [check, setCheck] = useState<ScreenCheckResult | null>(null);
  const [results, setResults] = useState<TrialResult[]>([]);
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout>>();

  const index = results.length;

  function startPlay() {
    unlockAudio();
    setResults([]);
    setScreen('play');
    say('Friends are hiding in the dots! Tap to find them!');
  }

  function onTrialResult(r: { hit: boolean; taps: number; ms: number }) {
    const next = [...results, { ...specFor(index, results), ...r }];
    setResults(next);
    if (next.length >= ORDER.length) {
      setScreen('party');
      playSound('fanfare');
      say('You found all the friends! Hooray!');
    }
  }

  function holdStart() {
    setHolding(true);
    holdTimer.current = setTimeout(() => {
      setHolding(false);
      setScreen('results');
    }, HOLD_MS);
  }
  function holdEnd() {
    setHolding(false);
    clearTimeout(holdTimer.current);
  }

  return (
    <main className="hidey-root fixed inset-0 select-none overflow-hidden bg-[#fdf6e3] text-slate-800">
      {screen === 'intro' && (
        <div className="mx-auto flex h-full max-w-xl flex-col gap-4 overflow-y-auto px-5 py-8">
          <div className="text-center">
            <div className="hidey-bob text-7xl">🐸</div>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-emerald-700">Hidey Dots</h1>
            <p className="mt-1 text-lg text-slate-600">A hide-and-seek game that checks colour vision</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold">For the grown-up</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>For ages 2 to 5. It takes about 3 minutes and 16 friends.</li>
              <li>A friend hides in a picture made of dots. Your child taps where it is hiding.</li>
              <li>Help with the first two friends, then <strong>don’t point or hint</strong>. Every friend pops out in the end, so there are no wrong answers for your child to feel bad about.</li>
              <li>Hold the screen about 30–40 cm from your child’s face.</li>
              <li>This is a screening game, not a diagnosis. Nothing is saved or sent anywhere.</li>
            </ul>
          </div>
          <button type="button" onClick={() => setScreen('check')} className="rounded-full bg-emerald-600 px-6 py-4 text-lg font-bold text-white">
            Next: get the screen ready
          </button>
        </div>
      )}

      {screen === 'check' && (
        <DeviceCheck
          onDone={(r) => {
            setCheck(r);
            setScreen('ready');
          }}
        />
      )}

      {screen === 'ready' && (
        <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Step 2 of 2 · hand over to your child</p>
          <div className="hidey-bob text-8xl">🙈</div>
          <p className="text-2xl font-bold">Friends are hiding in the dots!</p>
          <button type="button" onClick={startPlay} className="hidey-pulse rounded-full bg-orange-500 px-12 py-6 text-3xl font-extrabold text-white shadow-lg">
            ▶ Play
          </button>
        </div>
      )}

      {screen === 'play' && index < ORDER.length && (
        <div className="flex h-full flex-col">
          <div className="flex h-14 shrink-0 items-center gap-1 overflow-hidden px-3" aria-label={`Friend ${index + 1} of ${ORDER.length}`}>
            {CRITTERS.map((c, i) => (
              <span key={i} className={`flex-1 text-center text-xl transition-all ${i < index ? '' : 'opacity-20 grayscale'}`}>
                {i < index ? c : '●'}
              </span>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            <Plate key={index} trial={specFor(index, results)} critter={CRITTERS[index]} onResult={onTrialResult} />
          </div>
        </div>
      )}

      {screen === 'party' && (
        <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
          <h1 className="text-4xl font-extrabold text-emerald-700">You found everyone! 🎉</h1>
          <div className="flex max-w-md flex-wrap justify-center gap-2 text-5xl">
            {CRITTERS.map((c, i) => (
              <span key={i} className="hidey-bob" style={{ animationDelay: `${i * 0.12}s` }}>{c}</span>
            ))}
          </div>
          <button
            type="button"
            onPointerDown={holdStart}
            onPointerUp={holdEnd}
            onPointerLeave={holdEnd}
            onPointerCancel={holdEnd}
            onContextMenu={(e) => e.preventDefault()}
            className="relative mt-6 overflow-hidden rounded-full border-2 border-slate-400 px-6 py-3 text-sm font-semibold text-slate-700"
            style={{ touchAction: 'none' }}
          >
            <span
              className="absolute inset-y-0 left-0 bg-emerald-200"
              style={{ width: holding ? '100%' : '0%', transition: holding ? `width ${HOLD_MS}ms linear` : 'none' }}
            />
            <span className="relative">Grown-ups: press and hold for the result</span>
          </button>
        </div>
      )}

      {screen === 'results' && (() => {
        const s = summarize(results);
        const copy = VERDICT_COPY[s.verdict];
        return (
          <div className="mx-auto flex h-full max-w-xl select-text flex-col gap-4 overflow-y-auto px-4 py-6">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="text-4xl">{copy.emoji}</div>
              <h1 className="mt-2 text-2xl font-bold">{copy.title}</h1>
              <p className="mt-2 text-slate-700">{copy.body}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="font-semibold">What we saw</h2>
              <ul className="mt-1 divide-y divide-slate-100">
                <AxisRow label="Red-type colours (protan)" s={s.protan} />
                <AxisRow label="Green-type colours (deutan)" s={s.deutan} />
                <li className="py-2">
                  <span className="font-medium">Attention check (blue-yellow)</span>
                  <span className="block text-sm text-slate-600">
                    Found {s.controlFound} of {s.controlTotal}, plus {s.practiceFound} of 2 practice friends
                  </span>
                </li>
              </ul>
            </div>
            <div className={`rounded-2xl p-4 text-sm ${check?.complete ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}>
              <strong>Screen check: {check?.complete ? 'done' : 'skipped'}</strong>
              {check && ` · ${check.deviceLabel}. `}
              {!check?.complete && 'Because the screen wasn’t checked, treat this result as less reliable.'}
            </div>
            <p className="text-xs text-slate-500">
              Hidey Dots is a screening game and has not been clinically validated. It cannot diagnose or rule out a colour vision
              difference. Rare blue-yellow differences are not tested. If you have any concern about your child’s sight, see an eye care professional.
            </p>
            <button type="button" onClick={() => setScreen('ready')} className="mb-4 rounded-full bg-emerald-600 px-6 py-4 text-lg font-bold text-white">
              Play again
            </button>
          </div>
        );
      })()}
    </main>
  );
}
