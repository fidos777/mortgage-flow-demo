// types/stakeholder.ts
// Role definitions aligned with PRD v3.4 Sections 6-13

export type Role = 'buyer' | 'agent' | 'developer' | 'system';

export interface PermissionMatrix {
  canView: string[];
  cannotView: string[];
  canAction: string[];
  cannotAction: string[];
}

// PRD Section 7.3, 8.2, 9.2, 13.2-13.3
export const ROLE_PERMISSIONS: Record<Role, PermissionMatrix> = {
  buyer: {
    canView: [
      'own_case_status',
      'own_documents',
      'timeline',
      'next_action',
    ],
    cannotView: [
      'scoring_breakdown',
      'risk_flags',
      'internal_state',
      'income_calculations',
      'other_cases',
    ],
    canAction: [
      'upload_documents',
      'authorize_agent',
      'confirm_tac',
      'respond_query',
    ],
    cannotAction: [
      'create_link',
      'edit_form_fields',
      'submit_lppsa',
      'view_scoring_breakdown',
    ],
  },
  
  agent: {
    canView: [
      'case_status',
      'readiness_band',           // NOT exact score
      'document_completeness',
      'tac_timestamp',            // NOT tac code
      'employment_type',
      'income_range',             // NOT exact salary
      'query_signals',
    ],
    cannotView: [
      'raw_documents',
      'exact_salary',
      'tac_code',
      'scoring_breakdown',
      'confidence_percentage',    // Only HIGH/LOW labels
    ],
    canAction: [
      'create_link',
      'schedule_tac',
      'flag_corrections',
      'submit_to_lppsa',          // Manual portal entry
      'send_reminders',
    ],
    cannotAction: [
      'approve_reject',
      'view_tac_code',
      'override_buyer',
      'make_eligibility_decision',
    ],
  },
  
  developer: {
    canView: [
      'project_summary',
      'aggregate_counts',
      'conversion_rates',
      'status_distribution',
    ],
    cannotView: [
      'individual_buyer_data',
      'case_details',
      'documents',
      'readiness_scores',
      'buyer_names',
      'buyer_contact',
    ],
    canAction: [
      'create_bulk_links',
      'assign_agents',
      'view_analytics',
    ],
    cannotAction: [
      'view_buyer_data',
      'process_applications',
      'access_case_details',
    ],
  },
  
  system: {
    canView: ['all_for_processing'],
    cannotView: [],
    canAction: [
      'detect',
      'flag',
      'notify',
      'log',
      'compute',
      'assemble',
    ],
    cannotAction: [
      'decide',
      'submit',
      'approve',
      'override',
      'access_lppsa',
    ],
  },
};

// Role display configuration
export const ROLE_CONFIG: Record<Role, {
  label: string;
  labelBm: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  buyer: {
    label: 'Buyer',
    labelBm: 'Pembeli',
    icon: '👤',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500',
    description: 'Penjawat awam yang memohon pinjaman LPPSA',
  },
  agent: {
    label: 'Agent',
    labelBm: 'Ejen',
    icon: '🏢',
    color: 'text-orange-600',
    bgColor: 'bg-orange-500',
    description: 'Penyelaras permohonan pinjaman',
  },
  developer: {
    label: 'Developer',
    labelBm: 'Pemaju',
    icon: '🏗️',
    color: 'text-slate-600',
    bgColor: 'bg-slate-700',
    description: 'Pemaju hartanah (aggregate view sahaja)',
  },
  system: {
    label: 'System',
    labelBm: 'Sistem',
    icon: '⚙️',
    color: 'text-gray-600',
    bgColor: 'bg-gray-500',
    description: 'Proses automatik (advisory sahaja)',
  },
};
