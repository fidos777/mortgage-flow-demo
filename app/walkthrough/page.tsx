// app/walkthrough/page.tsx
// BM-WIRE: Fullscreen walkthrough slideshow page
// The Snang_Demo_Walkthrough.html should be in /public/walkthrough.html
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Demo Walkthrough | Snang.my',
  description: 'Walkthrough interaktif demo Snang.my — 32 screenshots, 3 bahagian, 15 minit.',
};

export default function WalkthroughPage() {
  return (
    <div className="fixed inset-0 z-30 bg-[#042F2E]">
      {/* Back button overlay */}
      <div className="absolute top-4 left-4 z-50">
        <Link
          href="/buyer"
          className="flex items-center gap-2 bg-teal-800/90 hover:bg-teal-700 text-teal-300 hover:text-white text-sm font-medium px-4 py-2 rounded-lg backdrop-blur transition-all"
        >
          ← Kembali ke Demo
        </Link>
      </div>

      {/* Embedded walkthrough */}
      <iframe
        src="/walkthrough.html"
        className="w-full h-full border-0"
        title="Snang.my Demo Walkthrough"
        allow="fullscreen"
      />
    </div>
  );
}
