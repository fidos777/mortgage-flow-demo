'use client';

/**
 * Consent Guard Hook
 * Sprint 0, Session S0.3 | PRD v3.6.3 CR-010
 * S5: Updated to use API routes instead of direct ConsentService
 *
 * Client-side hook for checking PDPA consent status and
 * redirecting to the consent gate if necessary.
 *
 * Sprint 0: Used ConsentService directly (fell into mock mode client-side)
 * Sprint 5: Uses /api/consent/check API route for real Supabase queries
 *
 * Usage:
 * ```tsx
 * const { isChecking, hasConsent, buyerHash } = useConsentGuard({
 *   redirectOnMissing: true, // Auto-redirect to /buyer/start if no consent
 *   returnUrl: '/buyer/prescan', // Where to return after consent
 * });
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useFeatureFlags } from '@/lib/services/feature-flags';
import { ConsentType } from '@/lib/types/consent';

// =============================================================================
// TYPES
// =============================================================================

export interface UseConsentGuardOptions {
  /** Auto-redirect to consent gate if consent missing (default: true) */
  redirectOnMissing?: boolean;
  /** URL to return to after consent (default: current path) */
  returnUrl?: string;
  /** Specific consent type to check (default: PDPA_BASIC) */
  requiredConsent?: ConsentType;
  /** Skip consent check entirely (for landing pages) */
  skip?: boolean;
}

export interface ConsentGuardState {
  /** Whether consent check is in progress */
  isChecking: boolean;
  /** Whether user has the required consent */
  hasConsent: boolean;
  /** Whether PDPA gate is enabled */
  isGateEnabled: boolean;
  /** Buyer hash for this session */
  buyerHash: string | null;
  /** Consented types stored in session */
  consentedTypes: ConsentType[];
  /** When consent was granted */
  consentedAt: string | null;
  /** Manual redirect to consent gate */
  redirectToGate: () => void;
  /** Refresh consent status */
  refresh: () => Promise<void>;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useConsentGuard(
  options: UseConsentGuardOptions = {}
): ConsentGuardState {
  const {
    redirectOnMissing = true,
    returnUrl,
    requiredConsent = 'PDPA_BASIC',
    skip = false,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const { isEnabled } = useFeatureFlags();

  // State
  const [isChecking, setIsChecking] = useState(true);
  const [hasConsent, setHasConsent] = useState(false);
  const [buyerHash, setBuyerHash] = useState<string | null>(null);
  const [consentedTypes, setConsentedTypes] = useState<ConsentType[]>([]);
  const [consentedAt, setConsentedAt] = useState<string | null>(null);

  // Feature flag check
  const isGateEnabled = isEnabled('PDPA_GATE_ENABLED');

  // Get or create buyer hash
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const existingHash = sessionStorage.getItem('buyer_hash');
    if (existingHash) {
      setBuyerHash(existingHash);
    } else {
      const newHash = `BUYER-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem('buyer_hash', newHash);
      setBuyerHash(newHash);
    }

    // Load cached consent info
    const cachedTypes = sessionStorage.getItem('pdpa_consents');
    const cachedAt = sessionStorage.getItem('pdpa_consented_at');

    if (cachedTypes) {
      try {
        setConsentedTypes(JSON.parse(cachedTypes));
      } catch {
        // Invalid JSON, ignore
      }
    }
    if (cachedAt) {
      setConsentedAt(cachedAt);
    }
  }, []);

  // Redirect helper
  const redirectToGate = useCallback(() => {
    const destination = returnUrl || pathname || '/buyer/prescan';
    router.push(`/buyer/start?redirect=${encodeURIComponent(destination)}`);
  }, [router, returnUrl, pathname]);

  // Check consent via API route (S5: server-side Supabase query)
  const checkConsent = useCallback(async () => {
    if (!buyerHash || skip) {
      setIsChecking(false);
      if (skip) setHasConsent(true);
      return;
    }

    // If PDPA gate is disabled, bypass consent check
    if (!isGateEnabled) {
      console.log('[useConsentGuard] PDPA gate disabled, bypassing check');
      setHasConsent(true);
      setIsChecking(false);
      return;
    }

    try {
      // S5: Use API route instead of direct ConsentService
      // This ensures server-side Supabase query with service role key
      const res = await fetch(
        `/api/consent/check?buyer_hash=${encodeURIComponent(buyerHash)}&type=${requiredConsent}`
      );

      if (res.ok) {
        const json = await res.json();
        const hasRequiredConsent = json.data?.hasConsent ?? false;

        setHasConsent(hasRequiredConsent);

        // Update session cache if consent exists
        if (hasRequiredConsent && json.data?.grantedAt) {
          setConsentedAt(json.data.grantedAt);
        }

        // Redirect if missing and option enabled
        if (!hasRequiredConsent && redirectOnMissing) {
          redirectToGate();
        }
      } else {
        // API error — check sessionStorage cache as fallback
        const cachedTypes = sessionStorage.getItem('pdpa_consents');
        if (cachedTypes) {
          try {
            const types = JSON.parse(cachedTypes) as ConsentType[];
            const hasCached = types.includes(requiredConsent);
            setHasConsent(hasCached);
            if (!hasCached && redirectOnMissing) {
              redirectToGate();
            }
          } catch {
            setHasConsent(false);
            if (redirectOnMissing) redirectToGate();
          }
        } else {
          setHasConsent(false);
          if (redirectOnMissing) redirectToGate();
        }
      }
    } catch (error) {
      console.error('[useConsentGuard] Error checking consent:', error);
      // On error, assume no consent for safety
      setHasConsent(false);
      if (redirectOnMissing) {
        redirectToGate();
      }
    } finally {
      setIsChecking(false);
    }
  }, [buyerHash, skip, isGateEnabled, requiredConsent, redirectOnMissing, redirectToGate]);

  // Run consent check when buyer hash is available
  useEffect(() => {
    if (buyerHash) {
      checkConsent();
    }
  }, [buyerHash, checkConsent]);

  return {
    isChecking,
    hasConsent,
    isGateEnabled,
    buyerHash,
    consentedTypes,
    consentedAt,
    redirectToGate,
    refresh: checkConsent,
  };
}

// =============================================================================
// ADDITIONAL HOOKS
// =============================================================================

/**
 * Simple hook to get current buyer hash
 */
export function useBuyerHash(): string | null {
  const [hash, setHash] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const existingHash = sessionStorage.getItem('buyer_hash');
    if (existingHash) {
      setHash(existingHash);
    } else {
      const newHash = `BUYER-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem('buyer_hash', newHash);
      setHash(newHash);
    }
  }, []);

  return hash;
}

/**
 * Hook to check if user has any specific consent type
 * S5: Uses API route for real Supabase query
 */
export function useHasConsent(consentType: ConsentType): boolean | null {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const buyerHash = useBuyerHash();
  const { isEnabled } = useFeatureFlags();

  const isGateEnabled = isEnabled('PDPA_GATE_ENABLED');

  useEffect(() => {
    if (!buyerHash) return;

    // If gate disabled, assume consent
    if (!isGateEnabled) {
      setHasConsent(true);
      return;
    }

    // S5: Use API route instead of direct ConsentService
    fetch(`/api/consent/check?buyer_hash=${encodeURIComponent(buyerHash)}&type=${consentType}`)
      .then(res => res.json())
      .then(json => setHasConsent(json.data?.hasConsent ?? false))
      .catch(() => setHasConsent(false));
  }, [buyerHash, consentType, isGateEnabled]);

  return hasConsent;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useConsentGuard;
