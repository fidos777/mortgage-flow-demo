// lib/services/supabase-client.ts
// P3-2: Supabase Client for Lead/Case Tables
// Provides type-safe database access

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// Database Types (aligned with SQL schema)
// =============================================================================

export interface DbProject {
  id: string;
  name: string;
  developer_name: string | null;
  location: string | null;
  total_units: number;
  sold_units: number;
  loan_in_progress: number;
  default_loan_types: number[];
  link_expiry_days: number;
  created_at: string;
  updated_at: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
}

export interface DbAgent {
  id: string;
  project_id: string;
  agent_hash: string;
  total_cases: number;
  completed_cases: number;
  created_at: string;
  last_active_at: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface DbLead {
  id: string;
  project_id: string;
  agent_id: string | null;
  source: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
  employment_type: string | null;
  income_band: string | null;
  service_years_band: string | null;
  loan_type_code: number | null;
  property_price_band: string | null;
  created_at: string;
  updated_at: string;
  contacted_at: string | null;
  qualified_at: string | null;
  converted_at: string | null;
  case_id: string | null;
}

export interface DbCase {
  id: string;
  project_id: string;
  agent_id: string | null;
  lead_id: string | null;
  phase: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  loan_type_code: number | null;
  loan_type: string | null;
  property_price_band: string | null;
  readiness_band: 'ready' | 'caution' | 'not_ready' | null;
  dsr_band: 'SIHAT' | 'SEDERHANA' | 'TINGGI' | null;
  docs_total: number;
  docs_uploaded: number;
  docs_verified: number;
  query_risk: 'none' | 'low' | 'medium' | 'high';
  kj_status: 'pending' | 'received' | 'overdue' | null;
  kj_days: number | null;
  lo_received_at: string | null;
  lo_expires_at: string | null;
  tac_scheduled_at: string | null;
  tac_confirmed: boolean;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  completed_at: string | null;
}

export interface DbDocument {
  id: string;
  case_id: string;
  doc_type: string;
  doc_name: string | null;
  status: 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED';
  confidence_level: 'HIGH_CONFIDENCE' | 'LOW_CONFIDENCE' | 'NEEDS_REVIEW' | null;
  created_at: string;
  uploaded_at: string | null;
  verified_at: string | null;
  storage_path: string | null;
}

export interface DbLink {
  id: string;
  project_id: string;
  case_id: string | null;
  agent_id: string | null;
  link_type: 'BUYER_INVITE' | 'DOC_UPLOAD' | 'TAC_CONFIRM' | 'KJ_VIEW';
  status: 'CREATED' | 'SENT' | 'OPENED' | 'COMPLETED' | 'EXPIRED' | 'REVOKED';
  created_at: string;
  sent_at: string | null;
  expires_at: string;
  opened_at: string | null;
  completed_at: string | null;
  revoked_at: string | null;
  otp_required: boolean;
  otp_verified: boolean;
  otp_attempts: number;
  otp_locked_until: string | null;
  max_opens: number;
  open_count: number;
  buyer_phone_hash: string | null;
}

// =============================================================================
// Supabase Client Setup
// =============================================================================

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and Key must be set in environment variables');
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: typeof window !== 'undefined',
    },
  });

  return supabaseClient;
}

// =============================================================================
// Case Service (Supabase Implementation)
// =============================================================================

export const SupabaseCaseService = {
  async getCases(projectId: string): Promise<DbCase[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('cases')
      .select('*')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getCaseById(caseId: string): Promise<DbCase | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createCase(caseData: Partial<DbCase>): Promise<DbCase> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('cases')
      .insert(caseData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateCase(caseId: string, updates: Partial<DbCase>): Promise<DbCase> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('cases')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', caseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePhase(caseId: string, phase: string): Promise<void> {
    await this.updateCase(caseId, { phase });
  },
};

// =============================================================================
// Lead Service
// =============================================================================

export const SupabaseLeadService = {
  async getLeads(projectId: string): Promise<DbLead[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('leads')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createLead(leadData: Partial<DbLead>): Promise<DbLead> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async convertToCases(leadId: string, caseId: string): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client
      .from('leads')
      .update({
        status: 'CONVERTED',
        converted_at: new Date().toISOString(),
        case_id: caseId,
      })
      .eq('id', leadId);

    if (error) throw error;
  },
};

// =============================================================================
// Link Service (P3-3: Hardened)
// =============================================================================

export const SupabaseLinkService = {
  async createLink(linkData: Partial<DbLink>): Promise<DbLink> {
    const client = getSupabaseClient();

    // Set default expiry if not provided
    const expiresAt = linkData.expires_at ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await client
      .from('links')
      .insert({ ...linkData, expires_at: expiresAt })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async validateLink(linkId: string): Promise<{ valid: boolean; reason?: string }> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .rpc('is_link_valid', { link_id: linkId });

    if (error) throw error;
    return { valid: data };
  },

  async recordOpen(linkId: string, ip: string, userAgent: string): Promise<void> {
    const client = getSupabaseClient();

    // Get current link
    const { data: link, error: getError } = await client
      .from('links')
      .select('open_count, ip_addresses, user_agents')
      .eq('id', linkId)
      .single();

    if (getError) throw getError;

    // Update with new access info
    const { error } = await client
      .from('links')
      .update({
        status: 'OPENED',
        opened_at: link.open_count === 0 ? new Date().toISOString() : undefined,
        open_count: link.open_count + 1,
        ip_addresses: [...(link.ip_addresses || []), ip].slice(-10),
        user_agents: [...(link.user_agents || []), userAgent].slice(-10),
      })
      .eq('id', linkId);

    if (error) throw error;
  },

  async verifyOtp(linkId: string, success: boolean): Promise<void> {
    const client = getSupabaseClient();

    if (success) {
      const { error } = await client
        .from('links')
        .update({ otp_verified: true })
        .eq('id', linkId);
      if (error) throw error;
    } else {
      // Increment attempts, lock if too many
      const { data: link } = await client
        .from('links')
        .select('otp_attempts')
        .eq('id', linkId)
        .single();

      const newAttempts = (link?.otp_attempts || 0) + 1;
      const lockUntil = newAttempts >= 3
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
        : null;

      const { error } = await client
        .from('links')
        .update({
          otp_attempts: newAttempts,
          otp_locked_until: lockUntil,
        })
        .eq('id', linkId);

      if (error) throw error;
    }
  },

  async completeLink(linkId: string): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client
      .from('links')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
      })
      .eq('id', linkId);

    if (error) throw error;
  },

  async revokeLink(linkId: string): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client
      .from('links')
      .update({
        status: 'REVOKED',
        revoked_at: new Date().toISOString(),
      })
      .eq('id', linkId);

    if (error) throw error;
  },
};

// =============================================================================
// Metrics Service (P3-6)
// =============================================================================

export const SupabaseMetricsService = {
  async getFunnelMetrics(projectId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('funnel_metrics')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getCasePipeline(projectId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('case_pipeline')
      .select('*')
      .eq('project_id', projectId);

    if (error) throw error;
    return data || [];
  },

  async getTimeToReady(projectId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('time_to_ready')
      .select('*')
      .eq('project_id', projectId);

    if (error) throw error;
    return data || [];
  },

  async getDocCompletionRates(projectId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('doc_completion_rates')
      .select('*')
      .eq('project_id', projectId);

    if (error) throw error;
    return data || [];
  },

  async getAgentPerformance(projectId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('agent_performance')
      .select('*')
      .eq('project_id', projectId);

    if (error) throw error;
    return data || [];
  },

  async getLinkConversion(projectId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('link_conversion')
      .select('*')
      .eq('project_id', projectId);

    if (error) throw error;
    return data || [];
  },
};

// =============================================================================
// Document Service
// =============================================================================

export const SupabaseDocumentService = {
  async getDocuments(caseId: string): Promise<DbDocument[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('documents')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createDocument(docData: Partial<DbDocument>): Promise<DbDocument> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('documents')
      .insert(docData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateDocumentStatus(
    docId: string,
    status: DbDocument['status'],
    confidenceLevel?: DbDocument['confidence_level']
  ): Promise<void> {
    const client = getSupabaseClient();
    const updates: Partial<DbDocument> = { status };

    if (status === 'UPLOADED') updates.uploaded_at = new Date().toISOString();
    if (status === 'VERIFIED') updates.verified_at = new Date().toISOString();
    if (confidenceLevel) updates.confidence_level = confidenceLevel;

    const { error } = await client
      .from('documents')
      .update(updates)
      .eq('id', docId);

    if (error) throw error;
  },
};
