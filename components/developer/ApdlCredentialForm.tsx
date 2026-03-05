// components/developer/ApdlCredentialForm.tsx
// CR-KP-002 Sprint 1 (A2): APDL Credential Verification Form
// Gate for Jenis 3 (Dalam Pembinaan) features

'use client';

import { useState } from 'react';
import type { ApdlCredential, ApdlVerificationResult } from '@/types/cr-kp-002';
import { verifyApdlCredential } from '@/lib/services/cr-kp-002-services';

export interface ApdlCredentialFormProps {
  onVerified?: (credential: ApdlCredential) => void;
  existingCredential?: ApdlCredential | null;
}

export function ApdlCredentialForm({
  onVerified,
  existingCredential,
}: ApdlCredentialFormProps) {
  const [apdlNumber, setApdlNumber] = useState(existingCredential?.apdlNumber || '');
  const [companyName, setCompanyName] = useState(existingCredential?.companyName || '');
  const [expiryDate, setExpiryDate] = useState(existingCredential?.expiryDate?.split('T')[0] || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<ApdlVerificationResult | null>(null);
  const [isVerified, setIsVerified] = useState(existingCredential?.status === 'active');

  const handleVerify = async () => {
    if (!apdlNumber || !companyName || !expiryDate) return;

    setIsVerifying(true);
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const credential: ApdlCredential = {
      id: `apdl-${Date.now()}`,
      developerId: 'current-dev',
      apdlNumber,
      companyName,
      expiryDate: new Date(expiryDate).toISOString(),
      status: 'active',
    };

    const verificationResult = verifyApdlCredential(credential);
    setResult(verificationResult);
    setIsVerifying(false);

    if (verificationResult.isValid) {
      setIsVerified(true);
      onVerified?.(credential);
    }
  };

  if (isVerified && existingCredential) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div className="flex-1">
            <h3 className="font-semibold text-emerald-800">APDL Disahkan</h3>
            <p className="text-sm text-emerald-600">
              {existingCredential.companyName} · {existingCredential.apdlNumber}
            </p>
            <p className="text-xs text-emerald-500 mt-1">
              Sah sehingga: {new Date(existingCredential.expiryDate).toLocaleDateString('ms-MY')}
            </p>
          </div>
          <button
            onClick={() => {
              setIsVerified(false);
              setResult(null);
            }}
            className="text-xs text-emerald-600 hover:text-emerald-800 underline"
          >
            Kemaskini
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">🏗️</span>
        <div>
          <h3 className="font-semibold text-slate-800">Pengesahan APDL</h3>
          <p className="text-sm text-slate-500">
            Diperlukan untuk Jenis 3 (Dalam Pembinaan)
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            No. Pendaftaran APDL
          </label>
          <input
            type="text"
            value={apdlNumber}
            onChange={e => setApdlNumber(e.target.value)}
            placeholder="Cth: APDL-12345"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nama Syarikat
          </label>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="Cth: ABC Development Sdn Bhd"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tarikh Tamat Pendaftaran
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={e => setExpiryDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      {result && !result.isValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">⚠ {result.error}</p>
        </div>
      )}

      {result && result.isValid && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-sm text-emerald-700">✅ APDL disahkan — {result.companyName}</p>
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={isVerifying || !apdlNumber || !companyName || !expiryDate}
        className={`w-full py-2.5 text-sm font-medium rounded-lg transition ${
          isVerifying || !apdlNumber || !companyName || !expiryDate
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
            : 'bg-teal-600 text-white hover:bg-teal-700'
        }`}
      >
        {isVerifying ? '⏳ Mengesahkan...' : '🔍 Sahkan APDL'}
      </button>

      <p className="text-xs text-slate-400 text-center">
        Pengesahan APDL diperlukan sebelum menguruskan projek Jenis 3.
        Data demo sahaja — tiada pengesahan sebenar.
      </p>
    </div>
  );
}

export default ApdlCredentialForm;
