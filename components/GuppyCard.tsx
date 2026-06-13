'use client';

import WikiImage from './WikiImage';
import { GuppyStrain } from '@/lib/guppies';

interface GuppyCardProps {
  strain: GuppyStrain;
  onAdd: (strain: GuppyStrain) => void;
  isRanked: boolean;
}

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

export default function GuppyCard({ strain, onAdd, isRanked }: GuppyCardProps) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden border transition-all duration-200 ${
        isRanked
          ? 'opacity-40 cursor-not-allowed'
          : 'cursor-pointer card-hover hover:border-cyan-400'
      }`}
      style={{
        backgroundColor: '#0d1f3a',
        borderColor: isRanked ? 'rgba(255,255,255,0.1)' : 'rgba(0, 212, 255, 0.2)',
      }}
      onClick={() => !isRanked && onAdd(strain)}
    >
      {/* Image */}
      <WikiImage
        query={strain.wikiSearch}
        alt={strain.name}
        gradientFrom={strain.gradientFrom}
        gradientTo={strain.gradientTo}
        className="w-full h-32"
      />

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-bold leading-tight" style={{ color: '#e0f4ff' }}>
            {strain.name}
          </h3>
          {isRanked ? (
            <span className="text-xs text-green-400 flex-shrink-0">✓</span>
          ) : (
            <button
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
              style={{
                backgroundColor: 'rgba(0, 212, 255, 0.2)',
                color: '#00d4ff',
                border: '1px solid rgba(0, 212, 255, 0.4)',
              }}
              onClick={(e) => { e.stopPropagation(); onAdd(strain); }}
            >
              +
            </button>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${getRarityClass(strain.rarity)}`}>
          {strain.rarity}
        </span>
      </div>
    </div>
  );
}
