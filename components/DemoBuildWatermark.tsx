// components/DemoBuildWatermark.tsx
// P0-5: Global Demo Build Watermark for Web UI
'use client';

export function DemoBuildWatermark() {
  return (
    <>
      {/* Top-right floating watermark */}
      <div className="fixed top-16 right-4 z-40 pointer-events-none">
        <div className="bg-amber-500/90 text-white text-xs font-mono px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
          <span className="animate-pulse w-2 h-2 bg-white rounded-full" />
          DEMO BUILD
        </div>
      </div>

      {/* Bottom banner - visible on all pages */}
      <div className="fixed bottom-12 left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-amber-100 border border-amber-300 text-amber-800 text-xs text-center py-1.5 rounded-lg">
            DEMO BUILD — features may be relaxed | Ciri-ciri mungkin dilonggarkan untuk demo
          </div>
        </div>
      </div>
    </>
  );
}

export default DemoBuildWatermark;
