import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Guppy Strain Ranker',
  description: 'Rank your favorite guppy strains and find your perfect breeding pair',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ backgroundColor: '#030d1a' }}>
        {children}
      </body>
    </html>
  );
}
