'use client';

import { useState } from 'react';
import Image from 'next/image';

interface TeamAvatarProps {
  src: string;
  alt: string;
  initials: string;
  gradient: string;
}

export function TeamAvatar({ src, alt, initials, gradient }: TeamAvatarProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
      >
        <span className="text-2xl font-bold text-white">{initials}</span>
      </div>
    );
  }

  return (
    <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-brand-black shadow-lg group-hover:shadow-xl transition-shadow duration-300">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover group-hover:scale-110 transition-transform duration-300"
        sizes="96px"
        unoptimized
        onError={() => setError(true)}
      />
    </div>
  );
}
