'use client';

/**
 * Buyer Start Page - PDPA Consent Gate (Step 0)
 * Sprint 0, Session S0.3 | PRD v3.6.3 CR-010
 * Updated: CR-008 Doc-First Flow
 *
 * This is the MANDATORY first step before ANY data collection.
 * Buyer must complete PDPA consent before proceeding.
 *
 * Flow (CR-008): /buyer/start → (consent) → /buyer/upload
 * Legacy flow: /buyer/start → (consent) → /buyer/prescan
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Shield, ArrowRight, CheckCircle } from 'lucide-react';
import { PDPAConsentGate } from '@/components/consent';
import { getConsentService } from '@/lib/services/consent-service';
import { useFeatureFlags } from '@/lib/services/feature-flags';
import { ConsentType } from '@/lib/types/consent';
import { AuthorityDisclaimer } from '@/components/permission-gate';

// =============================================================================
// LOADING COMPONENT
// =============================================================================

function StartLoading() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto mb-2" />
        <p className="text-slate-500 text-sm">Memuatkan...</p>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function BuyerStartFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isEnabled } = useFeatureFlags();

  // Get redirect destination from URL params (CR-008: default to upload)
  const redirectTo = searchParams?.get('redirect') || '/buyer/upload';
  const developerName = searchParams?.get('dev') || '';
  const projectFromUrl = searchParams?.get('project') || '';

  // SF.4: QR entry tracking parameters
  const entrySource = searchParams?.get('entry') || 'direct'; // 'qr' | 'direct' | 'link'
  const projectId = searchParams?.get('pid') || '';
  const developerId = searchParams?.get('did') || '';
  const agentId = searchParams?.get('aid') || '';

  // State
  const [loading, setLoading] = useState(true);
  const [hasConsent, setHasConsent] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [buyerHash, setBuyerHash] = useState<string>('');

  // Check if PDPA gate is enabled
  const isPdpaGateEnabled = isEnabled('PDPA_GATE_ENABLED');

  // Generate or retrieve buyer hash (for demo, use sessionStorage)
  useEffect(() => {
    // Generate unique buyer hash for this session
    const existingHash = sessionStorage.getItem('buyer_hash');
    if (existingHash) {
      setBuyerHash(existingHash);
    } else {
      const newHash = `BUYER-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem('buyer_hash', newHash);
      setBuyerHash(newHash);
    }
  }, []);

  // Check existing consent status
  useEffect(() => {
    const checkConsent = async () => {
      if (!buyerHash) return;

      const consentService = getConsentService();

      // If PDPA gate is disabled (demo mode), bypass
      if (!isPdpaGateEnabled) {
        console.log('[BuyerStart] PDPA gate disabled, bypassing consent check');
        setHasConsent(true);
        setLoading(false);
        return;
      }

      // Check if buyer already has PDPA_BASIC consent
      const canProceed = await consentService.canProceed(buyerHash);

      if (canProceed) {
        setHasConsent(true);
        // Auto-redirect if already has consent
        const params = new URLSearchParams();
        if (developerName) params.set('dev', developerName);
        if (projectFromUrl) params.set('project', projectFromUrl);
        const queryString = params.toString();
        router.push(`${redirectTo}${queryString ? `?${queryString}` : ''}`);
      } else {
        setShowGate(true);
      }

      setLoading(false);
    };

    checkConsent();
  }, [buyerHash, isPdpaGateEnabled, redirectTo, router, developerName, projectFromUrl]);

  // Handle consent granted (called by PDPAConsentGate with granted consent types)
  const handleConsentGranted = (grantedConsents: ConsentType[]) => {
    // Store consent timestamp in sessionStorage for UI feedback
    sessionStorage.setItem('pdpa_consented_at', new Date().toISOString());
    sessionStorage.setItem('pdpa_consents', JSON.stringify(grantedConsents));

    // SF.4: Store QR entry context for downstream tracking
    if (entrySource === 'qr') {
      sessionStorage.setItem('entry_source', 'qr');
      sessionStorage.setItem('qr_project_id', projectId);
      sessionStorage.setItem('qr_developer_id', developerId);
      if (agentId) sessionStorage.setItem('qr_agent_id', agentId);
      console.log('[BuyerStart] QR entry tracked:', { projectId, developerId, agentId });
    }

    setHasConsent(true);

    // Redirect to destination
    const params = new URLSearchParams();
    if (developerName) params.set('dev', developerName);
    if (projectFromUrl) params.set('project', projectFromUrl);
    if (projectId) params.set('pid', projectId);
    if (developerId) params.set('did', developerId);
    if (agentId) params.set('aid', agentId);
    if (entrySource) params.set('entry', entrySource);
    params.set('logo', 'stored'); // Pass logo flag
    const queryString = params.toString();

    // Small delay for UX feedback
    setTimeout(() => {
      router.push(`${redirectTo}${queryString ? `?${queryString}` : ''}`);
    }, 500);
  };

  // Handle close (user explicitly closes gate without consenting)
  const handleClose = () => {
    // Redirect back to buyer dashboard
    router.push('/buyer');
  };

  // Loading state
  if (loading) {
    return <StartLoading />;
  }

  // If PDPA gate disabled, show bypass message
  if (!isPdpaGateEnabled) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-white" />
              <span className="text-white font-bold text-lg">Mod Demo</span>
            </div>
          </div>

          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-amber-600" />
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Gerbang PDPA Dilangkau
            </h2>
            <p className="text-slate-500 text-sm mb-4">
              Gerbang persetujuan PDPA dimatikan dalam mod demo. Dalam pengeluaran
              sebenar, pembeli mesti melengkapkan persetujuan PDPA sebelum
              meneruskan.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-amber-700">
                ⚠️ Ini adalah mod demonstrasi sahaja. Untuk penggunaan sebenar,
                aktifkan bendera <code className="bg-amber-100 px-1 rounded">PDPA_GATE_ENABLED</code>.
              </p>
            </div>

            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (developerName) params.set('dev', developerName);
                if (projectFromUrl) params.set('project', projectFromUrl);
                params.set('logo', 'stored');
                const queryString = params.toString();
                router.push(`${redirectTo}${queryString ? `?${queryString}` : ''}`);
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 hover:shadow-xl transition-all"
            >
              Teruskan ke Demo <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <AuthorityDisclaimer variant="compact" />
        </div>
      </div>
    );
  }

  // Show consent gate
  if (showGate && !hasConsent) {
    return (
      <PDPAConsentGate
        buyerHash={buyerHash}
        onConsentGranted={handleConsentGranted}
        onBack={handleClose}
        locale="bm"
        projectName={projectFromUrl || undefined}
      />
    );
  }

  // Success state (brief flash before redirect)
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-teal-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Persetujuan Diterima</h2>
        <p className="text-slate-500 text-sm mb-4">Mengalih ke langkah seterusnya...</p>
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin mx-auto" />
      </div>
    </div>
  );
}

// =============================================================================
// EXPORT WITH SUSPENSE
// =============================================================================

export default function BuyerStartPage() {
  return (
    <Suspense fallback={<StartLoading />}>
      <BuyerStartFlow />
    </Suspense>
  );
}
