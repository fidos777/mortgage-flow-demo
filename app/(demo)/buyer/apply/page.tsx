// app/(demo)/buyer/apply/page.tsx
// CR-KP-002 Sprint 1 (A4): Buyer Application Page
// Full LPPSA application form for buyers

'use client';

import { useState } from 'react';
import { BuyerApplicationForm } from '@/components/buyer/BuyerApplicationForm';
import type { BuyerApplicationData } from '@/types/cr-kp-002';

export default function ApplyPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = (data: BuyerApplicationData) => {
    // In production, would persist to Supabase
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Permohonan Pinjaman LPPSA</h1>
        <p className="text-sm text-slate-500 mt-1">
          Lengkapkan borang di bawah mengikut maklumat sebenar anda
        </p>
      </div>

      {/* DEC-001 Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6">
        <p className="text-xs text-blue-700">
          ℹ️ Borang ini adalah untuk penyediaan maklumat sahaja. Sistem ini <strong>tidak</strong> menghantar
          permohonan ke LPPSA dan <strong>tidak</strong> membuat sebarang keputusan kelulusan.
        </p>
      </div>

      {/* Save toast */}
      {saved && (
        <div className="fixed top-20 right-6 bg-emerald-500 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium z-50 animate-in slide-in-from-right">
          ✓ Draf disimpan
        </div>
      )}

      {/* Form */}
      <BuyerApplicationForm
        onSave={handleSave}
        onSubmit={handleSave}
      />

      {/* Disclaimer */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 text-center mt-6">
        <p className="text-sm text-orange-700">
          ⚠ Sistem ini untuk rujukan sahaja. Tiada penghantaran atau kelulusan dilakukan oleh sistem.
        </p>
      </div>
    </div>
  );
}
