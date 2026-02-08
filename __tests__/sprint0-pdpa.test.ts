// __tests__/sprint0-pdpa.test.ts
// Integration smoke tests for Sprint 0 (PDPA Hard Gate)
// PRD v3.6.3 CR-010, CR-010A, CR-010B, CR-010C, CR-012
// Run with: npx vitest run __tests__/sprint0-pdpa.test.ts

import { describe, it, expect, beforeEach } from 'vitest';

// =============================================================================
// CONSENT TYPES (S0.1)
// =============================================================================

import {
  CONSENT_TYPES,
  CONSENT_CONFIG,
  type ConsentType,
  CONSENT_TO_PROOF_EVENT,
  REVOKE_TO_PROOF_EVENT,
} from '../lib/types/consent';

describe('Sprint 0 — S0.1: Consent Types', () => {
  describe('CONSENT_TYPES array', () => {
    it('should have exactly 4 consent types', () => {
      expect(CONSENT_TYPES).toHaveLength(4);
    });

    it('should include all required types', () => {
      expect(CONSENT_TYPES).toContain('PDPA_BASIC');
      expect(CONSENT_TYPES).toContain('PDPA_MARKETING');
      expect(CONSENT_TYPES).toContain('PDPA_ANALYTICS');
      expect(CONSENT_TYPES).toContain('PDPA_THIRD_PARTY');
    });
  });

  describe('CONSENT_CONFIG', () => {
    it('should mark PDPA_BASIC as required', () => {
      expect(CONSENT_CONFIG.PDPA_BASIC.required).toBe(true);
    });

    it('should mark optional types correctly', () => {
      expect(CONSENT_CONFIG.PDPA_MARKETING.required).toBe(false);
      expect(CONSENT_CONFIG.PDPA_ANALYTICS.required).toBe(false);
      expect(CONSENT_CONFIG.PDPA_THIRD_PARTY.required).toBe(false);
    });

    it('should have correct retention periods (CR-012)', () => {
      expect(CONSENT_CONFIG.PDPA_BASIC.retentionYears).toBe(7);
      expect(CONSENT_CONFIG.PDPA_MARKETING.retentionYears).toBe(2);
      expect(CONSENT_CONFIG.PDPA_ANALYTICS.retentionYears).toBe(1);
      expect(CONSENT_CONFIG.PDPA_THIRD_PARTY.retentionYears).toBe(7);
    });

    it('should have bilingual labels for all types', () => {
      for (const type of CONSENT_TYPES) {
        const config = CONSENT_CONFIG[type];
        expect(config.labelEn).toBeTruthy();
        expect(config.labelBm).toBeTruthy();
        expect(config.descriptionEn).toBeTruthy();
        expect(config.descriptionBm).toBeTruthy();
      }
    });
  });

  describe('Proof event mapping', () => {
    it('should map consent types to grant events', () => {
      expect(CONSENT_TO_PROOF_EVENT.PDPA_BASIC).toBe('PDPA_BASIC_GRANTED');
      expect(CONSENT_TO_PROOF_EVENT.PDPA_MARKETING).toBe('PDPA_MARKETING_GRANTED');
      expect(CONSENT_TO_PROOF_EVENT.PDPA_ANALYTICS).toBe('PDPA_ANALYTICS_GRANTED');
      expect(CONSENT_TO_PROOF_EVENT.PDPA_THIRD_PARTY).toBe('PDPA_THIRD_PARTY_GRANTED');
    });

    it('should map consent types to revoke events', () => {
      expect(REVOKE_TO_PROOF_EVENT.PDPA_BASIC).toBe('PDPA_BASIC_REVOKED');
      expect(REVOKE_TO_PROOF_EVENT.PDPA_MARKETING).toBe('PDPA_MARKETING_REVOKED');
    });
  });
});

// =============================================================================
// I18N BILINGUAL STRINGS (S0.2)
// =============================================================================

import {
  consentStringsBM,
  consentStringsEN,
  getConsentStrings,
  t,
  type Locale,
} from '../lib/i18n/consent';

describe('Sprint 0 — S0.2: Bilingual Strings', () => {
  describe('BM strings completeness', () => {
    it('should have page-level strings', () => {
      expect(consentStringsBM.pageTitle).toBeTruthy();
      expect(consentStringsBM.pageSubtitle).toBeTruthy();
      expect(consentStringsBM.introText).toBeTruthy();
    });

    it('should have all consent type strings', () => {
      expect(consentStringsBM.consentTypes.PDPA_BASIC.label).toBeTruthy();
      expect(consentStringsBM.consentTypes.PDPA_BASIC.description).toBeTruthy();
      expect(consentStringsBM.consentTypes.PDPA_MARKETING.label).toBeTruthy();
      expect(consentStringsBM.consentTypes.PDPA_ANALYTICS.label).toBeTruthy();
      expect(consentStringsBM.consentTypes.PDPA_THIRD_PARTY.label).toBeTruthy();
    });

    it('should have button strings', () => {
      expect(consentStringsBM.buttons.acceptRequired).toBeTruthy();
      expect(consentStringsBM.buttons.acceptAll).toBeTruthy();
      expect(consentStringsBM.buttons.continue).toBeTruthy();
    });

    it('should have Safe Language disclaimer (PRD 6.2)', () => {
      const disclaimer = consentStringsBM.footer.disclaimer;
      expect(disclaimer).toContain('readiness signal');
      expect(disclaimer).toContain('bukan kelulusan pinjaman');
    });
  });

  describe('EN strings completeness', () => {
    it('should have page-level strings', () => {
      expect(consentStringsEN.pageTitle).toBeTruthy();
      expect(consentStringsEN.pageSubtitle).toBeTruthy();
      expect(consentStringsEN.introText).toBeTruthy();
    });

    it('should have Safe Language disclaimer (PRD 6.2)', () => {
      const disclaimer = consentStringsEN.footer.disclaimer;
      expect(disclaimer).toContain('readiness signals');
      expect(disclaimer).toContain('not loan approvals');
    });
  });

  describe('getConsentStrings helper', () => {
    it('should return BM strings by default', () => {
      const strings = getConsentStrings();
      expect(strings.pageTitle).toBe(consentStringsBM.pageTitle);
    });

    it('should return EN strings when specified', () => {
      const strings = getConsentStrings('en');
      expect(strings.pageTitle).toBe(consentStringsEN.pageTitle);
    });
  });

  describe('t() translation helper', () => {
    it('should get nested string by path', () => {
      expect(t('buttons.continue', 'bm')).toBe('Teruskan');
      expect(t('buttons.continue', 'en')).toBe('Continue');
    });

    it('should return path if not found', () => {
      expect(t('nonexistent.path', 'bm')).toBe('nonexistent.path');
    });
  });
});

// =============================================================================
// FEATURE FLAGS (S0.2-S0.6)
// =============================================================================

import {
  FLAG_PRESETS,
  type FeatureFlagKey,
  type FlagPreset,
} from '../lib/services/feature-flags';

describe('Sprint 0 — Feature Flag Presets', () => {
  describe('Demo preset', () => {
    const preset = FLAG_PRESETS.demo;

    it('should have DEMO_MODE enabled', () => {
      expect(preset.DEMO_MODE).toBe(true);
    });

    it('should have PDPA gate disabled for quick demos', () => {
      expect(preset.PDPA_GATE_ENABLED).toBe(false);
    });

    it('should have PDPA strict mode disabled', () => {
      expect(preset.PDPA_STRICT_MODE).toBe(false);
    });

    it('should have breach scaffold disabled', () => {
      expect(preset.PDPA_BREACH_SCAFFOLD).toBe(false);
    });
  });

  describe('Pilot preset', () => {
    const preset = FLAG_PRESETS.pilot;

    it('should have DEMO_MODE disabled', () => {
      expect(preset.DEMO_MODE).toBe(false);
    });

    it('should have PDPA gate enabled', () => {
      expect(preset.PDPA_GATE_ENABLED).toBe(true);
    });

    it('should have PDPA strict mode disabled (soft enforcement)', () => {
      expect(preset.PDPA_STRICT_MODE).toBe(false);
    });

    it('should have breach scaffold enabled', () => {
      expect(preset.PDPA_BREACH_SCAFFOLD).toBe(true);
    });

    it('should have OTP enforced', () => {
      expect(preset.OTP_ENFORCED).toBe(true);
    });
  });

  describe('Production preset', () => {
    const preset = FLAG_PRESETS.production;

    it('should have DEMO_MODE disabled', () => {
      expect(preset.DEMO_MODE).toBe(false);
    });

    it('should have PDPA gate enabled', () => {
      expect(preset.PDPA_GATE_ENABLED).toBe(true);
    });

    it('should have PDPA strict mode enabled (hard enforcement)', () => {
      expect(preset.PDPA_STRICT_MODE).toBe(true);
    });

    it('should have breach scaffold enabled', () => {
      expect(preset.PDPA_BREACH_SCAFFOLD).toBe(true);
    });

    it('should have all strict modes enabled', () => {
      expect(preset.DOC_STRICT_MODE).toBe(true);
      expect(preset.PROOF_STRICT_MODE).toBe(true);
    });
  });
});

// =============================================================================
// NOTIFICATION TYPES (S0.5)
// =============================================================================

import {
  TEMPLATE_CLASS,
  MESSAGE_CLASS_CONSENT,
  getTemplateClass,
  requiresMarketingConsent,
  applyBundleRule,
  type MessageClass,
  type NotificationTemplate,
} from '../lib/types/notification';

describe('Sprint 0 — S0.5: Notification Classification', () => {
  describe('TEMPLATE_CLASS', () => {
    it('should classify DOCUMENT_RECEIVED as TRANSACTIONAL', () => {
      expect(TEMPLATE_CLASS.DOCUMENT_RECEIVED).toBe('TRANSACTIONAL');
    });

    it('should classify REQUEST_MISSING_DOCS as OPERATIONAL (PRD requirement)', () => {
      expect(TEMPLATE_CLASS.REQUEST_MISSING_DOCS).toBe('OPERATIONAL');
    });

    it('should classify TAC_SCHEDULED as TRANSACTIONAL', () => {
      expect(TEMPLATE_CLASS.TAC_SCHEDULED).toBe('TRANSACTIONAL');
    });

    it('should classify PROMOTION_OFFER as MARKETING', () => {
      expect(TEMPLATE_CLASS.PROMOTION_OFFER).toBe('MARKETING');
    });

    it('should classify NEWSLETTER as MARKETING', () => {
      expect(TEMPLATE_CLASS.NEWSLETTER).toBe('MARKETING');
    });

    it('should classify PDPA_BREACH_NOTIFICATION as TRANSACTIONAL (mandatory)', () => {
      expect(TEMPLATE_CLASS.PDPA_BREACH_NOTIFICATION).toBe('TRANSACTIONAL');
    });
  });

  describe('MESSAGE_CLASS_CONSENT mapping', () => {
    it('should map TRANSACTIONAL to PDPA_BASIC', () => {
      expect(MESSAGE_CLASS_CONSENT.TRANSACTIONAL).toBe('PDPA_BASIC');
    });

    it('should map OPERATIONAL to PDPA_BASIC', () => {
      expect(MESSAGE_CLASS_CONSENT.OPERATIONAL).toBe('PDPA_BASIC');
    });

    it('should map MARKETING to PDPA_MARKETING', () => {
      expect(MESSAGE_CLASS_CONSENT.MARKETING).toBe('PDPA_MARKETING');
    });
  });

  describe('getTemplateClass helper', () => {
    it('should get class for template', () => {
      expect(getTemplateClass('DOCUMENT_RECEIVED')).toBe('TRANSACTIONAL');
      expect(getTemplateClass('PROMOTION_OFFER')).toBe('MARKETING');
    });
  });

  describe('requiresMarketingConsent helper', () => {
    it('should return true for marketing templates', () => {
      expect(requiresMarketingConsent('PROMOTION_OFFER')).toBe(true);
      expect(requiresMarketingConsent('CROSS_SELL')).toBe(true);
    });

    it('should return false for non-marketing templates', () => {
      expect(requiresMarketingConsent('CASE_CREATED')).toBe(false);
      expect(requiresMarketingConsent('REQUEST_MISSING_DOCS')).toBe(false);
    });
  });

  describe('applyBundleRule (bundle rule detection)', () => {
    it('should reclassify to MARKETING when promotional content present', () => {
      expect(applyBundleRule('TRANSACTIONAL', true)).toBe('MARKETING');
      expect(applyBundleRule('OPERATIONAL', true)).toBe('MARKETING');
    });

    it('should keep original class when no promotional content', () => {
      expect(applyBundleRule('TRANSACTIONAL', false)).toBe('TRANSACTIONAL');
      expect(applyBundleRule('OPERATIONAL', false)).toBe('OPERATIONAL');
    });

    it('should keep MARKETING as MARKETING regardless', () => {
      expect(applyBundleRule('MARKETING', true)).toBe('MARKETING');
      expect(applyBundleRule('MARKETING', false)).toBe('MARKETING');
    });
  });
});

// =============================================================================
// AUTH LEDGER TYPES (S0.4)
// =============================================================================

import {
  AUTH_EVENT_CATEGORIES,
  AUTH_EVENT_LABELS,
  FAILURE_REASONS,
  type AuthEventType,
} from '../lib/types/auth-ledger';

describe('Sprint 0 — S0.4: Auth Ledger Types', () => {
  const authEventTypes = Object.keys(AUTH_EVENT_CATEGORIES) as AuthEventType[];

  describe('AUTH_EVENT_CATEGORIES', () => {
    it('should include login events', () => {
      expect(authEventTypes).toContain('LOGIN_SUCCESS');
      expect(authEventTypes).toContain('LOGIN_FAILED');
    });

    it('should include logout events', () => {
      expect(authEventTypes).toContain('LOGOUT');
      expect(authEventTypes).toContain('SESSION_EXPIRED');
    });

    it('should include MFA events', () => {
      expect(authEventTypes).toContain('MFA_CHALLENGE');
      expect(authEventTypes).toContain('MFA_SUCCESS');
      expect(authEventTypes).toContain('MFA_FAILED');
    });

    it('should include security events', () => {
      expect(authEventTypes).toContain('ACCOUNT_LOCKED');
      expect(authEventTypes).toContain('ACCOUNT_UNLOCKED');
      expect(authEventTypes).toContain('PASSWORD_RESET_REQUEST');
    });

    it('should include permission events', () => {
      expect(authEventTypes).toContain('PERMISSION_GRANTED');
      expect(authEventTypes).toContain('PERMISSION_REVOKED');
    });

    it('should categorize events correctly', () => {
      expect(AUTH_EVENT_CATEGORIES.LOGIN_SUCCESS).toBe('session');
      expect(AUTH_EVENT_CATEGORIES.LOGIN_FAILED).toBe('security');
      expect(AUTH_EVENT_CATEGORIES.MFA_CHALLENGE).toBe('mfa');
      expect(AUTH_EVENT_CATEGORIES.ACCOUNT_LOCKED).toBe('security');
    });
  });

  describe('AUTH_EVENT_LABELS', () => {
    it('should have bilingual labels for all events', () => {
      authEventTypes.forEach(eventType => {
        expect(AUTH_EVENT_LABELS[eventType].bm).toBeTruthy();
        expect(AUTH_EVENT_LABELS[eventType].en).toBeTruthy();
      });
    });
  });

  describe('FAILURE_REASONS', () => {
    it('should include common failure reasons', () => {
      expect(FAILURE_REASONS.INVALID_CREDENTIALS).toBe('invalid_credentials');
      expect(FAILURE_REASONS.ACCOUNT_LOCKED).toBe('account_locked');
      expect(FAILURE_REASONS.MFA_REQUIRED).toBe('mfa_required');
      expect(FAILURE_REASONS.CONSENT_REQUIRED).toBe('consent_required');
    });
  });
});

// =============================================================================
// BREACH TYPES (S0.6)
// =============================================================================

import {
  BREACH_SEVERITY_CONFIG,
  BREACH_STATUS_CONFIG,
  BREACH_NOTIFICATION_DEADLINE_HOURS,
  COMMON_DATA_TYPES,
  calculateDeadlineStatus,
  type BreachSeverity,
  type BreachStatus,
  type DeadlineStatus,
} from '../lib/types/breach';

describe('Sprint 0 — S0.6: Breach & Retention Types', () => {
  describe('BREACH_NOTIFICATION_DEADLINE_HOURS', () => {
    it('should be 72 hours per PDPA 2024', () => {
      expect(BREACH_NOTIFICATION_DEADLINE_HOURS).toBe(72);
    });
  });

  describe('BREACH_SEVERITY_CONFIG', () => {
    const severities: BreachSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

    it('should have all severity levels', () => {
      severities.forEach(sev => {
        expect(BREACH_SEVERITY_CONFIG[sev]).toBeDefined();
      });
    });

    it('should have bilingual labels', () => {
      severities.forEach(sev => {
        expect(BREACH_SEVERITY_CONFIG[sev].label.bm).toBeTruthy();
        expect(BREACH_SEVERITY_CONFIG[sev].label.en).toBeTruthy();
      });
    });

    it('should have 72h deadline for all severities', () => {
      severities.forEach(sev => {
        expect(BREACH_SEVERITY_CONFIG[sev].deadlineHours).toBe(72);
      });
    });

    it('should require commissioner notification for MEDIUM+ severity', () => {
      expect(BREACH_SEVERITY_CONFIG.LOW.requiresCommissioner).toBe(false);
      expect(BREACH_SEVERITY_CONFIG.MEDIUM.requiresCommissioner).toBe(true);
      expect(BREACH_SEVERITY_CONFIG.HIGH.requiresCommissioner).toBe(true);
      expect(BREACH_SEVERITY_CONFIG.CRITICAL.requiresCommissioner).toBe(true);
    });
  });

  describe('BREACH_STATUS_CONFIG', () => {
    const statuses: BreachStatus[] = [
      'DETECTED', 'CONFIRMED', 'COMMISSIONER_NOTIFIED',
      'AFFECTED_NOTIFIED', 'REMEDIATED', 'CLOSED', 'REOPENED'
    ];

    it('should have all status types', () => {
      statuses.forEach(status => {
        expect(BREACH_STATUS_CONFIG[status]).toBeDefined();
      });
    });

    it('should have bilingual labels', () => {
      statuses.forEach(status => {
        expect(BREACH_STATUS_CONFIG[status].label.bm).toBeTruthy();
        expect(BREACH_STATUS_CONFIG[status].label.en).toBeTruthy();
      });
    });
  });

  describe('COMMON_DATA_TYPES', () => {
    it('should include critical Malaysian data types', () => {
      expect(COMMON_DATA_TYPES).toContain('IC_NUMBER');
      expect(COMMON_DATA_TYPES).toContain('PASSPORT_NUMBER');
      expect(COMMON_DATA_TYPES).toContain('BANK_ACCOUNT');
      expect(COMMON_DATA_TYPES).toContain('SALARY_INFO');
    });

    it('should include personal data types', () => {
      expect(COMMON_DATA_TYPES).toContain('ADDRESS');
      expect(COMMON_DATA_TYPES).toContain('PHONE_NUMBER');
      expect(COMMON_DATA_TYPES).toContain('EMAIL');
    });

    it('should include sensitive data types', () => {
      expect(COMMON_DATA_TYPES).toContain('MEDICAL_RECORDS');
      expect(COMMON_DATA_TYPES).toContain('BIOMETRIC_DATA');
    });
  });

  describe('calculateDeadlineStatus', () => {
    it('should return ON_TRACK for >48h remaining', () => {
      const deadline = new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString();
      expect(calculateDeadlineStatus(deadline)).toBe('ON_TRACK');
    });

    it('should return WARNING for <48h remaining', () => {
      const deadline = new Date(Date.now() + 40 * 60 * 60 * 1000).toISOString();
      expect(calculateDeadlineStatus(deadline)).toBe('WARNING');
    });

    it('should return URGENT for <24h remaining', () => {
      const deadline = new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString();
      expect(calculateDeadlineStatus(deadline)).toBe('URGENT');
    });

    it('should return CRITICAL for <12h remaining', () => {
      const deadline = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
      expect(calculateDeadlineStatus(deadline)).toBe('CRITICAL');
    });

    it('should return OVERDUE for past deadlines', () => {
      const deadline = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
      expect(calculateDeadlineStatus(deadline)).toBe('OVERDUE');
    });
  });
});

// =============================================================================
// SERVICE EXPORTS VERIFICATION
// =============================================================================

describe('Sprint 0 — Service Exports', () => {
  it('should export consent service functions', async () => {
    const { getConsentService, canBuyerProceed, checkBuyerConsent } = await import('../lib/services/index');
    expect(typeof getConsentService).toBe('function');
    expect(typeof canBuyerProceed).toBe('function');
    expect(typeof checkBuyerConsent).toBe('function');
  });

  it('should export auth ledger functions', async () => {
    const { getAuthLedgerService, isAccountLocked, logLogin, logLogout } = await import('../lib/services/index');
    expect(typeof getAuthLedgerService).toBe('function');
    expect(typeof isAccountLocked).toBe('function');
    expect(typeof logLogin).toBe('function');
    expect(typeof logLogout).toBe('function');
  });

  it('should export notification service functions', async () => {
    const { getNotificationService, sendNotification, wouldBeBlocked } = await import('../lib/services/index');
    expect(typeof getNotificationService).toBe('function');
    expect(typeof sendNotification).toBe('function');
    expect(typeof wouldBeBlocked).toBe('function');
  });

  it('should export breach service functions', async () => {
    const { getBreachService, createBreachIncident, checkBreachDeadlines, executeRetentionPurges } = await import('../lib/services/index');
    expect(typeof getBreachService).toBe('function');
    expect(typeof createBreachIncident).toBe('function');
    expect(typeof checkBreachDeadlines).toBe('function');
    expect(typeof executeRetentionPurges).toBe('function');
  });

  it('should export feature flag functions', async () => {
    const { getFeatureFlagsService, isFeatureEnabled, isDemoMode, isPdpaGateEnabled } = await import('../lib/services/feature-flags');
    expect(typeof getFeatureFlagsService).toBe('function');
    expect(typeof isFeatureEnabled).toBe('function');
    expect(typeof isDemoMode).toBe('function');
  });
});

// =============================================================================
// HOOKS EXPORTS VERIFICATION
// =============================================================================

describe('Sprint 0 — Hook Exports', () => {
  it('should export consent guard hook', async () => {
    const { useConsentGuard, useBuyerHash, useHasConsent } = await import('../lib/hooks/index');
    expect(typeof useConsentGuard).toBe('function');
    expect(typeof useBuyerHash).toBe('function');
    expect(typeof useHasConsent).toBe('function');
  });

  it('should export auth ledger hook', async () => {
    const { useAuthLedger, useAccountLockStatus } = await import('../lib/hooks/index');
    expect(typeof useAuthLedger).toBe('function');
    expect(typeof useAccountLockStatus).toBe('function');
  });

  it('should export notification hook', async () => {
    const { useNotification, useCanSendNotification } = await import('../lib/hooks/index');
    expect(typeof useNotification).toBe('function');
    expect(typeof useCanSendNotification).toBe('function');
  });
});
