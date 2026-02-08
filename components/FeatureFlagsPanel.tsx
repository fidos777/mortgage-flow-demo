// components/FeatureFlagsPanel.tsx
// P3-4: Feature Flags Admin Panel
// Allows toggling feature flags for demo/pilot modes

'use client';

import { useState, useEffect } from 'react';
import {
  useFeatureFlags,
  FeatureFlagKey,
  FlagPreset,
  FLAG_PRESETS,
} from '@/lib/services/feature-flags';

const FLAG_LABELS: Record<FeatureFlagKey, { label: string; description: string }> = {
  DEMO_MODE: {
    label: 'Mod Demo',
    description: 'Mod demo aktif - validasi dilonggarkan untuk demonstrasi',
  },
  OTP_ENFORCED: {
    label: 'OTP Wajib',
    description: 'Pembeli mesti sahkan OTP untuk akses pautan selamat',
  },
  DOC_STRICT_MODE: {
    label: 'Mod Dokumen Ketat',
    description: 'Tolak penghantaran jika dokumen tidak lengkap',
  },
  TELEMETRY_ENABLED: {
    label: 'Telemetri Aktif',
    description: 'Hantar peristiwa funnel ke sistem analitik',
  },
  LINK_EXPIRY_ENABLED: {
    label: 'Pautan Tamat Tempoh',
    description: 'Pautan jemputan tamat selepas 7 hari',
  },
  PROOF_STRICT_MODE: {
    label: 'Mod Bukti Ketat',
    description: 'Semua metadata diperlukan untuk log bukti',
  },
  // Sprint 0: PDPA Compliance Flags
  PDPA_GATE_ENABLED: {
    label: 'Gerbang PDPA',
    description: 'Aktifkan gerbang persetujuan PDPA sebelum pengumpulan data',
  },
  PDPA_STRICT_MODE: {
    label: 'Mod PDPA Ketat',
    description: 'Sekat semua operasi tanpa persetujuan PDPA_BASIC',
  },
  PDPA_BREACH_SCAFFOLD: {
    label: 'Scaffold Pelanggaran',
    description: 'Aktifkan log insiden pelanggaran (persediaan Fasa 2)',
  },
};

const PRESET_LABELS: Record<FlagPreset, { label: string; description: string }> = {
  demo: {
    label: 'Demo',
    description: 'Tetapan untuk demonstrasi kepada rakan kongsi',
  },
  pilot: {
    label: 'Pilot',
    description: 'Tetapan untuk ujian pilot dengan pengguna sebenar',
  },
  production: {
    label: 'Pengeluaran',
    description: 'Tetapan untuk penggunaan pengeluaran penuh',
  },
};

export function FeatureFlagsPanel() {
  const { getAllFlags, setFlag, applyPreset, getCurrentPreset } = useFeatureFlags();
  const [flags, setFlags] = useState<Record<FeatureFlagKey, boolean>>({} as Record<FeatureFlagKey, boolean>);
  const [currentPreset, setCurrentPreset] = useState<FlagPreset | 'custom'>('demo');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setFlags(getAllFlags());
    setCurrentPreset(getCurrentPreset());
  }, [getAllFlags, getCurrentPreset]);

  const handleToggle = (flag: FeatureFlagKey) => {
    const newValue = !flags[flag];
    setFlag(flag, newValue);
    setFlags(getAllFlags());
    setCurrentPreset(getCurrentPreset());
  };

  const handlePresetChange = (preset: FlagPreset) => {
    applyPreset(preset);
    setFlags(getAllFlags());
    setCurrentPreset(preset);
  };

  if (!mounted) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          🎛️ Bendera Ciri (Feature Flags)
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Kawal tingkah laku sistem untuk mod demo/pilot/pengeluaran
        </p>
      </div>

      {/* Preset Selector */}
      <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preset Pantas
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRESET_LABELS) as FlagPreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetChange(preset)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPreset === preset
                  ? 'bg-snang-teal-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {PRESET_LABELS[preset].label}
            </button>
          ))}
          {currentPreset === 'custom' && (
            <span className="px-4 py-2 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-800">
              Custom
            </span>
          )}
        </div>
        {currentPreset !== 'custom' && (
          <p className="text-xs text-gray-600 mt-2">
            {PRESET_LABELS[currentPreset as FlagPreset]?.description}
          </p>
        )}
      </div>

      {/* Individual Flags */}
      <div className="divide-y divide-gray-100">
        {(Object.keys(FLAG_LABELS) as FeatureFlagKey[]).map((flag) => (
          <div
            key={flag}
            className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {FLAG_LABELS[flag].label}
                </span>
                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                  {flag}
                </code>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {FLAG_LABELS[flag].description}
              </p>
            </div>
            <button
              onClick={() => handleToggle(flag)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                flags[flag] ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  flags[flag] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Current State Summary */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Status semasa:</span>{' '}
            {flags.DEMO_MODE ? (
              <span className="text-amber-600">🎭 Mod Demo</span>
            ) : flags.OTP_ENFORCED ? (
              <span className="text-green-600">🔒 Mod Pengeluaran</span>
            ) : (
              <span className="text-snang-teal-600">🧪 Mod Pilot</span>
            )}
          </div>
          <button
            onClick={() => {
              const json = JSON.stringify(flags, null, 2);
              navigator.clipboard.writeText(json);
            }}
            className="text-sm text-snang-teal-600 hover:text-snang-teal-700"
          >
            📋 Salin JSON
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeatureFlagsPanel;
