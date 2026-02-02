// app/buyer/page.tsx
'use client';

import Link from 'next/link';
import { Zap, FileText, Calendar, ArrowRight } from 'lucide-react';
import { AuthorityDisclaimer } from '@/components/permission-gate';

export default function BuyerDashboard() {
  const actions = [
    {
      id: 'prescan',
      title: 'Imbasan Kesediaan',
      subtitle: 'Pre-Application Readiness Scan',
      description: 'Semak kesediaan anda sebelum memulakan permohonan penuh.',
      icon: Zap,
      color: 'from-orange-500 to-orange-600',
      href: '/buyer/prescan',
      badge: 'Mula Sini',
    },
    {
      id: 'journey',
      title: 'Permohonan Penuh',
      subtitle: 'Document Upload & TAC',
      description: 'Muat naik dokumen rasmi dan pilih slot TAC.',
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      href: '/buyer/journey',
      badge: null,
    },
    {
      id: 'kj',
      title: 'Pengesahan KJ',
      subtitle: 'Ketua Jabatan Verification',
      description: 'Laporkan status pengesahan identiti dari Ketua Jabatan.',
      icon: Calendar,
      color: 'from-amber-500 to-amber-600',
      href: '/buyer/kj-confirm',
      badge: null,
    },
  ];

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Welcome */}
      <div className="text-center mb-8 pt-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
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
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
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
