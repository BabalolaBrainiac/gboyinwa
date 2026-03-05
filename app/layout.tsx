import type { Metadata } from 'next';
import { Quicksand } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Gbóyinwá',
  description: 'Gbóyinwá Media – documentary and storytelling',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${quicksand.variable} font-sans antialiased bg-white dark:bg-brand-black text-brand-black dark:text-brand-yellow min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
