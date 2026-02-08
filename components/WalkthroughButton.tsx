// components/WalkthroughButton.tsx
// BM-WIRE: Links demo app header to the slideshow walkthrough
'use client';

import { Play } from 'lucide-react';
import Link from 'next/link';

export function WalkthroughButton() {
  return (
    <Link
      href="/walkthrough"
      className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-teal-300 hover:text-white bg-teal-700/50 hover:bg-teal-700 px-3 py-1.5 rounded-lg transition-all"
      title="Lihat Demo Walkthrough"
    >
      <Play className="w-3 h-3" />
      <span>Walkthrough</span>
    </Link>
  );
}

export default WalkthroughButton;
