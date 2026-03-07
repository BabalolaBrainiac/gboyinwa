'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock, X, Shield } from 'lucide-react';

interface SidebarNavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  hasPermission: boolean;
}

export function SidebarNavItem({ href, icon, label, hasPermission }: SidebarNavItemProps) {
  const [showModal, setShowModal] = useState(false);

  // If user has permission, render normal link
  if (hasPermission) {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-black/80 dark:text-brand-yellow/80 hover:bg-brand-green/5 dark:hover:bg-brand-yellow/10 hover:text-brand-green dark:hover:text-brand-yellow transition-colors"
      >
        {icon}
        {label}
      </Link>
    );
  }

  // If no permission, show disabled state with lock icon
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-black/40 dark:text-brand-yellow/40 hover:bg-brand-green/5 dark:hover:bg-brand-yellow/10 hover:text-brand-black/60 dark:hover:text-brand-yellow/60 transition-colors cursor-pointer group"
      >
        {icon}
        <span className="flex-1 text-left">{label}</span>
        <Lock className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Permission denied modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white dark:bg-brand-black rounded-2xl border border-brand-green/20 dark:border-brand-yellow/20 shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-yellow/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-brand-yellow" />
                </div>
                <div>
                  <h3 className="font-semibold text-brand-black dark:text-brand-yellow">
                    Access Restricted
                  </h3>
                  <p className="text-xs text-brand-black/50 dark:text-brand-yellow/50">
                    {label}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-brand-black/40 dark:text-brand-yellow/40 hover:bg-brand-green/10 dark:hover:bg-brand-yellow/10 hover:text-brand-black dark:hover:text-brand-yellow transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <p className="text-sm text-brand-black/70 dark:text-brand-yellow/70 leading-relaxed">
                You don&apos;t have permission to access <span className="font-medium text-brand-black dark:text-brand-yellow">{label}</span>. 
                This area requires additional privileges.
              </p>

              <div className="p-3 rounded-xl bg-brand-yellow/5 border border-brand-yellow/10">
                <p className="text-xs text-brand-black/60 dark:text-brand-yellow/60">
                  Contact a superadmin if you need access to this feature.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 bg-brand-green dark:bg-brand-yellow text-white dark:text-brand-black font-medium rounded-xl hover:opacity-90 transition-opacity text-sm"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
