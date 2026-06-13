'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import WikiImage from './WikiImage';
import { GuppyStrain } from '@/lib/guppies';

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

interface SortableRankItemProps {
  strain: GuppyStrain;
  rank: number;
  onRemove: (id: string) => void;
}

export default function SortableRankItem({ strain, rank, onRemove }: SortableRankItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: strain.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  const mergedStyle = {
    ...style,
    borderColor: rank === 1 ? '#ffd700' : 'rgba(0, 212, 255, 0.25)',
    boxShadow: rank === 1 ? '0 0 8px rgba(255,215,0,0.3)' : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={mergedStyle}
      className={`flex items-center gap-3 p-3 rounded-xl border mb-2 transition-all ${
        isDragging ? 'glow-cyan' : ''
      }`}
      {...attributes}
    >
      {/* Drag handle */}
      <button
        className="cursor-grab active:cursor-grabbing flex-shrink-0 text-gray-500 hover:text-cyan-400 transition-colors"
        {...listeners}
      >
        ⠿
      </button>

      {/* Rank number */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
        style={
          rank === 1
            ? { background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#030d1a' }
            : rank === 2
            ? { background: 'linear-gradient(135deg, #9e9e9e, #bdbdbd)', color: '#030d1a' }
            : rank === 3
            ? { background: 'linear-gradient(135deg, #cd7f32, #e6a050)', color: '#030d1a' }
            : { backgroundColor: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }
        }
      >
        {rank}
      </div>

      {/* Image thumbnail */}
      <WikiImage
        query={strain.wikiSearch}
        alt={strain.name}
        gradientFrom={strain.gradientFrom}
        gradientTo={strain.gradientTo}
        className="w-12 h-12 rounded-lg flex-shrink-0"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate" style={{ color: '#e0f4ff' }}>
          {strain.name}
        </div>
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${getRarityClass(strain.rarity)}`}>
          {strain.rarity}
        </span>
      </div>

      {/* Remove button */}
      <button
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors"
        style={{
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          color: '#f87171',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        }}
        onClick={() => onRemove(strain.id)}
      >
        ✕
      </button>
    </div>
  );
}
