// app/(demo)/listing/settings/page.tsx
// CR-KP-002 Sprint 1 (A2): Developer Settings Page
// APDL credential management + project settings

'use client';

import { useState } from 'react';
import { ApdlCredentialForm } from '@/components/developer/ApdlCredentialForm';
import { Jenis3GateCard } from '@/components/developer/Jenis3GateCard';
import type { ApdlCredential } from '@/types/cr-kp-002';

export default function SettingsPage() {
  const [apdlCredential, setApdlCredential] = useState<ApdlCredential | null>(null);
  const [activeSection, setActiveSection] = useState<'apdl' | 'jenis3' | 'general'>('apdl');

  const sections = [
    { id: 'apdl' as const, label: 'APDL', icon: '🏗️' },
    { id: 'jenis3' as const, label: 'Jenis 3', icon: '🏡' },
    { id: 'general' as const, label: 'Am', icon: '⚙️' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Tetapan Pemaju</h1>
        <p className="text-sm text-slate-500 mt-1">
          Uruskan kelayakan APDL dan tetapan projek
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              activeSection === s.id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* APDL Section */}
      {activeSection === 'apdl' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-600">ℹ️</span>
              <p className="text-sm text-amber-700">
                Pengesahan APDL diperlukan untuk menguruskan projek Jenis 3 (Dalam Pembinaan).
                Untuk jenis pinjaman lain, APDL tidak diperlukan.
              </p>
            </div>
          </div>

          <ApdlCredentialForm
            onVerified={setApdlCredential}
            existingCredential={apdlCredential}
          />

          {apdlCredential && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h3 className="font-medium text-slate-700 text-sm mb-2">Maklumat APDL</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">No. APDL:</span>
                  <span className="ml-2 text-slate-800 font-medium">{apdlCredential.apdlNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">Syarikat:</span>
                  <span className="ml-2 text-slate-800 font-medium">{apdlCredential.companyName}</span>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>
                  <span className="ml-2 text-emerald-600 font-medium">Aktif</span>
                </div>
                <div>
                  <span className="text-slate-500">Tamat:</span>
                  <span className="ml-2 text-slate-800 font-medium">
                    {new Date(apdlCredential.expiryDate).toLocaleDateString('ms-MY')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Jenis 3 Gate */}
      {activeSection === 'jenis3' && (
        <div className="space-y-6">
          <Jenis3GateCard
            apdlCredential={apdlCredential}
            onRequestApdl={() => setActiveSection('apdl')}
            onProceed={() => {
              // Would navigate to project creation
            }}
          />
        </div>
      )}

      {/* General Settings */}
      {activeSection === 'general' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Maklumat Syarikat</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Syarikat</label>
                <input
                  type="text"
                  defaultValue="EcoWorld Development Bhd"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Emel</label>
                <input
                  type="email"
                  defaultValue="admin@ecoworld.my"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Demo disclaimer */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 text-center">
            <p className="text-sm text-orange-700">
              ⚠ Halaman ini adalah demo sahaja. Tiada data sebenar diproses.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
