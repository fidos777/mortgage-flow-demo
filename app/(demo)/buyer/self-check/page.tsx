// app/(demo)/buyer/self-check/page.tsx
// CR-KP-002 Sprint 1 (A4): Self-Check Page
// Buyer DSR pre-check before full application

'use client';

import { useState } from 'react';
import { SelfCheckForm } from '@/components/buyer/SelfCheckForm';
import { SelfCheckResult } from '@/components/buyer/SelfCheckResult';
import type { SelfCheckResult as SelfCheckResultType, SelfCheckInput } from '@/types/cr-kp-002';
import { useRouter } from 'next/navigation';

export default function SelfCheckPage() {
  const [result, setResult] = useState<SelfCheckResultType | null>(null);
  const [input, setInput] = useState<SelfCheckInput | null>(null);
  const router = useRouter();

  const handleResult = (r: SelfCheckResultType, i: SelfCheckInput) => {
    setResult(r);
    setInput(i);
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-slate-800">Semakan Kelayakan Awal</h1>
        <p className="text-sm text-slate-500 mt-1">
          Semak DSR anda sebelum memulakan permohonan penuh
        </p>
      </div>

      {!result ? (
        <SelfCheckForm onResult={handleResult} />
      ) : (
        <SelfCheckResult
          result={result}
          input={input!}
          onProceedToApply={() => router.push('/buyer/apply')}
          onRetry={() => {
            setResult(null);
            setInput(null);
          }}
        />
      )}
    </div>
  );
}
