'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const KEYS = {
  person1: 'guppy_rankings_person1',
  person2: 'guppy_rankings_person2',
};

function hasRankings(key: string): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

export default function HomePage() {
  const [p1Done, setP1Done] = useState(false);
  const [p2Done, setP2Done] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const refresh = () => {
    setP1Done(hasRankings(KEYS.person1));
    setP2Done(hasRankings(KEYS.person2));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleReset = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
      return;
    }
    localStorage.removeItem(KEYS.person1);
    localStorage.removeItem(KEYS.person2);
    setP1Done(false);
    setP2Done(false);
    setResetConfirm(false);
  };

  const bothDone = p1Done && p2Done;

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Animated background fish */}
      <div className="fish-swim" style={{ top: '15%', animationDuration: '18s', animationDelay: '0s' }}>🐟</div>
      <div className="fish-swim" style={{ top: '45%', animationDuration: '25s', animationDelay: '5s', fontSize: '1.5rem' }}>🐠</div>
      <div className="fish-swim" style={{ top: '70%', animationDuration: '20s', animationDelay: '10s', fontSize: '2.5rem' }}>🐡</div>
      <div className="fish-swim-reverse" style={{ top: '30%', animationDuration: '22s', animationDelay: '3s' }}>🐟</div>
      <div className="fish-swim-reverse" style={{ top: '60%', animationDuration: '30s', animationDelay: '8s', fontSize: '1.2rem' }}>🐠</div>

      {/* Bubbles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="bubble"
          style={{
            left: `${10 + i * 12}%`,
            bottom: '-20px',
            width: `${8 + (i % 3) * 6}px`,
            height: `${8 + (i % 3) * 6}px`,
            animationDuration: `${6 + i * 1.5}s`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 text-center max-w-2xl w-full">
        {/* Title */}
        <div className="mb-2 flex items-center justify-center gap-3">
          <span className="text-4xl" style={{ animation: 'float-up 3s ease-in-out infinite' }}>🐟</span>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight glow-text-cyan" style={{ color: '#00d4ff' }}>
            Guppy Strain
          </h1>
          <span className="text-4xl" style={{ animation: 'float-up 3s ease-in-out infinite 1.5s' }}>🐠</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4 glow-text-gold" style={{ color: '#ffd700' }}>
          Ranker
        </h1>
        <p className="text-lg mb-10" style={{ color: '#7dc8e0' }}>
          Discover your perfect breeding pair ✨
        </p>

        {/* Player selection cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Person 1 */}
          <Link href="/rank/person1" className="group block">
            <div
              className="relative rounded-2xl p-8 card-hover cursor-pointer border"
              style={{
                borderColor: '#00d4ff44',
                background: 'linear-gradient(135deg, #0d1f3a 0%, #0a2a4a 100%)',
              }}
            >
              <div className="text-6xl mb-4">1️⃣</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#00d4ff' }}>
                Person 1
              </h2>
              <p className="text-sm mb-4" style={{ color: '#7dc8e0' }}>
                Battle through 40 matchups &amp; rank your favorites
              </p>
              {p1Done ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                     style={{ backgroundColor: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }}>
                  ✓ Rankings saved
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                     style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#7dc8e0', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Not yet ranked
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                   style={{ boxShadow: 'inset 0 0 30px rgba(0,212,255,0.1)' }} />
            </div>
          </Link>

          {/* Person 2 */}
          <Link href="/rank/person2" className="group block">
            <div
              className="relative rounded-2xl p-8 card-hover cursor-pointer border"
              style={{
                borderColor: '#ffd70044',
                background: 'linear-gradient(135deg, #1a0d2e 0%, #2a1a3e 100%)',
              }}
            >
              <div className="text-6xl mb-4">2️⃣</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#ffd700' }}>
                Person 2
              </h2>
              <p className="text-sm mb-4" style={{ color: '#c4a882' }}>
                Battle through 40 matchups &amp; rank your favorites
              </p>
              {p2Done ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                     style={{ backgroundColor: 'rgba(255,215,0,0.15)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.3)' }}>
                  ✓ Rankings saved
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                     style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#c4a882', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Not yet ranked
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                   style={{ boxShadow: 'inset 0 0 30px rgba(255,215,0,0.1)' }} />
            </div>
          </Link>
        </div>

        {/* Compare button */}
        {bothDone ? (
          <Link href="/compare">
            <button
              className="px-10 py-4 rounded-2xl text-lg font-bold transition-all duration-300 glow-gold mb-4"
              style={{ background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#030d1a' }}
            >
              ✨ Compare Rankings ✨
            </button>
          </Link>
        ) : (
          <p className="text-sm mb-4" style={{ color: '#7dc8e0' }}>
            Both players need to rank before comparing
          </p>
        )}

        {/* Reset button */}
        {(p1Done || p2Done) && (
          <div className="mt-6">
            <button
              onClick={handleReset}
              className="px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={
                resetConfirm
                  ? { backgroundColor: 'rgba(239,68,68,0.25)', color: '#f87171', border: '1px solid rgba(239,68,68,0.5)' }
                  : { backgroundColor: 'rgba(255,255,255,0.04)', color: '#4a7090', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {resetConfirm ? '⚠️ Tap again to erase all rankings' : '↺ Reset All Rankings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
