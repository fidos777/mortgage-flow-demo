// components/DemoBuildWatermark.tsx
// P0-5: Global Demo Build Watermark for Web UI
// BM-5: Minor update — amber retained (on-brand accent), logo mark added
'use client';

import { SnangLogo } from '@/components/SnangLogo';

export function DemoBuildWatermark() {
  return (
    <>
      {/* Top-right floating watermark — sole demo indicator (bottom banner removed to avoid
          duplicate with FooterDisclaimer which already occupies the bottom bar) */}
      <div className="fixed top-16 right-4 z-40 pointer-events-none">
        <div className="bg-snang-amber-500/90 text-white text-xs font-mono px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
          <span className="animate-pulse w-2 h-2 bg-white rounded-full" />
          DEMO BUILD
        </div>
      </div>
    </>
  );
}

export default DemoBuildWatermark;
