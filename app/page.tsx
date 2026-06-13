'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [husbandHasRankings, setHusbandHasRankings] = useState(false);
  const [wifeHasRankings, setWifeHasRankings] = useState(false);

  useEffect(() => {
    const husband = localStorage.getItem('guppy_rankings_husband');
    const wife = localStorage.getItem('guppy_rankings_wife');
    if (husband) {
      try {
        const parsed = JSON.parse(husband);
        setHusbandHasRankings(Array.isArray(parsed) && parsed.length > 0);
      } catch {}
    }
    if (wife) {
      try {
        const parsed = JSON.parse(wife);
        setWifeHasRankings(Array.isArray(parsed) && parsed.length > 0);
      } catch {}
    }
  }, []);

  const bothHaveRankings = husbandHasRankings && wifeHasRankings;

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
        <p className="text-lg mb-12" style={{ color: '#7dc8e0' }}>
          Discover your perfect breeding pair ✨
        </p>

        {/* User selection cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Husband card */}
          <Link href="/rank/husband" className="group block">
            <div
              className="relative rounded-2xl p-8 card-hover cursor-pointer border"
              style={{
                backgroundColor: '#0d1f3a',
                borderColor: '#00d4ff44',
                background: 'linear-gradient(135deg, #0d1f3a 0%, #0a2a4a 100%)',
              }}
            >
              <div className="text-6xl mb-4">🤴</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#00d4ff' }}>
                Husband&apos;s Rankings
              </h2>
              <p className="text-sm mb-4" style={{ color: '#7dc8e0' }}>
                Pick and rank your favorite guppy strains
              </p>
              {husbandHasRankings ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                     style={{ backgroundColor: 'rgba(0, 212, 255, 0.15)', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.3)' }}>
                  ✓ Rankings saved
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                     style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#7dc8e0', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Not yet ranked
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                   style={{ boxShadow: 'inset 0 0 30px rgba(0, 212, 255, 0.1)' }} />
            </div>
          </Link>

          {/* Wife card */}
          <Link href="/rank/wife" className="group block">
            <div
              className="relative rounded-2xl p-8 card-hover cursor-pointer border"
              style={{
                backgroundColor: '#0d1f3a',
                borderColor: '#ffd70044',
                background: 'linear-gradient(135deg, #1a0d2e 0%, #2a1a3e 100%)',
              }}
            >
              <div className="text-6xl mb-4">👸</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#ffd700' }}>
                Wife&apos;s Rankings
              </h2>
              <p className="text-sm mb-4" style={{ color: '#c4a882' }}>
                Pick and rank your favorite guppy strains
              </p>
              {wifeHasRankings ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                     style={{ backgroundColor: 'rgba(255, 215, 0, 0.15)', color: '#ffd700', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
                  ✓ Rankings saved
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                     style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#c4a882', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Not yet ranked
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                   style={{ boxShadow: 'inset 0 0 30px rgba(255, 215, 0, 0.1)' }} />
            </div>
          </Link>
        </div>

        {/* Compare button */}
        {bothHaveRankings && (
          <Link href="/compare">
            <button
              className="px-10 py-4 rounded-2xl text-lg font-bold transition-all duration-300 glow-gold"
              style={{
                background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                color: '#030d1a',
              }}
            >
              ✨ Compare Rankings ✨
            </button>
          </Link>
        )}

        {!bothHaveRankings && (
          <p className="text-sm" style={{ color: '#7dc8e0' }}>
            Both need to rank strains before comparing
          </p>
        )}
      </div>
    </div>
  );
}
