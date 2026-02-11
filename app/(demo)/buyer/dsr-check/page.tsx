// app/buyer/dsr-check/page.tsx
// P1-5: DSR Quick Check - Provable in <30 seconds during demo
// BM-4: Color migration — blue→teal, orange→amber
// S5 B03: Wired to POST /api/readiness for server-side scoring + persistence
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calculator, AlertTriangle, CheckCircle, Info, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

interface Commitment {
  id: string;
  name: string;
  amount: number;
}

interface ServerReadiness {
  band: 'ready' | 'caution' | 'not_ready';
  label: string;
  guidance: string;
  dsr_ratio: number | null;
}

// Map exact RM income to API range string
function toIncomeRange(income: number): string {
  if (income > 8000) return '8001+';
  if (income > 6000) return '6001-8000';
  if (income > 5000) return '5001-6000';
  if (income > 4000) return '4001-5000';
  if (income > 3000) return '3001-4000';
  return '2000-3000';
}

// Map exact DSR percentage to API commitment range string
function toCommitmentRange(dsrPct: number): string {
  if (dsrPct <= 30) return '0-30';
  if (dsrPct <= 40) return '31-40';
  if (dsrPct <= 50) return '41-50';
  return '51+';
}

function DSRQuickCheckInner() {
  const searchParams = useSearchParams();
  const caseId = searchParams.get('case_id');

  const [grossIncome, setGrossIncome] = useState<number>(5000);
  const [commitments, setCommitments] = useState<Commitment[]>([
    { id: '1', name: 'Pinjaman Kereta', amount: 800 },
    { id: '2', name: 'Kad Kredit', amount: 200 },
  ]);
  const [proposedLoan, setProposedLoan] = useState<number>(1500);
  const [showResult, setShowResult] = useState(false);
  const [serverResult, setServerResult] = useState<ServerReadiness | null>(null);
  const [serverError, setServerError] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const totalCommitments = commitments.reduce((sum, c) => sum + c.amount, 0);
  const totalWithProposed = totalCommitments + proposedLoan;
  const dsr = grossIncome > 0 ? (totalWithProposed / grossIncome) * 100 : 0;

  const getDSRBand = (dsr: number) => {
    if (dsr <= 40) return { band: 'SIHAT', color: 'green', label: 'Sihat', desc: 'DSR dalam julat yang baik' };
    if (dsr <= 60) return { band: 'SEDERHANA', color: 'amber', label: 'Sederhana', desc: 'DSR boleh diterima tetapi perlu perhatian' };
    return { band: 'TINGGI', color: 'red', label: 'Tinggi', desc: 'DSR melebihi had biasa, perlu semakan lanjut' };
  };

  const dsrInfo = getDSRBand(dsr);

  // S5 B03: POST to readiness API for server-side scoring
  const handleCalculate = async () => {
    setShowResult(true);
    setServerError(false);
    setServerResult(null);
    setCalculating(true);

    try {
      const res = await fetch('/api/readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId || undefined,
          employment_type: 'tetap',     // Default for DSR quick check
          service_years: '3-4',          // Default mid-range
          age_range: 'below35',          // Default
          income_range: toIncomeRange(grossIncome),
          commitment_range: toCommitmentRange(dsr),
          existing_loan: commitments.length > 0 ? 'yes' : 'no',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setServerResult(data.data);
        }
      }
    } catch {
      setServerError(true);
    } finally {
      setCalculating(false);
    }

    // S5: Log proof event (fire-and-forget)
    fetch('/api/proof-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'DSR_CHECK_COMPLETED',
        case_id: caseId || undefined,
        actor_type: 'buyer',
        event_category: 'BUYER',
        metadata: {
          income_range: toIncomeRange(grossIncome),
          commitment_range: toCommitmentRange(dsr),
          dsr_pct: Math.round(dsr * 10) / 10,
          channel: 'WEB',
        },
      }),
    }).catch(() => {});
  };

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
        {/* S5 B03: Now calls server-side readiness API */}
        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="w-full bg-gradient-to-r from-snang-teal-600 to-snang-teal-700 text-white py-4 rounded-xl font-display font-semibold hover:from-snang-teal-700 hover:to-snang-teal-900 transition-all disabled:opacity-50"
        >
          {calculating ? 'Mengira...' : 'Kira DSR'}
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

          {/* S5 B03: Server Readiness Band */}
          {serverResult && (
            <div className={`rounded-xl p-4 mb-4 ${
              serverResult.band === 'ready' ? 'bg-green-50 border border-green-200' :
              serverResult.band === 'caution' ? 'bg-amber-50 border border-amber-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                <Shield className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  serverResult.band === 'ready' ? 'text-green-600' :
                  serverResult.band === 'caution' ? 'text-amber-600' : 'text-red-600'
                }`} />
                <div>
                  <p className={`text-sm font-semibold ${
                    serverResult.band === 'ready' ? 'text-green-800' :
                    serverResult.band === 'caution' ? 'text-amber-800' : 'text-red-800'
                  }`}>
                    Penilaian Kesediaan: {serverResult.label}
                  </p>
                  <p className={`text-xs mt-1 ${
                    serverResult.band === 'ready' ? 'text-green-700' :
                    serverResult.band === 'caution' ? 'text-amber-700' : 'text-red-700'
                  }`}>
                    {serverResult.guidance}
                  </p>
                </div>
              </div>
            </div>
          )}

          {serverError && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-amber-700 text-center">
                Penilaian server tidak dapat dihubungi. DSR tempatan ditunjukkan di atas.
              </p>
            </div>
          )}

          {/* Final Disclaimer */}
          <div className="bg-slate-100 rounded-lg p-3 text-xs text-slate-600 text-center">
            <strong>Isyarat kesediaan sahaja.</strong> Keputusan akhir oleh LPPSA berdasarkan dokumen rasmi.
          </div>
        </div>
      )}
    </div>
  );
}

// Suspense wrapper for useSearchParams (Next.js 16 requirement)
export default function DSRQuickCheckPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse bg-slate-200 h-64 rounded-2xl" />
      </div>
    }>
      <DSRQuickCheckInner />
    </Suspense>
  );
}
