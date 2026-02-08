// app/(demo)/layout.tsx
// BM-WIRE: Demo layout with snang.my branding + walkthrough link
// This is a nested layout - root layout provides html/body
'use client';

import { RoleSwitcher } from '@/components/role-switcher';
import { Bell } from 'lucide-react';
import { LanguageProvider } from '@/lib/i18n';
import { LanguageToggle } from '@/components/LanguageToggle';
import { FooterDisclaimer } from '@/components/FooterDisclaimer';
import { DemoBuildWatermark } from '@/components/DemoBuildWatermark';
import { WalkthroughButton } from '@/components/WalkthroughButton';
import Link from 'next/link';

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      {/* P0-5: Global Demo Watermark */}
      <DemoBuildWatermark />

      {/* Global Header — BM-WIRE: snang.my branding */}
      <header className="bg-gradient-to-r from-teal-900 to-teal-800 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo — snang.my (links to landing page) */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center">
              <span className="text-teal-400 font-bold text-xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Snang
              </span>
              <span className="text-amber-400 font-bold text-xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                .
              </span>
              <span className="text-teal-400 font-bold text-xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                my
              </span>
              <span className="text-teal-500 text-xs font-mono ml-2 bg-teal-500/20 px-2 py-0.5 rounded">
                LPPSA
              </span>
            </Link>
          </div>

          {/* Role Switcher — order: Pemaju → Pembeli → Ejen (set in role-switcher component) */}
          <RoleSwitcher />

          {/* Right side: Walkthrough + Language + Notifications */}
          <div className="flex items-center gap-2">
            <WalkthroughButton />
            <LanguageToggle variant="pill" />
            <button className="relative text-slate-400 hover:text-white p-2 rounded-lg hover:bg-teal-700/50 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 bg-slate-100 min-h-screen">
        {children}
      </main>

      {/* Global Footer Disclaimer */}
      <FooterDisclaimer />
    </LanguageProvider>
  );
}
