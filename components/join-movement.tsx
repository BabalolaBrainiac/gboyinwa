'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, MessageSquare } from 'lucide-react';
import { ContactModal } from './contact-modal';

export function JoinMovement() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ContactModal open={open} onClose={() => setOpen(false)} />

      <section className="section-padding">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative rounded-3xl bg-gradient-to-r from-brand-green via-brand-violet to-brand-orange p-[2px]">
            <div className="rounded-[22px] bg-white dark:bg-brand-black p-12 md:p-16">
              <div className="w-20 h-20 mx-auto mb-7 rounded-3xl bg-gradient-to-br from-brand-yellow to-brand-orange flex items-center justify-center shadow-lg shadow-brand-orange/20">
                <Play className="w-9 h-9 text-white ml-1" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold gradient-text-brand mb-4">
                Join the Movement
              </h2>
              <p className="text-brand-black/60 dark:text-brand-yellow/60 mb-9 max-w-lg mx-auto leading-relaxed">
                Be part of our community. Explore our events, read our stories, and discover
                the magic of authentic Nigerian storytelling.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/events" className="btn-primary">
                  View Events
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Read Blog
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
