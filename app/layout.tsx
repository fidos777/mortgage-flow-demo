// app/layout.tsx
// P0-5: Added DemoBuildWatermark component
import type { Metadata } from 'next';
import './globals.css';
import { RoleSwitcher } from '@/components/role-switcher';
import { Bell } from 'lucide-react';
import { LanguageProvider } from '@/lib/i18n';
import { LanguageToggle } from '@/components/LanguageToggle';
import { FooterDisclaimer } from '@/components/FooterDisclaimer';
import { DemoBuildWatermark } from '@/components/DemoBuildWatermark'; // NEW

export const metadata: Metadata = {
  title: 'Mortgage Flow Engine | Qontrek Demo',
  description: 'LPPSA Workflow Automation Platform - Three Powers Demo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms">
      <body className="min-h-screen bg-slate-100">
        <LanguageProvider>
          {/* P0-5: Global Demo Watermark */}
          <DemoBuildWatermark />

          {/* Global Header */}
          <header className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <span className="text-white font-bold text-xl">Qontrek</span>
                  <span className="text-orange-400 text-xs font-mono ml-2 bg-orange-500/20 px-2 py-0.5 rounded">
                    LPPSA
                  </span>
                </div>
              </div>

              {/* Role Switcher */}
              <RoleSwitcher />

              {/* Language Toggle + Notifications */}
              <div className="flex items-center gap-2">
                <LanguageToggle variant="pill" />
                <button className="relative text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="pb-20">
            {children}
          </main>

          {/* Global Footer Disclaimer */}
          <FooterDisclaimer />
        </LanguageProvider>
      </body>
    </html>
  );
}
