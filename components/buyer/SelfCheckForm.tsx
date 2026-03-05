// components/buyer/SelfCheckForm.tsx
// CR-KP-002 Sprint 1 (A4): Self-Check (PreScan) Form
// Buyer enters basic financial info for DSR pre-check
// DEC-001: Readiness band only, NO approval probability

'use client';

import { useState } from 'react';
import type { LoanTypeCode } from '@/lib/config/loan-types';
import type { SelfCheckInput, SelfCheckResult } from '@/types/cr-kp-002';
import type { KategoriPinjaman } from '@/types/case';
import { calculateSelfCheck } from '@/lib/services/cr-kp-002-services';
import { LoanTypeSelector } from '@/components/LoanTypeBadge';

export interface SelfCheckFormProps {
  onResult?: (result: SelfCheckResult, input: SelfCheckInput) => void;
  projectPrice?: number;
}

export function SelfCheckForm({ onResult, projectPrice }: SelfCheckFormProps) {
  const [gajiPokok, setGajiPokok] = useState('');
  const [elaunTetap, setElaunTetap] = useState('');
  const [potonganWajib, setPotonganWajib] = useState('');
  const [komitmenBulanan, setKomitmenBulanan] = useState('');
  const [hargaHartanah, setHargaHartanah] = useState(projectPrice?.toString() || '');
  const [tempohPinjaman, setTempohPinjaman] = useState('30');
  const [loanTypeCode, setLoanTypeCode] = useState<LoanTypeCode | undefined>(1);
  const [kategoriPinjaman, setKategoriPinjaman] = useState<KategoriPinjaman>('HARTA PERTAMA');
  const [umur, setUmur] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const handleCheck = () => {
    const errs: string[] = [];
    if (!gajiPokok || Number(gajiPokok) <= 0) errs.push('Gaji pokok diperlukan');
    if (!hargaHartanah || Number(hargaHartanah) <= 0) errs.push('Harga hartanah diperlukan');
    if (!tempohPinjaman || Number(tempohPinjaman) <= 0) errs.push('Tempoh pinjaman diperlukan');
    if (!umur || Number(umur) < 18) errs.push('Umur mestilah 18 tahun ke atas');
    if (!loanTypeCode) errs.push('Sila pilih jenis pinjaman');

    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    setErrors([]);

    const input: SelfCheckInput = {
      gajiPokok: Number(gajiPokok),
      elaunTetap: Number(elaunTetap) || 0,
      potonganWajib: Number(potonganWajib) || 0,
      komitmenBulanan: Number(komitmenBulanan) || 0,
      hargaHartanah: Number(hargaHartanah),
      tempohPinjaman: Number(tempohPinjaman),
      loanTypeCode: loanTypeCode!,
      kategoriPinjaman,
      umur: Number(umur),
    };

    const result = calculateSelfCheck(input);
    onResult?.(result, input);
  };

  const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500';

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="bg-teal-50 border-b border-teal-100 px-5 py-4">
        <h2 className="font-semibold text-slate-800">🔍 Semakan Awal DSR</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Semak kelayakan awal sebelum memohon pinjaman LPPSA
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* DEC-001 Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            ℹ️ Semakan ini memberi isyarat kesediaan sahaja. Ia <strong>bukan</strong> kelulusan
            atau jaminan kelulusan pinjaman. Keputusan muktamad adalah dari LPPSA.
          </p>
        </div>

        {/* Income section */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-700">Pendapatan</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Gaji Hakiki (RM) <span className="text-red-500">*</span>
              </label>
              <input type="number" value={gajiPokok} onChange={e => setGajiPokok(e.target.value)}
                placeholder="5000" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Elaun Tetap (RM)</label>
              <input type="number" value={elaunTetap} onChange={e => setElaunTetap(e.target.value)}
                placeholder="500" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Potongan Wajib (RM)</label>
              <input type="number" value={potonganWajib} onChange={e => setPotonganWajib(e.target.value)}
                placeholder="550" className={inputClass} />
              <p className="text-xs text-slate-400 mt-0.5">KWSP, PERKESO, cukai</p>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Komitmen Bulanan (RM)</label>
              <input type="number" value={komitmenBulanan} onChange={e => setKomitmenBulanan(e.target.value)}
                placeholder="800" className={inputClass} />
              <p className="text-xs text-slate-400 mt-0.5">Kereta, pinjaman peribadi, dll</p>
            </div>
          </div>
        </div>

        {/* Property section */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-700">Hartanah & Pinjaman</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Harga Hartanah (RM) <span className="text-red-500">*</span>
              </label>
              <input type="number" value={hargaHartanah} onChange={e => setHargaHartanah(e.target.value)}
                placeholder="350000" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Tempoh Pinjaman (Tahun) <span className="text-red-500">*</span>
              </label>
              <input type="number" value={tempohPinjaman} onChange={e => setTempohPinjaman(e.target.value)}
                min="1" max="35" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Umur (Tahun) <span className="text-red-500">*</span>
              </label>
              <input type="number" value={umur} onChange={e => setUmur(e.target.value)}
                placeholder="30" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Kategori Pinjaman</label>
              <select
                value={kategoriPinjaman}
                onChange={e => setKategoriPinjaman(e.target.value as KategoriPinjaman)}
                className={inputClass}
              >
                <option value="HARTA PERTAMA">Harta Pertama (DSR 60%)</option>
                <option value="HARTA KEDUA">Harta Kedua (DSR 50%)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loan type */}
        <LoanTypeSelector value={loanTypeCode} onChange={setLoanTypeCode} demoOnly={true} />

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((err, i) => <li key={i}>⚠ {err}</li>)}
            </ul>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleCheck}
          className="w-full py-3 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition"
        >
          🔍 Semak Kelayakan
        </button>

        <p className="text-xs text-slate-400 text-center">
          Data anda dilindungi oleh PDPA 2010. Tiada data dihantar ke mana-mana pihak.
        </p>
      </div>
    </div>
  );
}

export default SelfCheckForm;
