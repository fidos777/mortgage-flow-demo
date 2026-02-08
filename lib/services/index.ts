// lib/services/index.ts
// Service Abstraction Layer
// This allows easy swap between mock (demo) and real (production) backends

import { Case, CasePhase, Document, TacSchedule } from '@/types/case';
import { ProofEvent } from '@/types/proof-event';
import { Role } from '@/types/stakeholder';

/**
 * Case Service Interface
 * Implement this interface for different backends
 */
export interface ICaseService {
  // Read operations
  getCases(role: Role): Promise<Case[]>;
  getCaseById(id: string, role: Role): Promise<Case | null>;
  
  // Write operations
  createCase(data: Partial<Case>): Promise<Case>;
  updatePhase(caseId: string, phase: CasePhase): Promise<void>;
  addDocument(caseId: string, doc: Document): Promise<void>;
  scheduleTac(caseId: string, schedule: TacSchedule): Promise<void>;
  confirmTac(caseId: string): Promise<void>;
}

/**
 * Proof Service Interface
 */
export interface IProofService {
  getEvents(caseId?: string): Promise<ProofEvent[]>;
  logEvent(event: Omit<ProofEvent, 'id' | 'timestamp'>): Promise<ProofEvent>;
}

/**
 * Auth Service Interface (for production)
 */
export interface IAuthService {
  getCurrentRole(): Promise<Role | null>;
  switchRole(role: Role): Promise<void>;
  verifyOtp(phone: string, otp: string): Promise<boolean>;
}

/**
 * Project Service Interface (for developer view)
 */
export interface IProjectService {
  getAggregates(): Promise<{
    totalCases: number;
    byPhase: Record<string, number>;
    conversionRate: number;
  }>;
  getProjectInfo(): Promise<{
    name: string;
    location: string;
    totalUnits: number;
    sold: number;
    loanInProgress: number;
  }>;
}

// =============================================================================
// Service Configuration
// =============================================================================

export type ServiceMode = 'mock' | 'api';

interface ServiceConfig {
  mode: ServiceMode;
  apiBaseUrl?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

let config: ServiceConfig = {
  mode: 'mock', // Default to mock for demo
};

/**
 * Configure services for production
 * Call this in app initialization to switch to real backend
 */
export function configureServices(newConfig: Partial<ServiceConfig>) {
  config = { ...config, ...newConfig };
}

/**
 * Get current service mode
 */
export function getServiceMode(): ServiceMode {
  return config.mode;
}

// =============================================================================
// Service Factory
// =============================================================================

// Lazy-loaded service instances
let caseService: ICaseService | null = null;
let proofService: IProofService | null = null;
let authService: IAuthService | null = null;
let projectService: IProjectService | null = null;

/**
 * Get Case Service instance
 * Returns mock or API implementation based on config
 */
export async function getCaseService(): Promise<ICaseService> {
  if (!caseService) {
    if (config.mode === 'api') {
      // Dynamic import for API implementation (when created)
      // const { ApiCaseService } = await import('./api/case-service');
      // caseService = new ApiCaseService(config.apiBaseUrl!);
      throw new Error('API service not yet implemented. Use mock mode.');
    } else {
      const { MockCaseService } = await import('./mock/case-service');
      caseService = new MockCaseService();
    }
  }
  return caseService;
}

/**
 * Get Proof Service instance
 */
export async function getProofService(): Promise<IProofService> {
  if (!proofService) {
    if (config.mode === 'api') {
      throw new Error('API service not yet implemented. Use mock mode.');
    } else {
      const { MockProofService } = await import('./mock/proof-service');
      proofService = new MockProofService();
    }
  }
  return proofService;
}

/**
 * Get Auth Service instance
 */
export async function getAuthService(): Promise<IAuthService> {
  if (!authService) {
    if (config.mode === 'api') {
      throw new Error('API service not yet implemented. Use mock mode.');
    } else {
      const { MockAuthService } = await import('./mock/auth-service');
      authService = new MockAuthService();
    }
  }
  return authService;
}

/**
 * Get Project Service instance
 */
export async function getProjectService(): Promise<IProjectService> {
  if (!projectService) {
    if (config.mode === 'api') {
      throw new Error('API service not yet implemented. Use mock mode.');
    } else {
      const { MockProjectService } = await import('./mock/project-service');
      projectService = new MockProjectService();
    }
  }
  return projectService;
}

// =============================================================================
// Feature Flags (P3-4)
// =============================================================================

export { initializeFromEnv as initializeFeatureFlags } from './feature-flags';
export { getFeatureFlagsService, isFeatureEnabled, isDemoMode, isOtpRequired, isDocStrictMode, useFeatureFlags } from './feature-flags';
export type { FeatureFlagKey, FlagPreset } from './feature-flags';

// =============================================================================
// Consent Service (Sprint 0 S0.1-S0.3)
// =============================================================================

export { getConsentService, canBuyerProceed, checkBuyerConsent } from './consent-service';
export { ConsentService } from './consent-service';

// =============================================================================
// Auth Ledger Service (Sprint 0 S0.4)
// =============================================================================

export { getAuthLedgerService, isAccountLocked, logLogin, logLogout } from './auth-ledger';
export { AuthLedgerService } from './auth-ledger';

// =============================================================================
// Notification Service (Sprint 0 S0.5)
// =============================================================================

export { getNotificationService, sendNotification, wouldBeBlocked, sendBreachNotification } from './notification-service';
export { NotificationService } from './notification-service';

// =============================================================================
// Breach & Retention Service (Sprint 0 S0.6)
// =============================================================================

export { getBreachService, createBreachIncident, checkBreachDeadlines, executeRetentionPurges } from './breach-service';
export { BreachService } from './breach-service';

// =============================================================================
// React Hooks (for convenience)
// =============================================================================

// These will be created in separate files using the services above
// Example:
// export { useCases } from './hooks/use-cases';
// export { useProofLog } from './hooks/use-proof-log';
