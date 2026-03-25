'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MessageSquare, Calendar, BookOpen } from 'lucide-react';
import { ContactModal } from './contact-modal';

export function JoinMovement() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ContactModal open={open} onClose={() => setOpen(false)} />

      <section className="section-padding">
        <div className="max-w-6xl mx-auto">
          <AnimateIn>
            <div className="relative rounded-3xl overflow-hidden bg-brand-green dark:bg-[#060f06]">
              {/* Abstract yellow accent shapes */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-brand-yellow/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-yellow/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-violet/5 rounded-full blur-3xl" />
              
              {/* Yellow accent lines */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-yellow/30 to-transparent" />
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-yellow/20 to-transparent" />

              {/* Grid pattern overlay */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `linear-gradient(rgba(244,196,48,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(244,196,48,0.3) 1px, transparent 1px)`,
                  backgroundSize: '60px 60px'
                }} />
              </div>

              <div className="relative px-6 py-12 md:px-12 md:py-16 text-center">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow/15 text-brand-yellow text-xs font-bold tracking-widest uppercase mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow animate-pulse" />
                  Get Involved
                </span>
                
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Join the Mission
                </h2>
                
                <p className="text-white/60 max-w-lg mx-auto mb-8 leading-relaxed text-sm">
                  Be part of our community. Explore our events, read our stories, and discover
                  the magic of authentic Nigerian storytelling.
                </p>

                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/programs"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-yellow text-brand-black font-semibold text-sm hover:bg-brand-yellow/90 active:scale-[0.98] transition-all shadow-lg shadow-brand-yellow/20"
                  >
                    <Calendar className="w-4 h-4" />
                    View Programs
                  </Link>
                  
                  <Link
                    href="/letters"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white font-semibold text-sm border border-white/20 hover:bg-white/20 active:scale-[0.98] transition-all"
                  >
                    <BookOpen className="w-4 h-4" />
                    Subscribe to Letters
                  </Link>
                  
                  <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-violet text-white font-semibold text-sm hover:bg-brand-violet/90 active:scale-[0.98] transition-all shadow-lg shadow-brand-violet/20"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Get in Touch
                  </button>
                </div>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}

// Simple animate in wrapper for this component
function AnimateIn({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`animate-fade-in-up ${className}`}>
      {children}
    </div>
  );
}
