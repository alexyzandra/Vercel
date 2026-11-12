import type { Metadata, Viewport } from 'next';
import HideyDots from '@/components/hidey/HideyDots';
import './hidey.css';

export const metadata: Metadata = {
  title: 'Hidey Dots',
  description: 'A hide-and-seek dot game that screens young children for red-green colour blindness',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Stop browsers auto-darkening the page, which would change the test colours.
  colorScheme: 'only light',
  themeColor: '#fdf6e3',
};

export default function Page() {
  return <HideyDots />;
}
