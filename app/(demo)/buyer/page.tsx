// app/buyer/page.tsx
'use client';

import Link from 'next/link';
import { Zap, FileText, Calendar, ArrowRight, Shield, Check } from 'lucide-react';
import { AuthorityDisclaimer } from '@/components/permission-gate';
import { useConsentGuard } from '@/lib/hooks/useConsentGuard';
import { ConsentSummary } from '@/components/consent';
import { format } from 'date-fns';
import { ms } from 'date-fns/locale';

// Demo fallback date - used when no real date provided
// Fixes the blank "-" issue in PDPA display
const DEMO_CONSENT_DATE = new Date('2026-02-01T10:30:00+08:00');

export default function BuyerDashboard() {
  // PDPA consent status check (non-redirecting)
  const {
    isChecking: isCheckingConsent,
    hasConsent: hasPdpaConsent,
    isGateEnabled,
    consentedTypes,
    consentedAt,
  } = useConsentGuard({
    redirectOnMissing: false, // Don't auto-redirect from dashboard
    skip: false,
  });

  // CR-008: Doc-First Flow - Upload is now primary action
  const actions = [
    {
      id: 'upload',
      title: 'Upload Dokumen',
      subtitle: 'Document Upload (CR-008)',
      description: 'Muat naik dokumen anda untuk memulakan proses permohonan.',
      icon: FileText,
      color: 'from-snang-teal-600 to-snang-teal-700',
      // Route through consent gate - NEW CR-008 default flow
      href: isGateEnabled ? '/buyer/start?redirect=/buyer/upload' : '/buyer/upload',
      badge: 'Mula Sini',
    },
    {
      id: 'prescan',
      title: 'Imbasan Kesediaan',
      subtitle: 'Pre-Application Readiness Scan (Optional)',
      description: 'Semak kesediaan anda dahulu sebelum upload dokumen.',
      icon: Zap,
      color: 'from-purple-600 to-purple-700',
      // Route through consent gate - now optional/secondary
      href: isGateEnabled ? '/buyer/start?redirect=/buyer/prescan' : '/buyer/prescan',
      badge: 'Pilihan',
    },
    {
      id: 'journey',
      title: 'Permohonan Penuh',
      subtitle: 'Document Upload & TAC',
      description: 'Muat naik dokumen rasmi dan pilih slot TAC.',
      icon: Calendar,
      color: 'from-amber-600 to-amber-700',
      href: '/buyer/journey',
      badge: null,
    },
    {
      id: 'kj-confirm',
      title: 'Pengesahan KJ',
      subtitle: 'Ketua Jabatan Verification',
      description: 'Laporkan status pengesahan identiti dari Ketua Jabatan.',
      icon: Shield,
      color: 'from-orange-600 to-orange-700',
      href: '/buyer/kj-confirm',
      badge: null,
    },
  ];

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Welcome */}
      <div className="text-center mb-8 pt-4">
        <div className="w-16 h-16 bg-gradient-to-br from-snang-teal-600 to-snang-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-snang-teal-500/30">
          <span className="text-3xl">👤</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Portal Pembeli</h1>
        <p className="text-slate-500 text-sm">Selamat datang ke Mortgage Flow Engine</p>
      </div>

      {/* Property Context */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6 text-white">
        <p className="text-xs text-slate-400 mb-1">Hartanah yang diminati:</p>
        <p className="font-semibold">Residensi Harmoni</p>
        <p className="text-sm text-slate-300">Unit A-12-03 • RM 450,000</p>
        <p className="text-xs text-slate-400 mt-1">Apartment (Subsale) • Kajang, Selangor</p>
      </div>

      {/* PDPA Consent Status - Sprint 0 CR-010 */}
      {isGateEnabled && (
        <div className={`rounded-xl p-4 mb-6 border-2 ${
          hasPdpaConsent
            ? 'bg-teal-50 border-teal-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              hasPdpaConsent ? 'bg-teal-500' : 'bg-amber-500'
            }`}>
              {hasPdpaConsent ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <Shield className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <p className={`font-semibold ${hasPdpaConsent ? 'text-teal-800' : 'text-amber-800'}`}>
                {hasPdpaConsent ? 'Persetujuan PDPA Diberikan' : 'Persetujuan PDPA Diperlukan'}
              </p>
              <p className={`text-xs ${hasPdpaConsent ? 'text-teal-600' : 'text-amber-600'}`}>
                {hasPdpaConsent
                  ? `Diberikan pada ${format(consentedAt ? new Date(consentedAt) : DEMO_CONSENT_DATE, 'd MMM yyyy, HH:mm', { locale: ms })}`
                  : 'Sila berikan persetujuan sebelum meneruskan'
                }
              </p>
            </div>
          </div>

          {hasPdpaConsent && consentedTypes.length > 0 && (
            <ConsentSummary
              consents={consentedTypes.map(type => ({ type, granted: true, grantedAt: consentedAt || undefined }))}
              locale="bm"
              compact={true}
              showTimestamps={false}
            />
          )}

          {!hasPdpaConsent && (
            <Link
              href="/buyer/start"
              className="mt-3 block w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-2.5 rounded-lg font-semibold text-center text-sm shadow-lg shadow-teal-500/30 hover:shadow-xl transition-all"
            >
              Berikan Persetujuan PDPA
            </Link>
          )}
        </div>
      )}

      {/* Action Cards */}
      <div className="space-y-4 mb-8">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.id}
              href={action.href}
              className="block bg-white rounded-xl border-2 border-slate-100 hover:border-slate-200 p-4 transition-all hover:shadow-lg group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800">{action.title}</h3>
                    {action.badge && (
                      <span className="text-xs bg-snang-teal-100 text-snang-teal-600 px-2 py-0.5 rounded-full font-medium">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono mb-1">{action.subtitle}</p>
                  <p className="text-sm text-slate-600">{action.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all mt-3" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* What Buyer CAN See */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <h4 className="font-semibold text-blue-800 text-sm mb-2">✓ Apa yang anda boleh lihat:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Status kes anda</li>
          <li>• Dokumen yang dimuat naik</li>
          <li>• Timeline dan langkah seterusnya</li>
          <li>• Keputusan isyarat kesediaan</li>
        </ul>
      </div>

      {/* What Buyer CANNOT See */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
        <h4 className="font-semibold text-slate-700 text-sm mb-2">✗ Tidak ditunjukkan kepada pembeli:</h4>
        <ul className="text-xs text-slate-600 space-y-1">
          <li>• Pecahan skor kesediaan</li>
          <li>• Bendera risiko dalaman</li>
          <li>• Pengiraan pendapatan</li>
        </ul>
      </div>

      <AuthorityDisclaimer variant="compact" />
    </div>
  );
}
