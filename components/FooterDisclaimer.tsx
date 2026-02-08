// components/FooterDisclaimer.tsx
// BM-2: Updated footer — snang.my primary brand, Qontrek engine attribution
// P0-6: PRD badge v3.6.1 retained
'use client';

import { useTranslation } from '@/lib/i18n';
import { SnangLogo } from '@/components/SnangLogo';

export function FooterDisclaimer() {
  const { t } = useTranslation();

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 z-40">
      <div className="max-w-6xl mx-auto text-center">
        {/* Primary line: snang.my + disclaimer */}
        <div className="flex items-center justify-center gap-2 mb-0.5">
          <SnangLogo size="sm" />
          <span className="text-xs text-slate-300">·</span>
          <p className="text-xs text-slate-400">
            {t('common.footer.disclaimer')}
          </p>
        </div>
        {/* Secondary line: engine attribution */}
        <p className="text-[10px] text-slate-300">
          Powered by Qontrek Authority Engine · PRD v3.6.1 aligned
        </p>
      </div>
    </footer>
  );
}

export default FooterDisclaimer;
