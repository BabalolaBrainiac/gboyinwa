import Link from 'next/link';
import { Film, Mail, MapPin, Instagram, Twitter } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = {
    navigation: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Events', href: '/events' },
      { label: 'Programs', href: '/programs' },
      { label: 'Team', href: '/team' },
      { label: 'Letters', href: '/letters' },
      { label: 'Archive', href: '/archive' },
      { label: 'Contact', href: '/contact' },
    ],
    resources: [
      { label: 'Gbóyindé Grant', href: '/events/gboyinde-grant-young-documentary-filmmakers' },
      { label: 'Join the Mission', href: '/join' },
    ],
  };

  return (
    <footer className="border-t border-brand-green/10 dark:border-brand-yellow/10 bg-white dark:bg-brand-black">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-green dark:bg-brand-yellow flex items-center justify-center">
                <Film className="w-6 h-6 text-white dark:text-brand-black" />
              </div>
              <div>
                <span className="text-2xl font-bold text-brand-green dark:text-brand-yellow block leading-none">
                  gbóyinwá
                </span>
                <span className="text-xs text-brand-black/50 dark:text-brand-yellow/50">
                  Media LTD
                </span>
              </div>
            </Link>
            <p className="text-xs font-medium italic text-brand-green/60 dark:text-brand-yellow/50 mb-4">
              &hellip;for the artists, by the artists
            </p>
            <p className="text-brand-black/70 dark:text-brand-yellow/70 mb-6 max-w-sm">
              Documentary and storytelling from Lagos. Amplifying authentic voices 
              and hidden narratives since 2024.
            </p>
            <div className="space-y-3">
              <a 
                href="mailto:hello@gboyinwa.com" 
                className="flex items-center gap-2 text-sm text-brand-black/60 dark:text-brand-yellow/60 hover:text-brand-green dark:hover:text-brand-yellow transition-colors"
              >
                <Mail className="w-4 h-4" />
                hello@gboyinwa.com
              </a>
              <p className="flex items-center gap-2 text-sm text-brand-black/60 dark:text-brand-yellow/60">
                <MapPin className="w-4 h-4" />
                Lagos, Nigeria
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-bold text-brand-green dark:text-brand-yellow mb-4">
              Navigation
            </h3>
            <ul className="space-y-3">
              {footerLinks.navigation.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-brand-black/70 dark:text-brand-yellow/70 hover:text-brand-green dark:hover:text-brand-yellow transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Get Involved + Connect */}
          <div>
            <h3 className="font-bold text-brand-green dark:text-brand-yellow mb-4">
              Get Involved
            </h3>
            <ul className="space-y-3 mb-6">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-brand-black/70 dark:text-brand-yellow/70 hover:text-brand-green dark:hover:text-brand-yellow transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="font-bold text-brand-green dark:text-brand-yellow mb-3">
              Connect
            </h3>
            <div className="flex gap-3">
              <a
                href="https://instagram.com/gboyinwa"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-brand-green/10 dark:bg-brand-yellow/10 flex items-center justify-center text-brand-green dark:text-brand-yellow hover:bg-brand-green hover:text-white dark:hover:bg-brand-yellow dark:hover:text-brand-black transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/gboyinwa"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-brand-green/10 dark:bg-brand-yellow/10 flex items-center justify-center text-brand-green dark:text-brand-yellow hover:bg-brand-green hover:text-white dark:hover:bg-brand-yellow dark:hover:text-brand-black transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-brand-green/10 dark:border-brand-yellow/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-brand-black/50 dark:text-brand-yellow/50">
            {currentYear} Gbóyinwá Media LTD. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-green dark:bg-brand-yellow animate-pulse" />
            <span className="text-sm text-brand-black/50 dark:text-brand-yellow/50">
              Made with love in Lagos
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
