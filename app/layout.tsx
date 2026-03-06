import type { Metadata } from 'next';
import { Quicksand } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { AnimatedBackground } from '@/components/animated-background';

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Gbóyinwá Media | Documentary & Storytelling from Lagos',
    template: '%s | Gbóyinwá Media',
  },
  description: 'Gbóyinwá Media amplifies authentic Nigerian voices through documentary filmmaking. Discover The Gbóyindé Grant, empowering young filmmakers aged 16-35 to tell compelling stories from Lagos.',
  keywords: ['Gbóyinwá', 'documentary', 'Nigerian film', 'Lagos storytelling', 'Gbóyindé Grant', 'young filmmakers', 'Nigerian culture', 'film grant', 'documentary filmmaking'],
  authors: [{ name: 'Gbóyinwá Media' }],
  creator: 'Gbóyinwá Media',
  publisher: 'Gbóyinwá Media',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: 'https://gboyinwa.com',
    siteName: 'Gbóyinwá Media',
    title: 'Gbóyinwá Media | Documentary & Storytelling from Lagos',
    description: 'Amplifying authentic Nigerian voices through documentary filmmaking. The Gbóyindé Grant provides ₦55M funding for young filmmakers to tell compelling stories from Lagos.',
    images: [
      {
        url: 'https://gboyinwa.com/images/logo-full.png',
        width: 1200,
        height: 630,
        alt: 'Gbóyinwá Media - Documentary & Storytelling from Lagos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gbóyinwá Media | Documentary & Storytelling from Lagos',
    description: 'Amplifying authentic Nigerian voices through documentary filmmaking. The Gbóyindé Grant provides ₦55M funding for young filmmakers.',
    images: ['https://gboyinwa.com/images/logo-full.png'],
    creator: '@gboyinwa',
  },
  icons: {
    icon: [
      { url: '/images/logomark.png', type: 'image/png' },
    ],
    shortcut: '/images/logomark.png',
    apple: '/images/logomark.png',
  },
  metadataBase: new URL('https://gboyinwa.com'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${quicksand.variable} font-sans antialiased bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow min-h-screen`}>
        <Providers>
          <AnimatedBackground />
          {children}
        </Providers>
      </body>
    </html>
  );
}
