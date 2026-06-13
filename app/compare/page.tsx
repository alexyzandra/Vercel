'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { guppyStrains, GuppyStrain } from '@/lib/guppies';
import WikiImage from '@/components/WikiImage';

function getRarityClass(rarity: string) {
  switch (rarity) {
    case 'Common': return 'rarity-common';
    case 'Uncommon': return 'rarity-uncommon';
    case 'Rare': return 'rarity-rare';
    case 'Very Rare': return 'rarity-very-rare';
    case 'Ultra Rare': return 'rarity-ultra-rare';
    default: return 'rarity-common';
  }
}

interface MatchResult {
  strain: GuppyStrain;
  husbandRank: number;
  wifeRank: number;
  avgRank: number;
}

export default function ComparePage() {
  const [husbandRanked, setHusbandRanked] = useState<string[]>([]);
  const [wifeRanked, setWifeRanked] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const h = localStorage.getItem('guppy_rankings_person1');
    const w = localStorage.getItem('guppy_rankings_person2');
    if (h) { try { setHusbandRanked(JSON.parse(h)); } catch {} }
    if (w) { try { setWifeRanked(JSON.parse(w)); } catch {} }
    setLoaded(true);
  }, []);

  const matches: MatchResult[] = husbandRanked
    .filter(id => wifeRanked.includes(id))
    .map(id => ({
      strain: guppyStrains.find(s => s.id === id)!,
      husbandRank: husbandRanked.indexOf(id) + 1,
      wifeRank: wifeRanked.indexOf(id) + 1,
      avgRank: ((husbandRanked.indexOf(id) + 1) + (wifeRanked.indexOf(id) + 1)) / 2,
    }))
    .filter(m => m.strain)
    .sort((a, b) => a.avgRank - b.avgRank);

  const top10Husband = husbandRanked.slice(0, 10);
  const top10Wife = wifeRanked.slice(0, 10);
  const overlap = top10Husband.filter(id => top10Wife.includes(id)).length;
  const compatibilityScore = husbandRanked.length > 0 && wifeRanked.length > 0
    ? Math.round((overlap / Math.min(10, Math.min(husbandRanked.length, wifeRanked.length))) * 100)
    : 0;

  const getHusbandStrain = (id: string) => guppyStrains.find(s => s.id === id);
  const getWifeStrain = (id: string) => guppyStrains.find(s => s.id === id);

  if (!loaded) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#030d1a' }}>
      <div className="skeleton w-16 h-16 rounded-full" />
    </div>
  );

  if (husbandRanked.length === 0 || wifeRanked.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#030d1a' }}>
        <div className="text-6xl mb-6">😅</div>
        <h1 className="text-2xl font-bold mb-4" style={{ color: '#00d4ff' }}>Both need rankings first!</h1>
        <div className="flex gap-4">
          <Link href="/rank/person1">
            <button className="px-6 py-3 rounded-xl font-bold" style={{ backgroundColor: '#0d1f3a', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }}>
              1️⃣ Person 1&apos;s Rankings
            </button>
          </Link>
          <Link href="/rank/person2">
            <button className="px-6 py-3 rounded-xl font-bold" style={{ backgroundColor: '#0d1f3a', color: '#ffd700', border: '1px solid rgba(255,215,0,0.3)' }}>
              2️⃣ Person 2&apos;s Rankings
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#030d1a' }}>
      {/* Header */}
      <header className="px-6 py-5 border-b" style={{ borderColor: 'rgba(0,212,255,0.15)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm mb-1 block" style={{ color: '#7dc8e0' }}>← Back to Home</Link>
            <h1 className="text-3xl font-black glow-text-cyan" style={{ color: '#00d4ff' }}>
              🐟 Rankings Comparison
            </h1>
          </div>
          <div className="flex gap-3">
            <Link href="/rank/person1">
              <button className="px-4 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: '#0d1f3a', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }}>
                1️⃣ Re-rank Person 1
              </button>
            </Link>
            <Link href="/rank/person2">
              <button className="px-4 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: '#0d1f3a', color: '#ffd700', border: '1px solid rgba(255,215,0,0.3)' }}>
                2️⃣ Re-rank Person 2
              </button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Compatibility Score */}
        <div
          className="rounded-2xl p-8 text-center border glow-gold"
          style={{ backgroundColor: '#0d1f3a', borderColor: 'rgba(255,215,0,0.4)' }}
        >
          <div className="text-sm mb-2" style={{ color: '#c4a882' }}>Taste Compatibility</div>
          <div
            className="text-7xl font-black mb-2 glow-text-gold"
            style={{ color: '#ffd700' }}
          >
            {compatibilityScore}%
          </div>
          <div className="text-sm" style={{ color: '#7dc8e0' }}>
            {overlap} shared strains in top {Math.min(10, Math.min(husbandRanked.length, wifeRanked.length))} • {matches.length} total matches
          </div>
          <div className="mt-4 text-base" style={{ color: '#e0f4ff' }}>
            {compatibilityScore >= 70
              ? '🎉 Excellent! You share very similar tastes!'
              : compatibilityScore >= 40
              ? '✨ Good overlap! You have complementary preferences.'
              : compatibilityScore >= 20
              ? '🤔 Some common ground — interesting mix!'
              : '🐟 Diverse tastes! Great for varied breeding projects.'}
          </div>
        </div>

        {/* Breeding Recommendations */}
        {matches.length > 0 && (
          <section>
            <h2 className="text-2xl font-black mb-4 glow-text-gold" style={{ color: '#ffd700' }}>
              ✨ Breeding Recommendations
            </h2>
            <p className="text-sm mb-6" style={{ color: '#7dc8e0' }}>
              Strains you both ranked, sorted by combined preference
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.slice(0, 6).map((match, i) => (
                <div
                  key={match.strain.id}
                  className="rounded-2xl overflow-hidden border glow-gold"
                  style={{
                    backgroundColor: '#0d1f3a',
                    borderColor: 'rgba(255,215,0,0.4)',
                  }}
                >
                  <div className="relative">
                    <WikiImage
                      query={match.strain.wikiSearch}
                      alt={match.strain.name}
                      gradientFrom={match.strain.gradientFrom}
                      gradientTo={match.strain.gradientTo}
                      className="w-full h-40"
                    />
                    <div
                      className="absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center font-black text-lg"
                      style={{ background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#030d1a' }}
                    >
                      {i + 1}
                    </div>
                    <div
                      className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#ffd700' }}
                    >
                      Avg #{match.avgRank.toFixed(1)}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold mb-2" style={{ color: '#e0f4ff' }}>{match.strain.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getRarityClass(match.strain.rarity)}`}>
                      {match.strain.rarity}
                    </span>
                    <div className="mt-3 flex gap-3">
                      <div className="flex-1 text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(0,212,255,0.1)' }}>
                        <div className="text-xs" style={{ color: '#7dc8e0' }}>1️⃣ Person 1</div>
                        <div className="font-bold" style={{ color: '#00d4ff' }}>#{match.husbandRank}</div>
                      </div>
                      <div className="flex-1 text-center p-2 rounded-lg" style={{ backgroundColor: 'rgba(255,215,0,0.1)' }}>
                        <div className="text-xs" style={{ color: '#c4a882' }}>2️⃣ Person 2</div>
                        <div className="font-bold" style={{ color: '#ffd700' }}>#{match.wifeRank}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Side by Side Rankings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Husband */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(0,212,255,0.3)', backgroundColor: '#0d1f3a' }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(0,212,255,0.2)', backgroundColor: 'rgba(0,212,255,0.05)' }}>
              <h2 className="text-xl font-black" style={{ color: '#00d4ff' }}>1️⃣ Person 1&apos;s Rankings</h2>
              <p className="text-xs mt-1" style={{ color: '#7dc8e0' }}>{husbandRanked.length} strains ranked</p>
            </div>
            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {husbandRanked.map((id, i) => {
                const strain = getHusbandStrain(id);
                if (!strain) return null;
                const isMatch = wifeRanked.includes(id);
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{
                      backgroundColor: isMatch ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isMatch ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.05)'}`,
                      boxShadow: isMatch ? '0 0 12px rgba(255,215,0,0.15)' : 'none',
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={i === 0 ? { background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#030d1a' } : { backgroundColor: 'rgba(0,212,255,0.15)', color: '#00d4ff' }}
                    >
                      {i + 1}
                    </div>
                    <WikiImage
                      query={strain.wikiSearch}
                      alt={strain.name}
                      gradientFrom={strain.gradientFrom}
                      gradientTo={strain.gradientTo}
                      className="w-10 h-10 rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: '#e0f4ff' }}>{strain.name}</div>
                    </div>
                    {isMatch && <span className="text-yellow-400 text-sm">⭐</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wife */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(255,215,0,0.3)', backgroundColor: '#0d1f3a' }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,215,0,0.2)', backgroundColor: 'rgba(255,215,0,0.05)' }}>
              <h2 className="text-xl font-black" style={{ color: '#ffd700' }}>2️⃣ Person 2&apos;s Rankings</h2>
              <p className="text-xs mt-1" style={{ color: '#c4a882' }}>{wifeRanked.length} strains ranked</p>
            </div>
            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {wifeRanked.map((id, i) => {
                const strain = getWifeStrain(id);
                if (!strain) return null;
                const isMatch = husbandRanked.includes(id);
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{
                      backgroundColor: isMatch ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isMatch ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.05)'}`,
                      boxShadow: isMatch ? '0 0 12px rgba(255,215,0,0.15)' : 'none',
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                      style={i === 0 ? { background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#030d1a' } : { backgroundColor: 'rgba(255,215,0,0.15)', color: '#ffd700' }}
                    >
                      {i + 1}
                    </div>
                    <WikiImage
                      query={strain.wikiSearch}
                      alt={strain.name}
                      gradientFrom={strain.gradientFrom}
                      gradientTo={strain.gradientTo}
                      className="w-10 h-10 rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: '#e0f4ff' }}>{strain.name}</div>
                    </div>
                    {isMatch && <span className="text-yellow-400 text-sm">⭐</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {matches.length === 0 && (
          <div className="text-center py-12" style={{ color: '#7dc8e0' }}>
            <div className="text-5xl mb-4">🤷</div>
            <p className="text-lg font-bold mb-2">No common strains yet!</p>
            <p className="text-sm">Keep ranking — you might find more common favorites.</p>
          </div>
        )}
      </div>
    </div>
  );
}
