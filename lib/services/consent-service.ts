/**
 * PDPA Consent Service
 * Sprint 0, Session S0.1 | PRD v3.6.3 CR-010, CR-010A
 *
 * Manages PDPA consent lifecycle: grant, check, revoke, and audit.
 * Integrates with feature flags for demo mode bypass.
 *
 * Key Responsibilities:
 * - Grant and revoke granular consent types
 * - Check consent status before data collection
 * - Manage PDPA notice versions
 * - Log consent events for compliance audit
 *
 * =========================================================================
 * ARCHITECTURE DECISION: consent_audit_log vs proof_events (S0.5)
 * =========================================================================
 *
 * Two tables, two purposes:
 *
 * 1. consent_audit_log (Migration 001)
 *    - PDPA-specific audit trail
 *    - Tracks: consent version, retention period, revocation details
 *    - Compliance focus: "Which PDPA notice version was consented to?"
 *    - Retention: 7 years (PDPA 2024 requirement)
 *
 * 2. proof_events (Epic 5, telemetry_events)
 *    - Workflow integration layer
 *    - Tracks: PDPA_BASIC_GRANTED, PDPA_MARKETING_GRANTED, etc.
 *    - Operational focus: "Can this buyer proceed? Can we send marketing?"
 *    - Used by notification-service.ts for consent verification
 *
 * Why both?
 * - consent_audit_log provides legal/compliance evidence (immutable, detailed)
 * - proof_events provides workflow signals (fast lookups, integrations)
 * - Dual-write ensures both needs are met without compromise
 *
 * The consent service writes to BOTH on consent events.
 * =========================================================================
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FeatureFlags, getFeatureFlags } from './feature-flags';
import {
  ConsentType,
  ConsentPurpose,
  ConsentRecord,
  ConsentRecordRow,
  GrantConsentInput,
  RevokeConsentInput,
  BatchConsentInput,
  BuyerConsentStatus,
  ConsentCheckResult,
  PDPANoticeVersion,
  PDPANoticeRow,
  PDPANoticeDisplay,
  CONSENT_CONFIG,
  CONSENT_TO_PROOF_EVENT,
  REVOKE_TO_PROOF_EVENT,
  PURPOSE_TO_PROOF_EVENT,
  PURPOSE_REVOKE_TO_PROOF_EVENT,
  REQUIRED_PURPOSES,
  CONSENT_TYPE_TO_PURPOSES,
  toConsentRecord,
  toPDPANoticeVersion,
} from '../types/consent';

// =============================================================================
// CONFIGURATION
// =============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Retention periods for each consent type (as PostgreSQL INTERVAL strings)
 */
export const RETENTION_PERIODS: Record<ConsentType, string> = {
  PDPA_BASIC: '7 years',
  PDPA_MARKETING: '2 years',
  PDPA_ANALYTICS: '1 year',
  PDPA_THIRD_PARTY: '7 years',
  LPPSA_SUBMISSION: '7 years',
};

/**
 * SF.2: Retention periods for each purpose code
 */
export const PURPOSE_RETENTION_PERIODS: Record<ConsentPurpose, string> = {
  C1_ELIGIBILITY: '7 years',
  C2_DOCUMENT_PROCESSING: '7 years',
  C3_SHARE_AGENT: '7 years',
  C4_DEVELOPER_ANALYTICS: '7 years',
  C5_COMMUNICATION: '2 years',
  C6_PROMOTIONAL: '2 years',
};

// =============================================================================
// CONSENT SERVICE CLASS
// =============================================================================

export class ConsentService {
  private supabase: SupabaseClient | null = null;
  private flags: FeatureFlags;

  constructor() {
    this.flags = getFeatureFlags();

    // Initialize Supabase if credentials available
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    }
  }

  // ===========================================================================
  // CONSENT GATE CHECK
  // ===========================================================================

  /**
   * Check if the PDPA gate is enabled
   * Returns false in demo mode if PDPA_GATE_ENABLED is false
   */
  isGateEnabled(): boolean {
    return this.flags.PDPA_GATE_ENABLED ?? true;
  }

  /**
   * Check if buyer can proceed (has PDPA_BASIC consent)
   * In demo mode with gate disabled, always returns true
   */
  async canProceed(buyerHash: string): Promise<boolean> {
    // Demo mode bypass
    if (!this.isGateEnabled()) {
      console.warn('[ConsentService] PDPA gate bypassed in demo mode');
      return true;
    }

    return this.hasConsent(buyerHash, 'PDPA_BASIC');
  }

  // ===========================================================================
  // CONSENT CHECK
  // ===========================================================================

  /**
   * Check if buyer has a specific consent type
   */
  async hasConsent(buyerHash: string, consentType: ConsentType): Promise<boolean> {
    // Demo mode bypass for non-required consents
    if (!this.isGateEnabled() && consentType !== 'PDPA_BASIC') {
      return true;
    }

    // Mock mode (no Supabase)
    if (!this.supabase) {
      console.log(`[ConsentService] Mock: hasConsent(${buyerHash}, ${consentType}) = true`);
      return true;
    }

    const { data, error } = await this.supabase
      .from('consent_records')
      .select('id')
      .eq('buyer_hash', buyerHash)
      .eq('consent_type', consentType)
      .is('revoked_at', null)
      .or('expires_at.is.null,expires_at.gt.now()')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (which is valid)
      console.error('[ConsentService] Error checking consent:', error);
    }

    return !!data;
  }

  /**
   * Get detailed consent check result
   */
  async checkConsent(buyerHash: string, consentType: ConsentType): Promise<ConsentCheckResult> {
    if (!this.supabase) {
      return {
        consentType,
        hasConsent: true, // Mock mode always returns true
        grantedAt: null,
        expiresAt: null,
        consentVersion: null,
      };
    }

    const { data, error } = await this.supabase
      .from('consent_records')
      .select('granted_at, expires_at, consent_version')
      .eq('buyer_hash', buyerHash)
      .eq('consent_type', consentType)
      .is('revoked_at', null)
      .or('expires_at.is.null,expires_at.gt.now()')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[ConsentService] Error checking consent:', error);
    }

    return {
      consentType,
      hasConsent: !!data,
      grantedAt: data?.granted_at || null,
      expiresAt: data?.expires_at || null,
      consentVersion: data?.consent_version || null,
    };
  }

  /**
   * Get full consent status for a buyer
   */
  async getBuyerConsentStatus(buyerHash: string): Promise<BuyerConsentStatus> {
    // Demo mode bypass
    if (!this.isGateEnabled()) {
      return {
        buyerHash,
        hasBasic: true,
        hasMarketing: true,
        hasAnalytics: true,
        hasThirdParty: true,
        hasLppsaSubmission: false,
        activeConsentCount: 4,
        firstConsentAt: new Date().toISOString(),
        latestConsentAt: new Date().toISOString(),
        canProceed: true,
      };
    }

    if (!this.supabase) {
      return {
        buyerHash,
        hasBasic: true,
        hasMarketing: false,
        hasAnalytics: false,
        hasThirdParty: false,
        hasLppsaSubmission: false,
        activeConsentCount: 1,
        firstConsentAt: null,
        latestConsentAt: null,
        canProceed: true,
      };
    }

    const { data, error } = await this.supabase
      .from('v_buyer_consent_status')
      .select('*')
      .eq('buyer_hash', buyerHash)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[ConsentService] Error getting consent status:', error);
    }

    if (!data) {
      return {
        buyerHash,
        hasBasic: false,
        hasMarketing: false,
        hasAnalytics: false,
        hasThirdParty: false,
        hasLppsaSubmission: false,
        activeConsentCount: 0,
        firstConsentAt: null,
        latestConsentAt: null,
        canProceed: false,
      };
    }

    return {
      buyerHash,
      hasBasic: data.has_basic,
      hasMarketing: data.has_marketing,
      hasAnalytics: data.has_analytics,
      hasThirdParty: data.has_third_party,
      hasLppsaSubmission: data.has_lppsa_submission || false,
      activeConsentCount: data.active_consent_count,
      firstConsentAt: data.first_consent_at,
      latestConsentAt: data.latest_consent_at,
      canProceed: data.has_basic,
    };
  }

  // ===========================================================================
  // CONSENT GRANT
  // ===========================================================================

  /**
   * Grant a single consent type
   */
  async grantConsent(input: GrantConsentInput): Promise<ConsentRecord | null> {
    if (!this.supabase) {
      console.log('[ConsentService] Mock: grantConsent', input);
      return this.mockConsentRecord(input);
    }

    const retentionPeriod = RETENTION_PERIODS[input.consentType];

    const { data, error } = await this.supabase
      .from('consent_records')
      .upsert(
        {
          buyer_hash: input.buyerHash,
          consent_type: input.consentType,
          consent_version: input.consentVersion,
          granted_at: new Date().toISOString(),
          expires_at: input.expiresAt || null,
          revoked_at: null, // Clear any previous revocation
          retention_period: retentionPeriod,
          ip_hash: input.ipHash || null,
          user_agent_hash: input.userAgentHash || null,
          capture_method: input.captureMethod || 'WEB_FORM',
        },
        {
          onConflict: 'buyer_hash,consent_type',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[ConsentService] Error granting consent:', error);
      return null;
    }

    // Log proof event (Epic 5 integration)
    await this.logProofEvent(input.buyerHash, CONSENT_TO_PROOF_EVENT[input.consentType], {
      consentVersion: input.consentVersion,
      captureMethod: input.captureMethod || 'WEB_FORM',
    });

    return toConsentRecord(data as ConsentRecordRow);
  }

  /**
   * Grant multiple consents at once (from consent gate form)
   */
  async grantBatchConsents(input: BatchConsentInput): Promise<ConsentRecord[]> {
    const results: ConsentRecord[] = [];

    for (const consent of input.consents) {
      if (consent.granted) {
        const record = await this.grantConsent({
          buyerHash: input.buyerHash,
          consentType: consent.type,
          consentVersion: input.consentVersion,
          ipHash: input.ipHash,
          userAgentHash: input.userAgentHash,
          captureMethod: 'WEB_FORM',
        });

        if (record) {
          results.push(record);
        }
      }
    }

    return results;
  }

  // ===========================================================================
  // CONSENT REVOKE
  // ===========================================================================

  /**
   * Revoke a consent type
   */
  async revokeConsent(input: RevokeConsentInput): Promise<boolean> {
    if (!this.supabase) {
      console.log('[ConsentService] Mock: revokeConsent', input);
      return true;
    }

    const { error } = await this.supabase
      .from('consent_records')
      .update({
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('buyer_hash', input.buyerHash)
      .eq('consent_type', input.consentType)
      .is('revoked_at', null);

    if (error) {
      console.error('[ConsentService] Error revoking consent:', error);
      return false;
    }

    // Log proof event
    await this.logProofEvent(input.buyerHash, REVOKE_TO_PROOF_EVENT[input.consentType], {
      reason: input.reason,
      ipHash: input.ipHash,
    });

    return true;
  }

  // ===========================================================================
  // SF.2: PURPOSE-BASED CONSENT
  // ===========================================================================

  /**
   * Check if buyer has granted a specific purpose
   */
  async hasPurpose(buyerHash: string, purpose: ConsentPurpose): Promise<boolean> {
    // Demo mode bypass for non-required purposes
    if (!this.isGateEnabled() && !REQUIRED_PURPOSES.includes(purpose)) {
      return true;
    }

    // Mock mode (no Supabase)
    if (!this.supabase) {
      console.log(`[ConsentService] Mock: hasPurpose(${buyerHash}, ${purpose}) = true`);
      return true;
    }

    const { data, error } = await this.supabase
      .from('consent_records')
      .select('purposes')
      .eq('buyer_hash', buyerHash)
      .is('revoked_at', null)
      .or('expires_at.is.null,expires_at.gt.now()');

    if (error) {
      console.error('[ConsentService] Error checking purpose:', error);
      return false;
    }

    // Check if any record has this purpose
    return data?.some(record =>
      record.purposes && Array.isArray(record.purposes) && record.purposes.includes(purpose)
    ) ?? false;
  }

  /**
   * Check if buyer has all required purposes (C1-C4)
   */
  async hasAllRequiredPurposes(buyerHash: string): Promise<boolean> {
    // Demo mode bypass
    if (!this.isGateEnabled()) {
      return true;
    }

    for (const purpose of REQUIRED_PURPOSES) {
      const has = await this.hasPurpose(buyerHash, purpose);
      if (!has) return false;
    }
    return true;
  }

  /**
   * Get all purposes granted by a buyer
   */
  async getBuyerPurposes(buyerHash: string): Promise<ConsentPurpose[]> {
    // Mock mode
    if (!this.supabase) {
      return [...REQUIRED_PURPOSES]; // Return required purposes in mock mode
    }

    const { data, error } = await this.supabase
      .from('consent_records')
      .select('purposes')
      .eq('buyer_hash', buyerHash)
      .is('revoked_at', null)
      .or('expires_at.is.null,expires_at.gt.now()');

    if (error) {
      console.error('[ConsentService] Error getting purposes:', error);
      return [];
    }

    // Flatten and dedupe purposes from all records
    const allPurposes = new Set<ConsentPurpose>();
    data?.forEach(record => {
      if (record.purposes && Array.isArray(record.purposes)) {
        record.purposes.forEach((p: ConsentPurpose) => allPurposes.add(p));
      }
    });

    return Array.from(allPurposes);
  }

  /**
   * Grant consent with specific purposes
   * This is the SF.2 preferred method - grants purposes directly
   */
  async grantPurposes(
    buyerHash: string,
    purposes: ConsentPurpose[],
    consentVersion: string,
    options?: {
      ipHash?: string;
      userAgentHash?: string;
      captureMethod?: 'WEB_FORM' | 'API' | 'IMPORT';
    }
  ): Promise<boolean> {
    // Derive legacy consent type from purposes
    const hasAllRequired = REQUIRED_PURPOSES.every(p => purposes.includes(p));
    const consentType: ConsentType = hasAllRequired ? 'PDPA_BASIC' : 'PDPA_MARKETING';

    const retentionPeriod = RETENTION_PERIODS[consentType];

    if (!this.supabase) {
      console.log('[ConsentService] Mock: grantPurposes', { buyerHash, purposes });
      return true;
    }

    const { error } = await this.supabase
      .from('consent_records')
      .upsert(
        {
          buyer_hash: buyerHash,
          consent_type: consentType,
          consent_version: consentVersion,
          granted_at: new Date().toISOString(),
          expires_at: null,
          revoked_at: null,
          retention_period: retentionPeriod,
          ip_hash: options?.ipHash || null,
          user_agent_hash: options?.userAgentHash || null,
          capture_method: options?.captureMethod || 'WEB_FORM',
          purposes: purposes,
        },
        {
          onConflict: 'buyer_hash,consent_type',
        }
      );

    if (error) {
      console.error('[ConsentService] Error granting purposes:', error);
      return false;
    }

    // Log proof events for each purpose
    for (const purpose of purposes) {
      await this.logProofEvent(buyerHash, PURPOSE_TO_PROOF_EVENT[purpose], {
        consentVersion,
        captureMethod: options?.captureMethod || 'WEB_FORM',
        allPurposes: purposes,
      });
    }

    return true;
  }

  /**
   * Revoke a specific purpose
   */
  async revokePurpose(
    buyerHash: string,
    purpose: ConsentPurpose,
    reason?: string
  ): Promise<boolean> {
    if (!this.supabase) {
      console.log('[ConsentService] Mock: revokePurpose', { buyerHash, purpose });
      return true;
    }

    // Get current purposes
    const currentPurposes = await this.getBuyerPurposes(buyerHash);
    const updatedPurposes = currentPurposes.filter(p => p !== purpose);

    // If revoking a required purpose, revoke all (PDPA_BASIC)
    if (REQUIRED_PURPOSES.includes(purpose)) {
      return this.revokeConsent({
        buyerHash,
        consentType: 'PDPA_BASIC',
        reason: `Required purpose ${purpose} revoked`,
      });
    }

    // For optional purposes, just update the purposes array
    const { error } = await this.supabase
      .from('consent_records')
      .update({
        purposes: updatedPurposes,
        updated_at: new Date().toISOString(),
      })
      .eq('buyer_hash', buyerHash)
      .is('revoked_at', null);

    if (error) {
      console.error('[ConsentService] Error revoking purpose:', error);
      return false;
    }

    // Log proof event
    await this.logProofEvent(buyerHash, PURPOSE_REVOKE_TO_PROOF_EVENT[purpose], {
      reason,
      remainingPurposes: updatedPurposes,
    });

    return true;
  }

  // ===========================================================================
  // PDPA NOTICE VERSIONS
  // ===========================================================================

  /**
   * Get the current active PDPA notice version
   */
  async getCurrentNoticeVersion(): Promise<PDPANoticeVersion | null> {
    if (!this.supabase) {
      return this.mockNoticeVersion();
    }

    const { data, error } = await this.supabase
      .from('pdpa_notice_versions')
      .select('*')
      .is('superseded_at', null)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('[ConsentService] Error getting notice version:', error);
      return null;
    }

    return toPDPANoticeVersion(data as PDPANoticeRow);
  }

  /**
   * Get PDPA notice for display (with locale)
   */
  async getNoticeForDisplay(locale: 'bm' | 'en' = 'bm'): Promise<PDPANoticeDisplay | null> {
    const version = await this.getCurrentNoticeVersion();

    if (!version) return null;

    return {
      version: version.version,
      content: locale === 'bm' ? version.contentBm : version.contentEn,
      summary: locale === 'bm' ? version.summaryBm : version.summaryEn,
      effectiveFrom: version.effectiveFrom,
    };
  }

  // ===========================================================================
  // PROOF EVENT LOGGING (Epic 5 Integration)
  // ===========================================================================

  /**
   * Log consent event to proof_events table
   * This replaces the deprecated CONSENT_GIVEN event with granular types
   */
  private async logProofEvent(
    buyerHash: string,
    eventType: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    if (!this.supabase) {
      console.log(`[ConsentService] Mock: logProofEvent(${eventType})`, metadata);
      return;
    }

    try {
      // Log to telemetry_events (existing table from Epic 5)
      await this.supabase.from('telemetry_events').insert({
        event_type: eventType,
        role: 'buyer',
        case_id: null, // Consent is pre-case
        project_id: null,
        metadata: {
          buyer_hash: buyerHash,
          ...metadata,
          authorityClaimed: false, // Standard proof event field
        },
      });
    } catch (error) {
      console.error('[ConsentService] Error logging proof event:', error);
    }
  }

  // ===========================================================================
  // MOCK IMPLEMENTATIONS (for demo/dev mode)
  // ===========================================================================

  private mockConsentRecord(input: GrantConsentInput): ConsentRecord {
    const now = new Date().toISOString();
    return {
      id: `mock-${Date.now()}`,
      buyerHash: input.buyerHash,
      consentType: input.consentType,
      grantedAt: now,
      expiresAt: input.expiresAt || null,
      revokedAt: null,
      retentionPeriod: RETENTION_PERIODS[input.consentType],
      consentVersion: input.consentVersion,
      ipHash: input.ipHash || null,
      userAgentHash: input.userAgentHash || null,
      captureMethod: input.captureMethod || 'WEB_FORM',
      caseId: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  private mockNoticeVersion(): PDPANoticeVersion {
    return {
      version: '1.0',
      contentBm: 'NOTIS PERLINDUNGAN DATA PERIBADI (Mock)',
      contentEn: 'PERSONAL DATA PROTECTION NOTICE (Mock)',
      summaryBm: 'Saya membenarkan pemprosesan data peribadi saya.',
      summaryEn: 'I consent to the processing of my personal data.',
      effectiveFrom: new Date().toISOString(),
      supersededAt: null,
      changeReason: 'Mock version',
      approvedBy: 'system',
      createdAt: new Date().toISOString(),
      createdBy: 'system',
    };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let consentServiceInstance: ConsentService | null = null;

export function getConsentService(): ConsentService {
  if (!consentServiceInstance) {
    consentServiceInstance = new ConsentService();
  }
  return consentServiceInstance;
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick check if buyer can proceed (for route guards)
 */
export async function canBuyerProceed(buyerHash: string): Promise<boolean> {
  return getConsentService().canProceed(buyerHash);
}

/**
 * Quick check for specific consent
 */
export async function checkBuyerConsent(
  buyerHash: string,
  consentType: ConsentType
): Promise<boolean> {
  return getConsentService().hasConsent(buyerHash, consentType);
}

/**
 * Get consent config for UI display
 */
export function getConsentTypeConfig(consentType: ConsentType) {
  return CONSENT_CONFIG[consentType];
}

/**
 * Get all consent configs for consent gate form
 */
export function getAllConsentConfigs() {
  return Object.values(CONSENT_CONFIG);
}

/**
 * Check if consent type is required
 */
export function isConsentRequired(consentType: ConsentType): boolean {
  return CONSENT_CONFIG[consentType].required;
}

// =============================================================================
// SF.2: PURPOSE-BASED CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Quick check for specific purpose
 */
export async function checkBuyerPurpose(
  buyerHash: string,
  purpose: ConsentPurpose
): Promise<boolean> {
  return getConsentService().hasPurpose(buyerHash, purpose);
}

/**
 * Check if buyer has all required purposes
 */
export async function canBuyerProceedWithPurposes(buyerHash: string): Promise<boolean> {
  return getConsentService().hasAllRequiredPurposes(buyerHash);
}

/**
 * Get all purposes for a buyer
 */
export async function getBuyerActivePurposes(buyerHash: string): Promise<ConsentPurpose[]> {
  return getConsentService().getBuyerPurposes(buyerHash);
}

/**
 * Grant purposes to a buyer
 */
export async function grantBuyerPurposes(
  buyerHash: string,
  purposes: ConsentPurpose[],
  consentVersion: string
): Promise<boolean> {
  return getConsentService().grantPurposes(buyerHash, purposes, consentVersion);
}

/**
 * Check if purpose is required
 */
export function isPurposeRequired(purpose: ConsentPurpose): boolean {
  return REQUIRED_PURPOSES.includes(purpose);
}

/**
 * Get mapped purposes for a legacy consent type
 */
export function getMappedPurposes(consentType: ConsentType): ConsentPurpose[] {
  return CONSENT_TYPE_TO_PURPOSES[consentType];
}
