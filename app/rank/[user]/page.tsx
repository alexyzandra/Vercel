'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { guppyStrains, GuppyStrain, Rarity } from '@/lib/guppies';
import WikiImage from '@/components/WikiImage';

// ── Helpers ──────────────────────────────────────────────────────────────────

const BATTLE_COUNT = 40;

function getRarityClass(rarity: Rarity) {
  const map: Record<Rarity, string> = {
    'Common': 'rarity-common',
    'Uncommon': 'rarity-uncommon',
    'Rare': 'rarity-rare',
    'Very Rare': 'rarity-very-rare',
    'Ultra Rare': 'rarity-ultra-rare',
  };
  return map[rarity];
}

function generateBattles(strains: GuppyStrain[], count: number): [GuppyStrain, GuppyStrain][] {
  const n = strains.length;
  const result: [GuppyStrain, GuppyStrain][] = [];

  // First ensure every strain appears at least once by pairing a shuffled list
  const shuffled = [...strains].sort(() => Math.random() - 0.5);
  for (let i = 0; i + 1 < n; i += 2) {
    result.push([shuffled[i], shuffled[i + 1]]);
  }
  // Odd one out gets an extra battle
  if (n % 2 !== 0) {
    const extra = shuffled[n - 1];
    const opp = strains[Math.floor(Math.random() * (n - 1))];
    result.push([extra, opp]);
  }

  // Fill remaining with random matchups
  while (result.length < count) {
    const idx1 = Math.floor(Math.random() * n);
    let idx2 = Math.floor(Math.random() * n);
    while (idx2 === idx1) idx2 = Math.floor(Math.random() * n);
    result.push([strains[idx1], strains[idx2]]);
  }

  return result.slice(0, count);
}

function computeRanking(
  strains: GuppyStrain[],
  wins: Record<string, number>,
  total: Record<string, number>,
): GuppyStrain[] {
  return [...strains].sort((a, b) => {
    const aw = wins[a.id] ?? 0;
    const bw = wins[b.id] ?? 0;
    if (bw !== aw) return bw - aw;
    const at = total[a.id] ?? 0;
    const bt = total[b.id] ?? 0;
    const ar = at > 0 ? aw / at : 0;
    const br = bt > 0 ? bw / bt : 0;
    return br - ar;
  });
}

// ── Battle Card ───────────────────────────────────────────────────────────────

function BattleCard({
  strain,
  state,
  onPick,
}: {
  strain: GuppyStrain;
  state: 'idle' | 'winner' | 'loser';
  onPick: () => void;
}) {
  return (
    <button
      onClick={onPick}
      disabled={state !== 'idle'}
      className="relative w-full overflow-hidden rounded-2xl focus:outline-none"
      style={{
        aspectRatio: '3/4',
        transition: 'transform 0.4s ease, box-shadow 0.4s ease, opacity 0.4s ease, filter 0.4s ease',
        transform: state === 'winner' ? 'scale(1.04)' : state === 'loser' ? 'scale(0.96)' : 'scale(1)',
        opacity: state === 'loser' ? 0.2 : 1,
        filter: state === 'loser' ? 'grayscale(100%)' : 'none',
        boxShadow: state === 'winner' ? '0 0 50px rgba(255,215,0,0.9), 0 0 100px rgba(255,215,0,0.4)' : 'none',
      }}
    >
      {/* Full photo */}
      <WikiImage
        query={strain.wikiSearch}
        alt={strain.name}
        gradientFrom={strain.gradientFrom}
        gradientTo={strain.gradientTo}
        className="absolute inset-0 w-full h-full"
      />

      {/* Gradient overlay for readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.35) 45%, transparent 100%)',
        }}
      />

      {/* Hover ripple (idle only) */}
      {state === 'idle' && (
        <div
          className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-200"
          style={{ background: 'rgba(0,212,255,0.12)' }}
        />
      )}

      {/* Strain info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
        <h3 className="text-white font-black text-xl md:text-2xl leading-tight drop-shadow-lg mb-2">
          {strain.name}
        </h3>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${getRarityClass(strain.rarity)}`}>
          {strain.rarity}
        </span>
      </div>

      {/* Winner crown */}
      {state === 'winner' && (
        <div className="absolute top-4 right-4 text-5xl drop-shadow-2xl" style={{ animation: 'float-up 0.5s ease-out' }}>
          👑
        </div>
      )}

      {/* "TAP TO PICK" hint */}
      {state === 'idle' && (
        <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-200">
          <span
            className="px-4 py-1.5 rounded-full text-sm font-bold"
            style={{ backgroundColor: 'rgba(0,212,255,0.8)', color: '#030d1a' }}
          >
            TAP TO PICK
          </span>
        </div>
      )}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Phase = 'start' | 'battle' | 'results';

export default function RankPage() {
  const params = useParams();
  const userParam = (params?.user as string) || 'person1';
  const userName = userParam === 'person1' ? 'Person 1' : 'Person 2';
  const accentColor = userParam === 'person1' ? '#00d4ff' : '#ffd700';
  const accentAlt = userParam === 'person1' ? '#0077bb' : '#ff8c00';
  const userEmoji = userParam === 'person1' ? '1️⃣' : '2️⃣';

  const [phase, setPhase] = useState<Phase>('start');
  const [battles, setBattles] = useState<[GuppyStrain, GuppyStrain][]>([]);
  const [battleIndex, setBattleIndex] = useState(0);
  const [wins, setWins] = useState<Record<string, number>>({});
  const [total, setTotal] = useState<Record<string, number>>({});
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [ranked, setRanked] = useState<GuppyStrain[]>([]);
  const [saved, setSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const startBattle = () => {
    const newBattles = generateBattles(guppyStrains, BATTLE_COUNT);
    setBattles(newBattles);
    setBattleIndex(0);
    setWins({});
    setTotal({});
    setPickedId(null);
    setSaved(false);
    setPhase('battle');
  };

  const pick = useCallback((winnerId: string, loserId: string) => {
    if (pickedId !== null) return;
    setPickedId(winnerId);

    const newWins = { ...wins, [winnerId]: (wins[winnerId] ?? 0) + 1 };
    const newTotal = {
      ...total,
      [winnerId]: (total[winnerId] ?? 0) + 1,
      [loserId]: (total[loserId] ?? 0) + 1,
    };
    setWins(newWins);
    setTotal(newTotal);

    setTimeout(() => {
      setPickedId(null);
      const nextIndex = battleIndex + 1;
      if (nextIndex >= BATTLE_COUNT) {
        setRanked(computeRanking(guppyStrains, newWins, newTotal));
        setPhase('results');
      } else {
        setBattleIndex(nextIndex);
      }
    }, 750);
  }, [pickedId, wins, total, battleIndex]);

  const skip = () => {
    if (pickedId !== null) return;
    const nextIndex = battleIndex + 1;
    if (nextIndex >= BATTLE_COUNT) {
      setRanked(computeRanking(guppyStrains, wins, total));
      setPhase('results');
    } else {
      setBattleIndex(nextIndex);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...ranked];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setRanked(next);
    setSaved(false);
  };

  const moveDown = (index: number) => {
    if (index === ranked.length - 1) return;
    const next = [...ranked];
    [next[index + 1], next[index]] = [next[index], next[index + 1]];
    setRanked(next);
    setSaved(false);
  };

  const save = () => {
    localStorage.setItem(`guppy_rankings_${userParam}`, JSON.stringify(ranked.map(s => s.id)));
    // legacy key cleanup
    localStorage.removeItem(`guppy_rankings_husband`);
    localStorage.removeItem(`guppy_rankings_wife`);
    setSaved(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  // ── START SCREEN ─────────────────────────────────────────────────────────────
  if (phase === 'start') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: '#030d1a' }}>
        <div className="max-w-sm w-full">
          <div className="text-8xl mb-6">{userEmoji}</div>
          <h1 className="text-5xl font-black mb-2" style={{ color: accentColor }}>
            {userName}&apos;s Turn
          </h1>
          <p className="text-xl font-bold mb-1" style={{ color: '#7dc8e0' }}>
            🐟 Guppy Battle Royale
          </p>
          <p className="text-sm mb-8" style={{ color: '#4a7090' }}>
            See {BATTLE_COUNT} head-to-head matchups.<br />
            Tap the guppy you think looks cooler!
          </p>

          <div
            className="rounded-2xl p-5 mb-8 text-left space-y-3"
            style={{ backgroundColor: '#0d1f3a', border: '1px solid rgba(0,212,255,0.15)' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🐟</span>
              <span className="font-medium" style={{ color: '#e0f4ff' }}>
                <b>{guppyStrains.length}</b> guppy strains to rank
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚔️</span>
              <span className="font-medium" style={{ color: '#e0f4ff' }}>
                <b>{BATTLE_COUNT}</b> head-to-head battles
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <span className="font-medium" style={{ color: '#e0f4ff' }}>
                About <b>2 minutes</b>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍺</span>
              <span className="font-medium" style={{ color: '#e0f4ff' }}>
                Best enjoyed with a cold beer
              </span>
            </div>
          </div>

          <button
            onClick={startBattle}
            className="w-full py-5 rounded-2xl text-2xl font-black transition-all duration-200 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentAlt})`,
              color: '#030d1a',
              boxShadow: `0 0 40px ${accentColor}55, 0 4px 20px rgba(0,0,0,0.4)`,
            }}
          >
            🐟 LET&apos;S BATTLE!
          </button>

          <Link href="/" className="block mt-6 text-sm" style={{ color: '#4a7090' }}>
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  // ── BATTLE SCREEN ─────────────────────────────────────────────────────────────
  if (phase === 'battle') {
    const [left, right] = battles[battleIndex];
    const progress = (battleIndex / BATTLE_COUNT) * 100;
    const leftState = pickedId === null ? 'idle' : pickedId === left.id ? 'winner' : 'loser';
    const rightState = pickedId === null ? 'idle' : pickedId === right.id ? 'winner' : 'loser';

    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#030d1a' }}>
        {/* Header */}
        <div
          className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: '#030d1a', borderBottom: '1px solid rgba(0,212,255,0.1)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{userEmoji}</span>
            <span className="font-bold text-sm" style={{ color: accentColor }}>{userName}</span>
          </div>
          <div className="text-center">
            <span className="text-xs font-black tracking-widest" style={{ color: '#7dc8e0' }}>
              BATTLE {battleIndex + 1} / {BATTLE_COUNT}
            </span>
          </div>
          <button
            onClick={skip}
            disabled={pickedId !== null}
            className="text-xs px-3 py-1.5 rounded-full transition-all disabled:opacity-30"
            style={{ color: '#4a7090', border: '1px solid rgba(74,112,144,0.3)' }}
          >
            Skip →
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5" style={{ backgroundColor: '#0d1f3a' }}>
          <div
            className="h-full"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${accentColor}, ${accentAlt})`,
              transition: 'width 0.5s ease',
            }}
          />
        </div>

        {/* Battle arena */}
        <div className="flex-1 flex flex-col md:flex-row items-stretch p-3 md:p-6 gap-3 md:gap-4">
          {/* Left / Top card */}
          <div className="flex-1">
            <BattleCard
              strain={left}
              state={leftState}
              onPick={() => pick(left.id, right.id)}
            />
          </div>

          {/* VS divider */}
          <div className="flex items-center justify-center">
            <div
              className="px-5 py-2 md:px-3 md:py-5 rounded-full font-black text-xl md:text-lg"
              style={{
                backgroundColor: '#0d1f3a',
                color: '#ffd700',
                border: '2px solid rgba(255,215,0,0.35)',
                boxShadow: '0 0 20px rgba(255,215,0,0.2)',
              }}
            >
              VS
            </div>
          </div>

          {/* Right / Bottom card */}
          <div className="flex-1">
            <BattleCard
              strain={right}
              state={rightState}
              onPick={() => pick(right.id, left.id)}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS SCREEN ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#030d1a' }}>
      {/* Toast */}
      {showToast && (
        <div
          className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl font-bold text-sm shadow-2xl"
          style={{ backgroundColor: '#22c55e', color: 'white' }}
        >
          ✓ Rankings saved! Pass the phone!
        </div>
      )}

      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-4"
        style={{ backgroundColor: '#030d1a', borderBottom: `1px solid ${accentColor}22` }}
      >
        <div>
          <h1 className="text-xl font-black" style={{ color: accentColor }}>
            {userEmoji} {userName}&apos;s Rankings
          </h1>
          <p className="text-xs" style={{ color: '#4a7090' }}>
            Use ↑↓ to fine-tune, then save
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startBattle}
            className="px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
            style={{
              backgroundColor: 'rgba(0,212,255,0.1)',
              color: '#00d4ff',
              border: '1px solid rgba(0,212,255,0.25)',
            }}
          >
            ↺ Redo
          </button>
          <button
            onClick={() => {
              if (!resetConfirm) { setResetConfirm(true); setTimeout(() => setResetConfirm(false), 3000); return; }
              localStorage.removeItem(`guppy_rankings_${userParam}`);
              setResetConfirm(false);
              setSaved(false);
              setPhase('start');
            }}
            className="px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
            style={resetConfirm
              ? { backgroundColor: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)' }
              : { backgroundColor: 'rgba(255,255,255,0.04)', color: '#4a7090', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            {resetConfirm ? '⚠️ Confirm' : '🗑 Reset'}
          </button>
          <button
            onClick={save}
            className="px-4 py-2 rounded-xl text-sm font-black transition-all active:scale-95"
            style={{
              background: saved
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : `linear-gradient(135deg, ${accentColor}, ${accentAlt})`,
              color: '#030d1a',
            }}
          >
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* Top 3 podium banner */}
      {ranked.length >= 3 && (
        <div
          className="mx-4 mt-4 mb-2 p-4 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,140,0,0.05))',
            border: '1px solid rgba(255,215,0,0.2)',
          }}
        >
          <p className="text-xs font-bold mb-3 text-center" style={{ color: '#ffd700' }}>
            🏆 YOUR TOP 3 FAVORITES
          </p>
          <div className="flex gap-3 justify-center">
            {ranked.slice(0, 3).map((s, i) => {
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={s.id} className="flex flex-col items-center gap-1 flex-1 max-w-[100px]">
                  <div className="text-2xl">{medals[i]}</div>
                  <div className="w-full aspect-square rounded-xl overflow-hidden">
                    <WikiImage
                      query={s.wikiSearch}
                      alt={s.name}
                      gradientFrom={s.gradientFrom}
                      gradientTo={s.gradientTo}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="text-center text-xs font-bold leading-tight" style={{ color: '#e0f4ff' }}>
                    {s.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full ranked list */}
      <div className="px-4 pb-6 mt-2">
        <p className="text-xs font-bold mb-3 mt-4" style={{ color: '#4a7090' }}>
          FULL RANKING — tap ↑↓ to adjust
        </p>
        {ranked.map((strain, index) => {
          const w = wins[strain.id] ?? 0;
          const t = total[strain.id] ?? 0;
          const l = t - w;
          const isTop3 = index < 3;
          const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
          const rankColor = isTop3 ? rankColors[index] : '#4a7090';

          return (
            <div
              key={strain.id}
              className="flex items-center gap-3 mb-2 p-2.5 rounded-xl transition-all"
              style={{
                backgroundColor: '#0d1f3a',
                border: `1px solid ${isTop3 ? `${rankColor}44` : 'rgba(255,255,255,0.04)'}`,
              }}
            >
              {/* Rank */}
              <div
                className="w-8 text-center font-black text-base flex-shrink-0"
                style={{ color: rankColor }}
              >
                {index + 1}
              </div>

              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <WikiImage
                  query={strain.wikiSearch}
                  alt={strain.name}
                  gradientFrom={strain.gradientFrom}
                  gradientTo={strain.gradientTo}
                  className="w-full h-full"
                />
              </div>

              {/* Name + badge + record */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate" style={{ color: '#e0f4ff' }}>
                  {strain.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${getRarityClass(strain.rarity)}`}>
                    {strain.rarity}
                  </span>
                  {t > 0 && (
                    <span className="text-xs" style={{ color: '#4a7090' }}>
                      {w}W {l}L
                    </span>
                  )}
                </div>
              </div>

              {/* Up/Down arrows */}
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="w-8 h-7 rounded-lg flex items-center justify-center text-base font-bold transition-all active:scale-90 disabled:opacity-20"
                  style={{
                    backgroundColor: 'rgba(0,212,255,0.12)',
                    color: '#00d4ff',
                    border: '1px solid rgba(0,212,255,0.2)',
                  }}
                >
                  ↑
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === ranked.length - 1}
                  className="w-8 h-7 rounded-lg flex items-center justify-center text-base font-bold transition-all active:scale-90 disabled:opacity-20"
                  style={{
                    backgroundColor: 'rgba(0,212,255,0.12)',
                    color: '#00d4ff',
                    border: '1px solid rgba(0,212,255,0.2)',
                  }}
                >
                  ↓
                </button>
              </div>
            </div>
          );
        })}

        {/* Save / compare actions */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={save}
            className="w-full py-4 rounded-2xl text-xl font-black transition-all active:scale-95"
            style={{
              background: saved
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : `linear-gradient(135deg, ${accentColor}, ${accentAlt})`,
              color: '#030d1a',
              boxShadow: saved ? '0 0 20px rgba(34,197,94,0.4)' : `0 0 30px ${accentColor}44`,
            }}
          >
            {saved ? '✓ Rankings Saved!' : '💾 Save My Rankings'}
          </button>

          {saved && (
            <Link href="/compare">
              <button
                className="w-full py-3 rounded-2xl text-base font-black transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,140,0,0.15))',
                  color: '#ffd700',
                  border: '1px solid rgba(255,215,0,0.4)',
                }}
              >
                ✨ Compare Our Rankings →
              </button>
            </Link>
          )}

          <Link href="/" className="text-center text-sm py-2" style={{ color: '#4a7090' }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
