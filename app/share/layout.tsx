import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shared Document - Gboyinwa',
  description: 'View and download shared documents securely.',
};

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Security headers are set in next.config.js or middleware */}
      {children}
    </>
  );
}
