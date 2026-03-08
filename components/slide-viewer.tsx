'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface SlideViewerProps {
  urls: string[];
  title?: string;
}

export function SlideViewer({ urls, title }: SlideViewerProps) {
  const [index, setIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const prev = useCallback(() => {
    setIndex(i => Math.max(0, i - 1));
    setImageLoaded(false);
  }, []);

  const next = useCallback(() => {
    setIndex(i => Math.min(urls.length - 1, i + 1));
    setImageLoaded(false);
  }, [urls.length]);

  // Arrow key navigation — only active while this viewer is mounted
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next]);

  if (urls.length === 0) return null;

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      {/* Loading shimmer while the image fetches */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
        </div>
      )}

      {/* Slide image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={urls[index]}
        src={urls[index]}
        alt={title ? `${title} — slide ${index + 1}` : `Slide ${index + 1}`}
        className={`max-w-full max-h-full object-contain transition-opacity duration-150 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setImageLoaded(true)}
        draggable={false}
      />

      {/* Prev */}
      {index > 0 && (
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/50 hover:bg-black/75 text-white rounded-full transition-colors"
          title="Previous slide (←)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Next */}
      {index < urls.length - 1 && (
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/50 hover:bg-black/75 text-white rounded-full transition-colors"
          title="Next slide (→)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Slide counter */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 text-white/80 text-xs rounded-full pointer-events-none">
        {index + 1} / {urls.length}
      </div>
    </div>
  );
}
