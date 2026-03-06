'use client';

import { Share2 } from 'lucide-react';

interface ShareButtonProps {
  title: string;
}

export function ShareButton({ title }: ShareButtonProps) {
  const handleShare = () => {
    if (typeof navigator !== 'undefined') {
      navigator.share?.({ 
        title, 
        url: window.location.href 
      }).catch(() => {});
    }
  };

  return (
    <button 
      className="flex items-center gap-2 text-brand-green dark:text-brand-yellow hover:underline"
      onClick={handleShare}
    >
      <Share2 className="w-4 h-4" />
      Share with friends
    </button>
  );
}
