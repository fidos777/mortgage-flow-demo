// components/FooterDisclaimer.tsx
// P0-6: Updated to v3.6.1 (was v3.4)
'use client';

import { useTranslation } from '@/lib/i18n';

export function FooterDisclaimer() {
  const { t } = useTranslation();

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 z-40">
      <p className="text-xs text-center text-slate-400 max-w-6xl mx-auto">
        {/* CHANGED: v3.4 → v3.6.1 */}
        Mortgage Flow Engine Demo v3.6.1 • {t('common.footer.disclaimer')}
      </p>
    </footer>
  );
}

export default FooterDisclaimer;
