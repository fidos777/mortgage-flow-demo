// lib/services/developer-auth-service.ts
// SF.1: Developer PDPA Authorization Service
// PRD v3.6.3 CR-010B — Controller-Processor enforcement

import {
  DeveloperAuthorization,
  AuthorizationStatus,
  AuthorizationCheck,
  AgentAppointmentCheck,
  CreateAuthorizationInput,
  SignAuthorizationInput,
  RevokeAuthorizationInput,
  AddAgentInput,
  Acknowledgements,
  AppointedAgent,
  REQUIRED_ACKNOWLEDGEMENTS,
  AcknowledgementType,
  AuthorizationProofEvent,
} from '@/lib/types/developer-authorization';

// =============================================================================
// IN-MEMORY STORE (Demo Mode)
// =============================================================================

// In production, replace with Supabase queries
const authorizationStore: Map<string, DeveloperAuthorization> = new Map();

// Demo seed data
const DEMO_DEVELOPER_ID = 'dev-001-demo';
const DEMO_AUTHORIZATION: DeveloperAuthorization = {
  id: 'auth-001-demo',
  developer_id: DEMO_DEVELOPER_ID,
  company_name: 'Seri Maya Development Sdn Bhd',
  ssm_number: '202401012345',
  company_address: 'Level 15, Menara PKNS, 40000 Shah Alam, Selangor',
  authorized_person: 'Dato Ahmad bin Ismail',
  authorized_email: 'ahmad@serimaya.com.my',
  authorized_phone: '0123456789',
  authorized_designation: 'Pengarah Urusan',
  appointed_agents: [
    {
      // Global Fiz Resources Sdn Bhd - Mortgage Agent
      agent_id: 'agent-001',
      name: 'Siti Aminah (Global Fiz Resources)',
      phone: '0129876543',
      email: 'siti@globalfiz.com.my',
      appointed_at: '2026-01-15T10:00:00Z',
    },
    {
      // Global Fiz Resources Sdn Bhd - Mortgage Agent
      agent_id: 'agent-002',
      name: 'Mohd Faizal (Global Fiz Resources)',
      phone: '0127654321',
      email: 'faizal@globalfiz.com.my',
      appointed_at: '2026-01-15T10:00:00Z',
    },
  ],
  acknowledgements: {
    NO_PII_ACCESS: { agreed: true, timestamp: '2026-01-15T10:05:00Z' },
    AGGREGATE_ONLY: { agreed: true, timestamp: '2026-01-15T10:05:00Z' },
    APPOINTED_AGENTS_DECLARED: { agreed: true, timestamp: '2026-01-15T10:05:00Z' },
    DATA_RETENTION_UNDERSTOOD: { agreed: true, timestamp: '2026-01-15T10:05:00Z' },
    BREACH_REPORTING_AGREED: { agreed: true, timestamp: '2026-01-15T10:05:00Z' },
  },
  status: 'ACTIVE',
  signed_at: '2026-01-15T10:05:00Z',
  expires_at: '2027-01-15T10:05:00Z',
  auth_version: 1,
  project_scope: 'all',
  created_at: '2026-01-15T09:00:00Z',
  updated_at: '2026-01-15T10:05:00Z',
};

// Initialize demo data
authorizationStore.set(DEMO_AUTHORIZATION.id, DEMO_AUTHORIZATION);

// =============================================================================
// PROOF EVENT LOGGING
// =============================================================================

interface ProofEventPayload {
  event_type: AuthorizationProofEvent;
  authorization_id?: string;
  developer_id: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const proofEventLog: ProofEventPayload[] = [];

function logProofEvent(payload: ProofEventPayload): void {
  proofEventLog.push(payload);
  // In production, this would write to proof_events table
  console.log(`[PROOF] ${payload.event_type}:`, payload);
}

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Check if developer has valid PDPA authorization
 * USE BEFORE: Generating QR links, creating invitations, accessing dashboard
 */
export function checkAuthorization(developerId: string): AuthorizationCheck {
  const auth = findActiveAuthorization(developerId);

  if (!auth) {
    // Log unauthorized access attempt
    logProofEvent({
      event_type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      developer_id: developerId,
      timestamp: new Date().toISOString(),
      metadata: { reason: 'NO_ACTIVE_AUTHORIZATION' },
    });

    return {
      has_authorization: false,
      reason: 'Tiada kebenaran PDPA yang aktif. Sila lengkapkan Kebenaran Pemaju.',
    };
  }

  // Check expiry
  const expiresAt = new Date(auth.expires_at!);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry <= 0) {
    logProofEvent({
      event_type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      authorization_id: auth.id,
      developer_id: developerId,
      timestamp: new Date().toISOString(),
      metadata: { reason: 'AUTHORIZATION_EXPIRED', expired_at: auth.expires_at },
    });

    return {
      has_authorization: false,
      authorization_id: auth.id,
      status: 'EXPIRED',
      expires_at: auth.expires_at,
      reason: 'Kebenaran PDPA telah tamat tempoh. Sila perbaharui.',
    };
  }

  // Check required acknowledgements
  const missingAcks = REQUIRED_ACKNOWLEDGEMENTS.filter(
    (ack) => !auth.acknowledgements[ack]?.agreed
  );

  if (missingAcks.length > 0) {
    return {
      has_authorization: false,
      authorization_id: auth.id,
      status: auth.status,
      missing_acknowledgements: missingAcks,
      reason: 'Pengakuan wajib belum dilengkapkan.',
    };
  }

  return {
    has_authorization: true,
    authorization_id: auth.id,
    status: auth.status,
    expires_at: auth.expires_at,
    days_until_expiry: daysUntilExpiry,
  };
}

/**
 * Check if agent is appointed by developer
 * USE BEFORE: Assigning cases to agent
 */
export function checkAgentAppointment(
  developerId: string,
  agentId: string
): AgentAppointmentCheck {
  const auth = findActiveAuthorization(developerId);

  if (!auth) {
    return {
      is_appointed: false,
      reason: 'Pemaju tidak mempunyai kebenaran PDPA yang aktif.',
    };
  }

  const appointment = auth.appointed_agents.find(
    (a) => a.agent_id === agentId && !a.revoked_at
  );

  if (!appointment) {
    logProofEvent({
      event_type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      authorization_id: auth.id,
      developer_id: developerId,
      timestamp: new Date().toISOString(),
      metadata: { reason: 'AGENT_NOT_APPOINTED', agent_id: agentId },
    });

    return {
      is_appointed: false,
      authorization_id: auth.id,
      reason: 'Ejen tidak dilantik oleh pemaju ini.',
    };
  }

  return {
    is_appointed: true,
    authorization_id: auth.id,
    appointed_at: appointment.appointed_at,
  };
}

/**
 * Create a new authorization (PENDING status)
 */
export function createAuthorization(
  input: CreateAuthorizationInput
): DeveloperAuthorization {
  const id = `auth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  const auth: DeveloperAuthorization = {
    id,
    developer_id: input.developer_id,
    company_name: input.company_name,
    ssm_number: input.ssm_number,
    company_address: input.company_address,
    authorized_person: input.authorized_person,
    authorized_email: input.authorized_email,
    authorized_phone: input.authorized_phone,
    authorized_designation: input.authorized_designation,
    appointed_agents: input.appointed_agents || [],
    acknowledgements: {},
    status: 'PENDING',
    auth_version: 1,
    project_scope: input.project_scope || 'all',
    created_at: now,
    updated_at: now,
  };

  authorizationStore.set(id, auth);
  return auth;
}

/**
 * Sign authorization (PENDING → ACTIVE)
 */
export function signAuthorization(
  input: SignAuthorizationInput
): DeveloperAuthorization {
  const auth = authorizationStore.get(input.authorization_id);

  if (!auth) {
    throw new Error('Kebenaran tidak ditemui.');
  }

  if (auth.status !== 'PENDING') {
    throw new Error('Hanya kebenaran PENDING boleh ditandatangani.');
  }

  // Validate required acknowledgements
  const missingAcks = REQUIRED_ACKNOWLEDGEMENTS.filter(
    (ack) => !input.acknowledgements[ack]?.agreed
  );

  if (missingAcks.length > 0) {
    throw new Error(
      `Pengakuan wajib belum dilengkapkan: ${missingAcks.join(', ')}`
    );
  }

  const now = new Date();
  const validityDays = input.validity_days || 365;
  const expiresAt = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

  const updatedAuth: DeveloperAuthorization = {
    ...auth,
    acknowledgements: input.acknowledgements,
    status: 'ACTIVE',
    signed_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    updated_at: now.toISOString(),
  };

  authorizationStore.set(auth.id, updatedAuth);

  // Log proof event
  logProofEvent({
    event_type: 'DEVELOPER_AUTHORIZED',
    authorization_id: auth.id,
    developer_id: auth.developer_id,
    timestamp: now.toISOString(),
    metadata: {
      company_name: auth.company_name,
      ssm_number: auth.ssm_number,
      expires_at: expiresAt.toISOString(),
      acknowledgements: Object.keys(input.acknowledgements),
    },
  });

  return updatedAuth;
}

/**
 * Revoke authorization (ACTIVE → REVOKED)
 */
export function revokeAuthorization(
  input: RevokeAuthorizationInput
): DeveloperAuthorization {
  const auth = authorizationStore.get(input.authorization_id);

  if (!auth) {
    throw new Error('Kebenaran tidak ditemui.');
  }

  if (auth.status !== 'ACTIVE') {
    throw new Error('Hanya kebenaran ACTIVE boleh dibatalkan.');
  }

  const now = new Date().toISOString();

  const updatedAuth: DeveloperAuthorization = {
    ...auth,
    status: 'REVOKED',
    revoked_at: now,
    revoked_by: input.revoked_by,
    revocation_reason: input.reason,
    updated_at: now,
  };

  authorizationStore.set(auth.id, updatedAuth);

  // Log proof event
  logProofEvent({
    event_type: 'DEVELOPER_AUTH_REVOKED',
    authorization_id: auth.id,
    developer_id: auth.developer_id,
    timestamp: now,
    metadata: {
      revoked_by: input.revoked_by,
      reason: input.reason,
    },
  });

  return updatedAuth;
}

/**
 * Add appointed agent to authorization
 */
export function addAppointedAgent(input: AddAgentInput): DeveloperAuthorization {
  const auth = authorizationStore.get(input.authorization_id);

  if (!auth) {
    throw new Error('Kebenaran tidak ditemui.');
  }

  if (auth.status !== 'ACTIVE') {
    throw new Error('Hanya kebenaran ACTIVE boleh dikemaskini.');
  }

  // Check if agent already appointed
  if (auth.appointed_agents.some((a) => a.agent_id === input.agent_id && !a.revoked_at)) {
    throw new Error('Ejen sudah dilantik.');
  }

  const now = new Date().toISOString();

  const newAgent: AppointedAgent = {
    agent_id: input.agent_id,
    name: input.agent_name,
    phone: input.agent_phone,
    email: input.agent_email,
    appointed_at: now,
  };

  const updatedAuth: DeveloperAuthorization = {
    ...auth,
    appointed_agents: [...auth.appointed_agents, newAgent],
    updated_at: now,
  };

  authorizationStore.set(auth.id, updatedAuth);

  // Log proof event
  logProofEvent({
    event_type: 'DEVELOPER_AUTH_UPDATED',
    authorization_id: auth.id,
    developer_id: auth.developer_id,
    timestamp: now,
    metadata: {
      action: 'AGENT_ADDED',
      agent_id: input.agent_id,
      agent_name: input.agent_name,
    },
  });

  return updatedAuth;
}

/**
 * Get authorization by ID
 */
export function getAuthorization(authId: string): DeveloperAuthorization | null {
  return authorizationStore.get(authId) || null;
}

/**
 * Get all authorizations for a developer
 */
export function getDeveloperAuthorizations(
  developerId: string
): DeveloperAuthorization[] {
  return Array.from(authorizationStore.values()).filter(
    (auth) => auth.developer_id === developerId
  );
}

/**
 * Get active authorization for developer
 */
export function findActiveAuthorization(
  developerId: string
): DeveloperAuthorization | null {
  const auths = getDeveloperAuthorizations(developerId);
  const now = new Date();

  return (
    auths.find(
      (auth) =>
        auth.status === 'ACTIVE' &&
        auth.expires_at &&
        new Date(auth.expires_at) > now
    ) || null
  );
}

/**
 * Expire all authorizations past their expiry date
 * Call this from a daily cron job
 */
export function expireAuthorizations(): number {
  const now = new Date();
  let expiredCount = 0;

  authorizationStore.forEach((auth, id) => {
    if (
      auth.status === 'ACTIVE' &&
      auth.expires_at &&
      new Date(auth.expires_at) <= now
    ) {
      const updatedAuth: DeveloperAuthorization = {
        ...auth,
        status: 'EXPIRED',
        updated_at: now.toISOString(),
      };
      authorizationStore.set(id, updatedAuth);
      expiredCount++;

      // Log proof event
      logProofEvent({
        event_type: 'DEVELOPER_AUTH_EXPIRED',
        authorization_id: auth.id,
        developer_id: auth.developer_id,
        timestamp: now.toISOString(),
        metadata: { expired_at: auth.expires_at },
      });
    }
  });

  return expiredCount;
}

// =============================================================================
// EXPORTS FOR ENFORCEMENT
// =============================================================================

export {
  // Re-export types
  type DeveloperAuthorization,
  type AuthorizationCheck,
  type AgentAppointmentCheck,
};

// =============================================================================
// DEMO UTILITIES
// =============================================================================

/**
 * Get demo developer ID (for testing)
 */
export function getDemoDeveloperId(): string {
  return DEMO_DEVELOPER_ID;
}

/**
 * Reset store to demo state (for testing)
 */
export function resetToDemo(): void {
  authorizationStore.clear();
  authorizationStore.set(DEMO_AUTHORIZATION.id, { ...DEMO_AUTHORIZATION });
}
