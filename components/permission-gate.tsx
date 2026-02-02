// components/permission-gate.tsx
'use client';

import { ReactNode } from 'react';
import { Role, ROLE_CONFIG } from '@/types/stakeholder';
import { canAccess } from '@/lib/orchestrator/permissions';
import { AlertTriangle, Lock } from 'lucide-react';

interface PermissionGateProps {
  role: Role;
  resource: string;
  action?: 'view' | 'action';
  children: ReactNode;
  fallback?: ReactNode;
  showDenied?: boolean;
}

/**
 * Permission Gate Component
 * Enforces PRD v3.4 stakeholder permission matrices
 */
export function PermissionGate({
  role,
  resource,
  action = 'view',
  children,
  fallback,
  showDenied = true,
}: PermissionGateProps) {
  const hasAccess = canAccess(role, resource, action);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (!showDenied) {
    return null;
  }
  
  // Default access denied message
  const config = ROLE_CONFIG[role];
  
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
      <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="font-semibold text-slate-700 mb-2">Akses Terhad</h3>
      <p className="text-sm text-slate-500 max-w-xs mx-auto">
        {getAccessDeniedMessage(role, resource)}
      </p>
    </div>
  );
}

/**
 * Get role-specific access denied message
 * PRD-compliant messaging that explains WHY access is restricted
 */
function getAccessDeniedMessage(role: Role, resource: string): string {
  const messages: Record<Role, Record<string, string>> = {
    buyer: {
      scoring_breakdown: 'Pecahan skor adalah untuk kegunaan dalaman sahaja.',
      other_cases: 'Anda hanya boleh melihat kes anda sendiri.',
      default: 'Maklumat ini tidak tersedia untuk pembeli.',
    },
    agent: {
      raw_documents: 'Ejen tidak dapat melihat dokumen mentah untuk melindungi privasi pembeli.',
      exact_salary: 'Hanya julat pendapatan ditunjukkan untuk melindungi privasi.',
      tac_code: 'Kod TAC hanya untuk pembeli. Ejen melihat cap masa sahaja.',
      confidence_percentage: 'Tahap keyakinan ditunjukkan sebagai HIGH/LOW sahaja.',
      default: 'Maklumat ini terhad untuk ejen.',
    },
    developer: {
      individual_buyer_data: 'Pemaju hanya dapat melihat data agregat projek.',
      case_details: 'Butiran kes tidak tersedia. Sila rujuk ringkasan projek.',
      documents: 'Dokumen pembeli tidak boleh diakses oleh pemaju.',
      default: 'Pemaju hanya mempunyai akses kepada pandangan agregat.',
    },
    system: {
      default: 'Tindakan ini memerlukan pengesahan manusia.',
    },
  };
  
  return messages[role][resource] || messages[role].default;
}

/**
 * PRD Compliance Warning Banner
 * Shows when displaying restricted information with appropriate context
 */
export function PermissionWarning({
  message,
  type = 'info',
}: {
  message: string;
  type?: 'info' | 'warning';
}) {
  return (
    <div className={`
      flex items-start gap-3 rounded-xl p-3 text-sm
      ${type === 'warning' 
        ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
        : 'bg-blue-50 border border-blue-200 text-blue-800'
      }
    `}>
      <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
        type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
      }`} />
      <p>{message}</p>
    </div>
  );
}

/**
 * PRD Authority Disclaimer
 * Required on all screens per PRD Section 4.9
 */
export function AuthorityDisclaimer({ variant = 'default' }: { variant?: 'default' | 'compact' | 'prominent' }) {
  if (variant === 'compact') {
    return (
      <p className="text-xs text-center text-slate-400">
        Sistem ini untuk rujukan sahaja. Tiada kelulusan dilakukan.
      </p>
    );
  }
  
  if (variant === 'prominent') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
        <p className="text-xs text-red-700 text-center font-medium">
          ⚠️ Sistem ini untuk rujukan sahaja. Tiada penghantaran atau kelulusan dilakukan oleh sistem.
        </p>
      </div>
    );
  }
  
  return (
    <div className="border-t border-slate-100 px-5 py-3 bg-slate-50">
      <p className="text-xs text-center text-slate-400">
        Sistem ini untuk rujukan sahaja. Tiada kelulusan dilakukan.
      </p>
    </div>
  );
}
