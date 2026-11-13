// Entry point for the desktop app's page: the same game component the website uses.
import { createRoot } from 'react-dom/client';
import HideyDots from '@/components/hidey/HideyDots';

createRoot(document.getElementById('root')!).render(<HideyDots />);
