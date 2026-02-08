// components/DemoBuildWatermark.tsx
// P0-5: Global Demo Build Watermark for Web UI
// BM-5: Minor update — amber retained (on-brand accent), logo mark added
'use client';

import { SnangLogo } from '@/components/SnangLogo';

export function DemoBuildWatermark() {
  return (
    <>
      {/* Top-right floating watermark */}
      <div className="fixed top-16 right-4 z-40 pointer-events-none">
        <div className="bg-snang-amber-500/90 text-white text-xs font-mono px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
          <span className="animate-pulse w-2 h-2 bg-white rounded-full" />
          DEMO BUILD
        </div>
      </div>

      {/* Bottom banner — visible on all pages */}
      <div className="fixed bottom-12 left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-snang-amber-100 border border-snang-amber-300 text-snang-amber-700 text-xs text-center py-1.5 rounded-lg flex items-center justify-center gap-2">
            <span className="font-semibold">DEMO BUILD</span>
            <span>—</span>
            <span>features may be relaxed | Ciri-ciri mungkin dilonggarkan untuk demo</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default DemoBuildWatermark;
