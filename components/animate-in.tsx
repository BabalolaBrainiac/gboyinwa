'use client';

import { useEffect, useRef, ReactNode } from 'react';

interface AnimateInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  type?: 'up' | 'fade';
}

export function AnimateIn({ children, className = '', delay = 0, type = 'up' }: AnimateInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('in-view'), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`${type === 'fade' ? 'will-animate-fade' : 'will-animate'} ${className}`}
    >
      {children}
    </div>
  );
}
