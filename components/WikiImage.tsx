'use client';

import { useEffect, useState, useRef } from 'react';

const imageCache = new Map<string, string | null>();

interface WikiImageProps {
  query: string;
  alt: string;
  gradientFrom: string;
  gradientTo: string;
  className?: string;
  photoUrl?: string; // direct URL — skips Wikimedia search entirely
}

export default function WikiImage({
  query,
  alt,
  gradientFrom,
  gradientTo,
  className = '',
  photoUrl,
}: WikiImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(photoUrl ?? null);
  const [loading, setLoading] = useState(!photoUrl);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // If a direct photo URL is provided, use it immediately
    if (photoUrl) {
      setImageUrl(photoUrl);
      setLoading(false);
      return;
    }

    const fetchImage = async () => {
      if (fetchedRef.current) return;
      fetchedRef.current = true;

      // Check module-level cache
      if (imageCache.has(query)) {
        const cached = imageCache.get(query);
        setImageUrl(cached ?? null);
        setLoading(false);
        if (!cached) setError(true);
        return;
      }

      try {
        const searchUrl =
          `https://commons.wikimedia.org/w/api.php` +
          `?action=query&list=search` +
          `&srsearch=${encodeURIComponent(query)}` +
          `&srnamespace=6&srlimit=8&format=json&origin=*&srprop=title`;

        const res = await fetch(searchUrl);
        const data = await res.json();
        const results: { title: string }[] = data?.query?.search ?? [];

        let found: string | null = null;
        for (const result of results) {
          if (/\.(jpg|jpeg|png|webp)$/i.test(result.title)) {
            const filename = result.title.replace(/^File:/, '');
            found =
              `https://commons.wikimedia.org/wiki/Special:FilePath/` +
              `${encodeURIComponent(filename)}?width=500`;
            break;
          }
        }

        imageCache.set(query, found);
        setImageUrl(found);
        if (!found) setError(true);
      } catch {
        imageCache.set(query, null);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    // Lazy-load: only fetch when the element scrolls into view
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchImage();
          observer.disconnect();
        }
      },
      { rootMargin: '300px' },
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [query, photoUrl]);

  const Fallback = () => (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-1"
      style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
    >
      <span className="text-4xl">🐟</span>
      <span className="text-white/50 text-xs px-2 text-center leading-tight">{alt}</span>
    </div>
  );

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {loading && <div className="absolute inset-0 skeleton" />}

      {!loading && imageUrl && !error && (
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => {
            imageCache.set(query, null);
            setError(true);
          }}
        />
      )}

      {!loading && (!imageUrl || error) && <Fallback />}
    </div>
  );
}
