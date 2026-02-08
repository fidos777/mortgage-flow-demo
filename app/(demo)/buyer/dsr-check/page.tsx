// app/buyer/dsr-check/page.tsx
// P1-5: DSR Quick Check - Provable in <30 seconds during demo
// BM-4: Color migration — blue→teal, orange→amber
'use client';

import { useState } from 'react';
import { Calculator, AlertTriangle, CheckCircle, Info, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Commitment {
  id: string;
  name: string;
  amount: number;
}

export default function DSRQuickCheckPage() {
  const [grossIncome, setGrossIncome] = useState<number>(5000);
  const [commitments, setCommitments] = useState<Commitment[]>([
    { id: '1', name: 'Pinjaman Kereta', amount: 800 },
    { id: '2', name: 'Kad Kredit', amount: 200 },
  ]);
  const [proposedLoan, setProposedLoan] = useState<number>(1500);
  const [showResult, setShowResult] = useState(false);

  const totalCommitments = commitments.reduce((sum, c) => sum + c.amount, 0);
  const totalWithProposed = totalCommitments + proposedLoan;
  const dsr = grossIncome > 0 ? (totalWithProposed / grossIncome) * 100 : 0;

  const getDSRBand = (dsr: number) => {
    if (dsr <= 40) return { band: 'SIHAT', color: 'green', label: 'Sihat', desc: 'DSR dalam julat yang baik' };
    if (dsr <= 60) return { band: 'SEDERHANA', color: 'amber', label: 'Sederhana', desc: 'DSR boleh diterima tetapi perlu perhatian' };
    return { band: 'TINGGI', color: 'red', label: 'Tinggi', desc: 'DSR melebihi had biasa, perlu semakan lanjut' };
  };

  const dsrInfo = getDSRBand(dsr);

  const addCommitment = () => {
    setCommitments([...commitments, { id: Date.now().toString(), name: '', amount: 0 }]);
  };

  const removeCommitment = (id: string) => {
    setCommitments(commitments.filter(c => c.id !== id));
  };

  const updateCommitment = (id: string, field: 'name' | 'amount', value: string | number) => {
    setCommitments(commitments.map(c =>
      c.id === id ? { ...c, [field]: field === 'amount' ? Number(value) : value } : c
    ));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link href="/buyer" className="inline-flex items-center gap-2 text-slate-600 hover:text-snang-teal-600 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Dashboard Pembeli
      </Link>

      {/* BM-4: Header — blue gradient → teal gradient */}
      <div className="bg-gradient-to-r from-snang-teal-600 to-snang-teal-700 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Kalkulator DSR</h1>
            <p className="text-snang-teal-100 text-sm">Debt Service Ratio Quick Check</p>
          </div>
        </div>
        <p className="text-snang-teal-100 text-sm">
          Kira nisbah khidmat hutang (DSR) untuk menilai kesediaan awal permohonan pinjaman.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">PENAFIAN PENTING</p>
            <p className="text-amber-700 text-sm mt-1">
              Ini adalah <strong>isyarat kesediaan sahaja</strong>, bukan kelulusan pinjaman.
              DSR sebenar akan dikira oleh LPPSA berdasarkan dokumen rasmi.
            </p>
          </div>
        </div>
      </div>

      {/* Calculator Form */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        {/* Gross Income */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Pendapatan Kasar Bulanan (RM)
          </label>
          <input
            type="number"
            value={grossIncome}
            onChange={(e) => setGrossIncome(Number(e.target.value))}
            className="w-full px-4 py-3 border border-slate-300 rounded-snang-input focus:ring-2 focus:ring-snang-teal-500 focus:border-snang-teal-500 text-lg"
            placeholder="5000"
          />
        </div>

        {/* Existing Commitments */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-700">
              Komitmen Sedia Ada
            </label>
            {/* BM-4: blue → teal */}
            <button
              onClick={addCommitment}
              className="text-sm text-snang-teal-600 hover:text-snang-teal-700 font-medium"
            >
              + Tambah
            </button>
          </div>

          <div className="space-y-3">
            {commitments.map((commitment) => (
              <div key={commitment.id} className="flex gap-3">
                <input
                  type="text"
                  value={commitment.name}
                  onChange={(e) => updateCommitment(commitment.id, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-snang-teal-400 focus:border-snang-teal-400"
                  placeholder="Nama komitmen"
                />
                <input
                  type="number"
                  value={commitment.amount}
                  onChange={(e) => updateCommitment(commitment.id, 'amount', e.target.value)}
                  className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-snang-teal-400 focus:border-snang-teal-400"
                  placeholder="RM"
                />
                <button
                  onClick={() => removeCommitment(commitment.id)}
                  className="text-red-500 hover:text-red-700 px-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 text-right text-sm text-slate-600">
            Jumlah Komitmen: <span className="font-semibold">RM {totalCommitments.toLocaleString()}</span>
          </div>
        </div>

        {/* Proposed Loan */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Anggaran Bayaran Bulanan Pinjaman Baru (RM)
          </label>
          <input
            type="number"
            value={proposedLoan}
            onChange={(e) => setProposedLoan(Number(e.target.value))}
            className="w-full px-4 py-3 border border-slate-300 rounded-snang-input focus:ring-2 focus:ring-snang-teal-500 focus:border-snang-teal-500 text-lg"
            placeholder="1500"
          />
        </div>

        {/* BM-4: Calculate Button — blue gradient → teal gradient */}
        <button
          onClick={() => setShowResult(true)}
          className="w-full bg-gradient-to-r from-snang-teal-600 to-snang-teal-700 text-white py-4 rounded-xl font-display font-semibold hover:from-snang-teal-700 hover:to-snang-teal-900 transition-all"
        >
          Kira DSR
        </button>
      </div>

      {/* Result */}
      {showResult && (
        <div className={`bg-white rounded-2xl shadow-lg p-6 border-2 ${
          dsrInfo.color === 'green' ? 'border-green-200' :
          dsrInfo.color === 'amber' ? 'border-amber-200' : 'border-red-200'
        }`}>
          <div className="text-center mb-6">
            <div className="text-6xl font-bold mb-2" style={{
              color: dsrInfo.color === 'green' ? '#16a34a' :
                     dsrInfo.color === 'amber' ? '#d97706' : '#dc2626'
            }}>
              {dsr.toFixed(1)}%
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              dsrInfo.color === 'green' ? 'bg-green-100 text-green-800' :
              dsrInfo.color === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
            }`}>
              {dsrInfo.color === 'green' ? <CheckCircle className="w-4 h-4" /> :
               dsrInfo.color === 'amber' ? <Info className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              DSR {dsrInfo.label}
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <div className="text-sm text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>Pendapatan Kasar:</span>
                <span className="font-semibold">RM {grossIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Komitmen Sedia Ada:</span>
                <span className="font-semibold">RM {totalCommitments.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Pinjaman Baru:</span>
                <span className="font-semibold">RM {proposedLoan.toLocaleString()}</span>
              </div>
              <hr className="border-slate-300" />
              <div className="flex justify-between font-semibold">
                <span>Jumlah Komitmen:</span>
                <span>RM {totalWithProposed.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* DSR Bands Guide */}
          <div className="text-xs text-slate-500 mb-4">
            <div className="font-semibold mb-2">Panduan DSR:</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span>0-40%: SIHAT - Dalam julat yang baik</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                <span>41-60%: SEDERHANA - Perlu perhatian</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span>&gt;60%: TINGGI - Melebihi had biasa</span>
              </div>
            </div>
          </div>

          {/* Final Disclaimer */}
          <div className="bg-slate-100 rounded-lg p-3 text-xs text-slate-600 text-center">
            <strong>Isyarat kesediaan sahaja.</strong> Keputusan akhir oleh LPPSA berdasarkan dokumen rasmi.
          </div>
        </div>
      )}
    </div>
  );
}
