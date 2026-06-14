'use client';

import { useEffect, useState, useRef } from 'react';

// Two-step Wikimedia fetch:
// 1. Search Commons for matching files
// 2. Get direct upload.wikimedia.org URL via imageinfo API (no redirects)
const imageCache = new Map<string, string | null>();

interface WikiImageProps {
  query: string;
  alt: string;
  gradientFrom: string;
  gradientTo: string;
  className?: string;
  photoUrl?: string;
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
    if (photoUrl) {
      setImageUrl(photoUrl);
      setLoading(false);
      return;
    }

    const cacheKey = query;

    const fetchImage = async () => {
      if (fetchedRef.current) return;
      fetchedRef.current = true;

      if (imageCache.has(cacheKey)) {
        const cached = imageCache.get(cacheKey);
        setImageUrl(cached ?? null);
        setLoading(false);
        if (!cached) setError(true);
        return;
      }

      try {
        // Step 1: search Commons for image files matching the query
        const searchRes = await fetch(
          `https://commons.wikimedia.org/w/api.php?` +
          `action=query&list=search` +
          `&srsearch=${encodeURIComponent(query + ' male guppy')}` +
          `&srnamespace=6&srlimit=10&format=json&origin=*&srprop=title`,
        );
        const searchData = await searchRes.json();
        const results: { title: string }[] = searchData?.query?.search ?? [];

        // Filter to image files only
        const imageFiles = results.filter(r =>
          /\.(jpg|jpeg|png|webp)$/i.test(r.title),
        );

        // Fallback: try without "male guppy" suffix
        if (imageFiles.length === 0) {
          const fallbackRes = await fetch(
            `https://commons.wikimedia.org/w/api.php?` +
            `action=query&list=search` +
            `&srsearch=${encodeURIComponent(query)}` +
            `&srnamespace=6&srlimit=10&format=json&origin=*&srprop=title`,
          );
          const fallbackData = await fallbackRes.json();
          const fallbackResults: { title: string }[] = fallbackData?.query?.search ?? [];
          imageFiles.push(...fallbackResults.filter(r =>
            /\.(jpg|jpeg|png|webp)$/i.test(r.title),
          ));
        }

        if (imageFiles.length === 0) {
          imageCache.set(cacheKey, null);
          setError(true);
          setLoading(false);
          return;
        }

        // Step 2: get direct upload.wikimedia.org URL via imageinfo API
        const fileTitle = imageFiles[0].title;
        const infoRes = await fetch(
          `https://commons.wikimedia.org/w/api.php?` +
          `action=query&titles=${encodeURIComponent(fileTitle)}` +
          `&prop=imageinfo&iiprop=url&iiurlwidth=500` +
          `&format=json&origin=*`,
        );
        const infoData = await infoRes.json();
        const pages = Object.values(infoData?.query?.pages ?? {}) as {
          imageinfo?: { url: string; thumburl?: string }[];
        }[];
        const info = pages[0]?.imageinfo?.[0];
        const directUrl = info?.thumburl ?? info?.url ?? null;

        imageCache.set(cacheKey, directUrl);
        setImageUrl(directUrl);
        if (!directUrl) setError(true);
      } catch {
        imageCache.set(cacheKey, null);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          fetchImage();
          observer.disconnect();
        }
      },
      { rootMargin: '400px' },
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [query, photoUrl]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {loading && <div className="absolute inset-0 skeleton" />}

      {!loading && imageUrl && !error && (
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => {
            imageCache.delete(query); // allow retry with next search result
            setError(true);
          }}
        />
      )}

      {!loading && (!imageUrl || error) && (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-1 p-2"
          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
        >
          <span className="text-3xl">🐟</span>
          <span className="text-white/60 text-xs text-center leading-tight">{alt}</span>
        </div>
      )}
    </div>
  );
}
