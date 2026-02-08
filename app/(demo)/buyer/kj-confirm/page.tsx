// app/buyer/kj-confirm/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, CheckCircle, Clock, AlertTriangle, ChevronLeft, 
  ChevronRight, Info, User, Building, FileText, Upload, Camera
} from 'lucide-react';
import { AuthorityDisclaimer } from '@/components/permission-gate';
import { useProofLogger } from '@/lib/services/hooks';

export default function KJConfirmPage() {
  const router = useRouter();
  // Use service hook instead of direct store access
  const { logKjStatusReported } = useProofLogger();
  
  const [step, setStep] = useState(0);
  const [kjStatus, setKjStatus] = useState<'pending' | 'signed' | 'issue'>('pending');
  const [kjDate, setKjDate] = useState('');
  const [kjNotes, setKjNotes] = useState('');
  const [hasUpload, setHasUpload] = useState(false);

  const steps = [
    { id: 'info', title: 'Maklumat KJ' },
    { id: 'status', title: 'Status Tandatangan' },
    { id: 'confirm', title: 'Pengesahan' },
  ];

  const handleSubmit = async () => {
    // Log proof event via service hook
    const statusLabel = kjStatus === 'signed' ? 'Ditandatangani' : kjStatus === 'issue' ? 'Ada Isu' : 'Menunggu';
    await logKjStatusReported('C001', statusLabel);
    
    setStep(3); // Success step
  };

  const renderStep = () => {
    switch (step) {
      case 0: // Info
        return (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Pengesahan Ketua Jabatan (KJ)</h2>
              <p className="text-slate-500 text-sm">Fahami proses pengesahan identiti</p>
            </div>

            {/* What is KJ */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-2">Apa itu Pengesahan KJ?</p>
                  <p className="text-amber-700 mb-2">
                    Ketua Jabatan (KJ) anda perlu mengesahkan bahawa anda adalah kakitangan yang sah 
                    di jabatan tersebut. Ini adalah <strong>pengesahan identiti sahaja</strong>, 
                    bukan kelulusan pinjaman.
                  </p>
                </div>
              </div>
            </div>

            {/* PRD Clarification */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <h4 className="font-semibold text-blue-800 text-sm mb-2">📋 Proses KJ:</h4>
              <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                <li>LPPSA hantar borang ke jabatan anda</li>
                <li>KJ sahkan identiti dan tandatangan borang</li>
                <li>Borang dikembalikan ke LPPSA</li>
                <li>Anda laporkan status di sini</li>
              </ol>
            </div>

            {/* Important Note */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
              <p className="text-xs text-slate-600">
                <strong>Nota Penting:</strong> Sistem ini hanya merekod laporan anda. 
                Status sebenar pengesahan KJ disahkan oleh LPPSA, bukan sistem ini.
              </p>
            </div>

            <button 
              onClick={() => setStep(1)}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30"
            >
              Teruskan <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        );

      case 1: // Status Selection
        return (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">Status Tandatangan KJ</h2>
            <p className="text-slate-500 text-sm mb-6">Pilih status semasa pengesahan KJ anda</p>

            <div className="space-y-3 mb-6">
              {/* Signed Option */}
              <button
                onClick={() => setKjStatus('signed')}
                className={`w-full border-2 rounded-xl p-4 text-left transition-all ${
                  kjStatus === 'signed'
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    kjStatus === 'signed' ? 'bg-green-500' : 'bg-slate-100'
                  }`}>
                    <CheckCircle className={`w-5 h-5 ${
                      kjStatus === 'signed' ? 'text-white' : 'text-slate-400'
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Sudah Ditandatangani</p>
                    <p className="text-sm text-slate-500">KJ telah menandatangani borang pengesahan</p>
                  </div>
                </div>
              </button>

              {/* Pending Option */}
              <button
                onClick={() => setKjStatus('pending')}
                className={`w-full border-2 rounded-xl p-4 text-left transition-all ${
                  kjStatus === 'pending'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    kjStatus === 'pending' ? 'bg-yellow-500' : 'bg-slate-100'
                  }`}>
                    <Clock className={`w-5 h-5 ${
                      kjStatus === 'pending' ? 'text-white' : 'text-slate-400'
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Masih Menunggu</p>
                    <p className="text-sm text-slate-500">Borang belum sampai atau belum ditandatangani</p>
                  </div>
                </div>
              </button>

              {/* Issue Option */}
              <button
                onClick={() => setKjStatus('issue')}
                className={`w-full border-2 rounded-xl p-4 text-left transition-all ${
                  kjStatus === 'issue'
                    ? 'border-red-500 bg-red-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    kjStatus === 'issue' ? 'bg-red-500' : 'bg-slate-100'
                  }`}>
                    <AlertTriangle className={`w-5 h-5 ${
                      kjStatus === 'issue' ? 'text-white' : 'text-slate-400'
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Ada Isu</p>
                    <p className="text-sm text-slate-500">KJ tidak dapat menandatangani atau ada masalah</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Date input for signed status */}
            {kjStatus === 'signed' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tarikh Ditandatangani
                </label>
                <input
                  type="date"
                  value={kjDate}
                  onChange={(e) => setKjDate(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-amber-500 focus:outline-none"
                />
              </div>
            )}

            {/* Notes for issue status */}
            {kjStatus === 'issue' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Huraikan Isu
                </label>
                <textarea
                  value={kjNotes}
                  onChange={(e) => setKjNotes(e.target.value)}
                  placeholder="Contoh: KJ sedang cuti panjang, borang belum sampai, dll."
                  rows={3}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button 
                onClick={() => setStep(0)}
                className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" /> Kembali
              </button>
              <button 
                onClick={() => setStep(2)}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30"
              >
                Seterusnya <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 2: // Confirmation
        return (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">Sahkan Laporan</h2>
            <p className="text-slate-500 text-sm mb-6">Semak maklumat sebelum menghantar</p>

            {/* Summary */}
            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Ringkasan Laporan:</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Status KJ</span>
                  <span className={`font-medium ${
                    kjStatus === 'signed' ? 'text-green-600' :
                    kjStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {kjStatus === 'signed' ? 'Sudah Ditandatangani' :
                     kjStatus === 'pending' ? 'Masih Menunggu' : 'Ada Isu'}
                  </span>
                </div>
                {kjStatus === 'signed' && kjDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tarikh</span>
                    <span className="font-medium text-slate-800">{kjDate}</span>
                  </div>
                )}
                {kjStatus === 'issue' && kjNotes && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Catatan:</p>
                    <p className="text-sm text-slate-700">{kjNotes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Muat Naik Bukti <span className="text-slate-400 font-normal">(Pilihan)</span>
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center">
                <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600 mb-2">Gambar borang yang ditandatangani</p>
                <button 
                  onClick={() => setHasUpload(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    hasUpload 
                      ? 'bg-green-500 text-white' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {hasUpload ? '✓ Dimuat naik' : 'Pilih Fail'}
                </button>
              </div>
            </div>

            {/* PRD Disclaimer */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-red-700 text-center">
                <strong>PENAFIAN:</strong> Laporan ini adalah untuk rekod sahaja. 
                Status sebenar pengesahan KJ disahkan oleh LPPSA.
              </p>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" /> Kembali
              </button>
              <button 
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30"
              >
                Hantar Laporan <CheckCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        );

      case 3: // Success
        return (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Laporan Dihantar!</h2>
            <p className="text-slate-500 mb-6">
              Status KJ anda telah direkodkan. Ejen anda akan dimaklumkan.
            </p>

            <div className={`rounded-xl p-4 mb-6 ${
              kjStatus === 'signed' ? 'bg-green-50 border border-green-200' :
              kjStatus === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <p className={`font-medium ${
                kjStatus === 'signed' ? 'text-green-700' :
                kjStatus === 'pending' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                Status: {kjStatus === 'signed' ? 'Sudah Ditandatangani' :
                         kjStatus === 'pending' ? 'Masih Menunggu' : 'Ada Isu'}
              </p>
            </div>

            <button 
              onClick={() => router.push('/buyer')}
              className="w-full bg-slate-800 text-white py-4 rounded-xl font-semibold"
            >
              Kembali ke Dashboard
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step > 0 && step < 3 && (
                <button onClick={() => setStep(step - 1)} className="text-amber-200 hover:text-white">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <span className="text-white font-bold text-lg">Qontrek</span>
              <span className="text-amber-200 text-xs font-mono">KJ</span>
            </div>
            {step < 3 && <span className="text-amber-200 text-sm">{step + 1} / 3</span>}
          </div>
          
          {step < 3 && (
            <div className="flex gap-1 mt-3">
              {[0, 1, 2].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                  i <= step ? 'bg-white' : 'bg-amber-800'
                }`} />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {renderStep()}
        </div>

        {/* Footer */}
        <AuthorityDisclaimer variant="compact" />
      </div>
    </div>
  );
}
