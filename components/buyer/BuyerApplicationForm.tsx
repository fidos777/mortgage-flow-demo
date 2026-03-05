// components/buyer/BuyerApplicationForm.tsx
// CR-KP-002 Sprint 1 (A4): Buyer Application Form
// Multi-section form following LPPSA Borang Permohonan structure
// DEC-001: No approval prediction fields

'use client';

import { useState } from 'react';
import type { BuyerApplicationData } from '@/types/cr-kp-002';
import type { LoanTypeCode } from '@/lib/config/loan-types';
import type { KategoriPinjaman, Gelaran, StructuredAddress } from '@/types/case';
import { LoanTypeSelector } from '@/components/LoanTypeBadge';

export interface BuyerApplicationFormProps {
  initialData?: Partial<BuyerApplicationData>;
  onSave?: (data: BuyerApplicationData) => void;
  onSubmit?: (data: BuyerApplicationData) => void;
}

type Section = 'A' | 'B' | 'C' | 'D' | 'E';

const SECTIONS: { id: Section; title: string; icon: string }[] = [
  { id: 'A', title: 'Pemohon', icon: '👤' },
  { id: 'B', title: 'Alamat', icon: '🏠' },
  { id: 'C', title: 'Pekerjaan', icon: '💼' },
  { id: 'D', title: 'Pendapatan', icon: '💰' },
  { id: 'E', title: 'Pinjaman', icon: '📋' },
];

const GELARAN_OPTIONS: Gelaran[] = ['Encik', 'Puan', 'Cik', 'Datuk', 'Datin', 'Tan Sri', 'Puan Sri', 'Lain-lain'];

export function BuyerApplicationForm({
  initialData,
  onSave,
  onSubmit,
}: BuyerApplicationFormProps) {
  const [activeSection, setActiveSection] = useState<Section>('A');
  const [data, setData] = useState<Partial<BuyerApplicationData>>({
    completedSections: [],
    ...initialData,
  });

  const update = (field: string, value: unknown) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updateAddress = (field: 'alamatSuratMenyurat' | 'alamatTetap', key: keyof StructuredAddress, value: string) => {
    setData(prev => ({
      ...prev,
      [field]: { ...(prev[field] || {}), [key]: value },
    }));
  };

  const markSectionComplete = (section: Section) => {
    const completed = [...(data.completedSections || [])];
    if (!completed.includes(section)) {
      completed.push(section);
      setData(prev => ({ ...prev, completedSections: completed }));
    }
  };

  const isSectionComplete = (section: Section) =>
    data.completedSections?.includes(section) || false;

  const completionPct = Math.round(
    ((data.completedSections?.length || 0) / SECTIONS.length) * 100
  );

  const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500';

  const renderAddressFields = (field: 'alamatSuratMenyurat' | 'alamatTetap', label: string) => (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-slate-500 uppercase">{label}</h4>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-slate-500 mb-0.5">No Rumah / Lot</label>
          <input type="text" className={inputClass} value={data[field]?.noRumah || ''}
            onChange={e => updateAddress(field, 'noRumah', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-0.5">Nama Jalan</label>
          <input type="text" className={inputClass} value={data[field]?.namaJalan || ''}
            onChange={e => updateAddress(field, 'namaJalan', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-slate-500 mb-0.5">Taman / Kampung</label>
          <input type="text" className={inputClass} value={data[field]?.taman || ''}
            onChange={e => updateAddress(field, 'taman', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-0.5">Bandar</label>
          <input type="text" className={inputClass} value={data[field]?.bandar || ''}
            onChange={e => updateAddress(field, 'bandar', e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-slate-500 mb-0.5">Poskod</label>
          <input type="text" className={inputClass} maxLength={5} value={data[field]?.poskod || ''}
            onChange={e => updateAddress(field, 'poskod', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-0.5">Negeri</label>
          <input type="text" className={inputClass} value={data[field]?.negeri || ''}
            onChange={e => updateAddress(field, 'negeri', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-0.5">Daerah</label>
          <input type="text" className={inputClass} value={data[field]?.daerah || ''}
            onChange={e => updateAddress(field, 'daerah', e.target.value)} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-teal-50 border-b border-teal-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">Borang Permohonan</h2>
            <p className="text-sm text-slate-500 mt-0.5">Mengikut format LPPSA rasmi</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-teal-700">{completionPct}%</span>
            <div className="w-24 h-1.5 bg-teal-200 rounded-full mt-1">
              <div className="h-full bg-teal-600 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-slate-100">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex-1 py-3 text-xs font-medium text-center transition relative ${
              activeSection === s.id
                ? 'text-teal-700 bg-teal-50/50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="block">{s.icon}</span>
            <span>{s.title}</span>
            {isSectionComplete(s.id) && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
            )}
            {activeSection === s.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600" />
            )}
          </button>
        ))}
      </div>

      {/* Section content */}
      <div className="p-5 space-y-4">
        {/* Section A: Pemohon */}
        {activeSection === 'A' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Gelaran</label>
              <select value={data.gelaran || ''} onChange={e => update('gelaran', e.target.value)} className={inputClass}>
                <option value="">Pilih gelaran</option>
                {GELARAN_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nama Penuh <span className="text-red-500">*</span></label>
              <input type="text" value={data.nama || ''} onChange={e => update('nama', e.target.value)}
                placeholder="Seperti dalam kad pengenalan" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">No KP Baru <span className="text-red-500">*</span></label>
                <input type="text" value={data.icBaru || ''} onChange={e => update('icBaru', e.target.value)}
                  placeholder="YYMMDD-SS-NNNN" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">No KP Lama (jika ada)</label>
                <input type="text" value={data.icLama || ''} onChange={e => update('icLama', e.target.value)}
                  className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Jantina</label>
                <select value={data.jantina || ''} onChange={e => update('jantina', e.target.value)} className={inputClass}>
                  <option value="">Pilih</option>
                  <option value="LELAKI">Lelaki</option>
                  <option value="PEREMPUAN">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Status Perkahwinan</label>
                <select value={data.statusPerkahwinan || ''} onChange={e => update('statusPerkahwinan', e.target.value)} className={inputClass}>
                  <option value="">Pilih</option>
                  <option value="BUJANG">Bujang</option>
                  <option value="BERKAHWIN">Berkahwin</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Section B: Alamat */}
        {activeSection === 'B' && (
          <div className="space-y-4">
            {renderAddressFields('alamatSuratMenyurat', 'Alamat Surat-Menyurat')}
            <div className="border-t border-slate-100 pt-3">
              {renderAddressFields('alamatTetap', 'Alamat Tetap')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">No Telefon</label>
                <input type="tel" value={data.telefon || ''} onChange={e => update('telefon', e.target.value)}
                  placeholder="012-345 6789" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Emel</label>
                <input type="email" value={data.email || ''} onChange={e => update('email', e.target.value)}
                  className={inputClass} />
              </div>
            </div>
          </div>
        )}

        {/* Section C: Pekerjaan */}
        {activeSection === 'C' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nama Jawatan</label>
              <input type="text" value={data.namaJawatan || ''} onChange={e => update('namaJawatan', e.target.value)}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nama Majikan</label>
              <input type="text" value={data.namaMajikan || ''} onChange={e => update('namaMajikan', e.target.value)}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Alamat Majikan</label>
              <input type="text" value={data.alamatMajikan || ''} onChange={e => update('alamatMajikan', e.target.value)}
                className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Gred</label>
                <input type="text" value={data.gred || ''} onChange={e => update('gred', e.target.value)}
                  placeholder="Cth: DG41" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tarikh Lantikan</label>
                <input type="date" value={data.tarikhLantikan || ''} onChange={e => update('tarikhLantikan', e.target.value)}
                  className={inputClass} />
              </div>
            </div>
          </div>
        )}

        {/* Section D: Pendapatan */}
        {activeSection === 'D' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Gaji Hakiki (RM)</label>
              <input type="number" value={data.gajiPokok || ''} onChange={e => update('gajiPokok', Number(e.target.value))}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Elaun Tetap (RM)</label>
              <input type="number" value={data.elaunTetap || ''} onChange={e => update('elaunTetap', Number(e.target.value))}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Pendapatan Lain (RM)</label>
              <input type="number" value={data.pendapatanLain || ''} onChange={e => update('pendapatanLain', Number(e.target.value))}
                className={inputClass} />
            </div>
          </div>
        )}

        {/* Section E: Pinjaman */}
        {activeSection === 'E' && (
          <div className="space-y-3">
            <LoanTypeSelector
              value={data.loanTypeCode}
              onChange={(code) => update('loanTypeCode', code)}
              demoOnly={true}
            />
            <div>
              <label className="block text-xs text-slate-500 mb-1">Kategori Pinjaman</label>
              <select value={data.kategoriPinjaman || ''} onChange={e => update('kategoriPinjaman', e.target.value)} className={inputClass}>
                <option value="">Pilih</option>
                <option value="HARTA PERTAMA">Harta Pertama</option>
                <option value="HARTA KEDUA">Harta Kedua</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Jumlah Pinjaman (RM)</label>
                <input type="number" value={data.jumlahPinjaman || ''} onChange={e => update('jumlahPinjaman', Number(e.target.value))}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tempoh (Tahun)</label>
                <input type="number" value={data.tempohPinjaman || ''} onChange={e => update('tempohPinjaman', Number(e.target.value))}
                  min="1" max="35" className={inputClass} />
              </div>
            </div>
          </div>
        )}

        {/* Section complete + navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            onClick={() => markSectionComplete(activeSection)}
            disabled={isSectionComplete(activeSection)}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition ${
              isSectionComplete(activeSection)
                ? 'bg-emerald-50 text-emerald-600 cursor-default'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isSectionComplete(activeSection) ? '✓ Lengkap' : 'Tandakan Lengkap'}
          </button>

          <div className="flex gap-2">
            {activeSection !== 'A' && (
              <button
                onClick={() => {
                  const idx = SECTIONS.findIndex(s => s.id === activeSection);
                  if (idx > 0) setActiveSection(SECTIONS[idx - 1].id);
                }}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                ← Sebelum
              </button>
            )}
            {activeSection !== 'E' ? (
              <button
                onClick={() => {
                  const idx = SECTIONS.findIndex(s => s.id === activeSection);
                  if (idx < SECTIONS.length - 1) setActiveSection(SECTIONS[idx + 1].id);
                }}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700"
              >
                Seterusnya →
              </button>
            ) : (
              <button
                onClick={() => onSave?.(data as BuyerApplicationData)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700"
              >
                💾 Simpan Draf
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center">
          Data dilindungi PDPA 2010. Tiada data dihantar ke LPPSA secara automatik oleh sistem.
        </p>
      </div>
    </div>
  );
}

export default BuyerApplicationForm;
