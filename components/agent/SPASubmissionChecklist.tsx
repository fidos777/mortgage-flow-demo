'use client';

/**
 * CR-KP-002 Sprint 1 (A8) — S&P Submission Checklist
 *
 * Agent-facing component for tracking S&P (Sale & Purchase) handoff workflow
 * and document submission to LPPSA. Features:
 *
 * 1. 6-step S&P handoff workflow (PRD 002-G) with proof events:
 *    - BOOKING_RECEIVED → SP_SIGNED → SP_COPY_PROVIDED
 *    - SP_SUBMITTED_TO_KJ → KJ_ENDORSEMENT_RECEIVED → DOCS_COMPLETE
 *    All events logged with authorityClaimed: false
 * 2. Document checklist with SPA-specific items + Akujanji Pemaju variants
 * 3. Joint application checklist items (when has_joint_purchaser = true)
 * 4. Three countdown timers from ATOR denda lewat deadlines:
 *    - 7 days: SPA → LPPSA submission
 *    - 14 days: Borang cagaran signing after approval letter
 *    - 30 days: Cagaran registration after BPP signing
 * 5. Amber alert when SP_COPY_PROVIDED unchecked at LO/KJ stage
 *
 * Source: CR-KP-002_Blocker_Reference_Pack.md Section 6 (LPPSA/ATOR)
 * Communication chain: Developer → Agent → Buyer (PRD Section 002-F)
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Shield,
  ChevronDown,
  ChevronRight,
  Building2,
  Scale,
  Timer,
  XCircle,
  ArrowDown,
  CircleDot,
  Lock,
} from 'lucide-react';
import { getStepPermissions, canToggleStep } from '@/lib/orchestrator/permissions';

// ─── Types ──────────────────────────────────────────────────────────────────

/** S&P handoff workflow step — PRD 002-G */
export interface SPAWorkflowStep {
  id: string;
  /** Step number (1-6) */
  step: number;
  labelBm: string;
  labelEn: string;
  /** Responsible actor */
  actor: 'developer' | 'buyer' | 'agent';
  /** Proof event name logged when step is toggled */
  proofEvent: string;
  /** Always false — agent claims completion, not the system */
  authorityClaimed: false;
}

export interface SPAChecklistItem {
  id: string;
  labelBm: string;
  labelEn: string;
  provider: 'buyer' | 'developer' | 'lawyer' | 'agent';
  required: boolean;
  /** Only for joint applications */
  jointOnly?: boolean;
  /** Only for Jenis 3 */
  jenis3Only?: boolean;
  /** Hint or format note */
  note?: string;
}

export interface SPADeadline {
  id: string;
  labelBm: string;
  labelEn: string;
  days: number;
  fromEventBm: string;
  fromEventEn: string;
  /** ISO date string when the deadline starts (event date) */
  startDate?: string;
  penaltyBm: string;
}

/** Case stage for conditional alerts */
export type CaseStage =
  | 'booking'    // Initial booking
  | 'selfcheck'  // Self-check completed
  | 'spa'        // SPA signed
  | 'lo_kj'      // Letter offer / KJ endorsement stage
  | 'submitted'  // Submitted to LPPSA
  | 'approved';  // LPPSA approved

export interface SPASubmissionChecklistProps {
  /** Booking reference for display */
  bookingRef: string;
  /** Buyer display name */
  buyerName: string;
  /** Whether this is a joint application */
  hasJointPurchaser: boolean;
  /** Whether this is Jenis 3 (under construction) */
  isJenis3: boolean;
  /** APDL status for Jenis 3 */
  apdlStatus?: string;
  /** Current case stage — drives conditional amber alerts */
  caseStage?: CaseStage;
  /** IDs of completed workflow steps (by step id) */
  completedWorkflowIds?: Set<string>;
  /** Callback when a workflow step is toggled — logs proof event with authorityClaimed: false */
  onWorkflowToggle?: (stepId: string, proofEvent: string, completed: boolean) => void;
  /** IDs of completed checklist items */
  completedIds?: Set<string>;
  /** Callback when an item is toggled */
  onToggleItem?: (itemId: string, completed: boolean) => void;
  /** Event dates for countdown timers (ISO strings) */
  deadlineEvents?: {
    spaSignedDate?: string;
    approvalLetterDate?: string;
    mortgageFormSignedDate?: string;
  };
  /** Locale */
  locale?: 'bm' | 'en';
  /** CR-003: Viewer role — controls step-level read-only enforcement.
   *  Steps 3-6: buyer=read-only, agent=action+attest */
  viewerRole?: 'buyer' | 'agent' | 'developer';
}

// ─── Workflow Steps (PRD 002-G) ─────────────────────────────────────────────
// 6-step S&P handoff chain: Developer → Agent → Buyer → KJ → LPPSA
// All proof events logged with authorityClaimed: false

const SPA_WORKFLOW_STEPS: SPAWorkflowStep[] = [
  {
    id: 'WF_001',
    step: 1,
    labelBm: 'Borang Tempahan diterima daripada Pemaju',
    labelEn: 'Booking form received from Developer',
    actor: 'developer',
    proofEvent: 'BOOKING_RECEIVED',
    authorityClaimed: false,
  },
  {
    id: 'WF_002',
    step: 2,
    labelBm: 'S&P ditandatangani oleh Pemaju dan Pembeli',
    labelEn: 'S&P signed by Developer and Buyer',
    actor: 'buyer',
    proofEvent: 'SP_SIGNED',
    authorityClaimed: false,
  },
  {
    id: 'WF_003',
    step: 3,
    labelBm: 'Salinan S&P diserahkan kepada Pembeli',
    labelEn: 'S&P copy provided to Buyer',
    actor: 'developer',
    proofEvent: 'SP_COPY_PROVIDED',
    authorityClaimed: false,
  },
  {
    id: 'WF_004',
    step: 4,
    labelBm: 'S&P dihantar ke Ketua Jabatan untuk pengesahan',
    labelEn: 'S&P submitted to Head of Department for endorsement',
    actor: 'buyer',
    proofEvent: 'SP_SUBMITTED_TO_KJ',
    authorityClaimed: false,
  },
  {
    id: 'WF_005',
    step: 5,
    labelBm: 'Pengesahan Ketua Jabatan diterima',
    labelEn: 'Head of Department endorsement received',
    actor: 'buyer',
    proofEvent: 'KJ_ENDORSEMENT_RECEIVED',
    authorityClaimed: false,
  },
  {
    id: 'WF_006',
    step: 6,
    labelBm: 'Dokumen lengkap untuk portal LPPSA',
    labelEn: 'Documents complete for LPPSA portal',
    actor: 'agent',
    proofEvent: 'DOCS_COMPLETE',
    authorityClaimed: false,
  },
];

// ─── Checklist Data ─────────────────────────────────────────────────────────

const SPA_CHECKLIST_ITEMS: SPAChecklistItem[] = [
  // ── Core S&P Documents ──
  {
    id: 'SPA_001',
    labelBm: 'Perjanjian Jual Beli (SPA) — salinan ditandatangani',
    labelEn: 'Sale & Purchase Agreement (SPA) — signed copy',
    provider: 'lawyer',
    required: true,
    note: 'Mesti diserahkan kepada LPPSA dalam tempoh 7 hari selepas ditandatangani',
  },
  {
    id: 'SPA_002',
    labelBm: 'Surat Pengesahan Ketua Jabatan (Format Baharu Okt 2025)',
    labelEn: 'Head of Department Confirmation Letter (New Format Oct 2025)',
    provider: 'buyer',
    required: true,
    note: 'Format baharu berkuatkuasa 1 Okt 2025. Dahulunya "Surat Iringan KJ".',
  },
  {
    id: 'SPA_003',
    labelBm: 'Salinan Carian Rasmi Terkini (3 bulan)',
    labelEn: 'Latest Official Land Search (within 3 months)',
    provider: 'lawyer',
    required: true,
    note: 'Carian RASMI, bukan Persendirian',
  },
  {
    id: 'SPA_004',
    labelBm: 'Borang 3 — Akujanji Peguam (termasuk Borang LPPSA 1/2016)',
    labelEn: 'Form 3 — Lawyer Undertaking (including Form LPPSA 1/2016)',
    provider: 'lawyer',
    required: true,
    note: 'Borang LPPSA 1/2016 wajib disertakan bersama Borang 3',
  },
  {
    id: 'SPA_005',
    labelBm: 'Borang 2 — Surat Persetujuan Penyelesaian Hutang',
    labelEn: 'Form 2 — Debt Settlement Consent Letter',
    provider: 'lawyer',
    required: true,
  },
  {
    id: 'SPA_006',
    labelBm: 'Slip Gaji Asal Terkini / E-Slip (disahkan KJ)',
    labelEn: 'Latest Original Pay Slip / E-Slip (certified by HoD)',
    provider: 'buyer',
    required: true,
    note: 'Slip gaji bulan terkini. E-slip diterima jika disahkan KJ.',
  },
  {
    id: 'SPA_007',
    labelBm: 'Borang Akuan Pemilihan Insurans / Takaful',
    labelEn: 'Insurance / Takaful Selection Declaration Form',
    provider: 'buyer',
    required: true,
  },

  // ── Jenis 3 Specific: Akujanji Pemaju ──
  {
    id: 'SPA_J3_001',
    labelBm: 'Borang 5B — Akujanji Pemaju (Hakmilik Induk / Penyerahan Hak)',
    labelEn: 'Form 5B — Developer Undertaking (Master Title / Assignment)',
    provider: 'developer',
    required: true,
    jenis3Only: true,
    note: 'Template rasmi LPPSA — pemaju tandatangan & serah kepada LPPSA',
  },
  {
    id: 'SPA_J3_002',
    labelBm: 'Surat Aku Janji Pemaju — Separa Pembayaran (Jenis 3)',
    labelEn: 'Developer Undertaking — Progressive Payment (Type 3)',
    provider: 'developer',
    required: true,
    jenis3Only: true,
    note: 'Menggunakan kepala surat pemaju. Linked to SPA Muktamad.',
  },
  {
    id: 'SPA_J3_003',
    labelBm: 'Borang 4A — Pengesahan Harta Bebas Gadaian',
    labelEn: 'Form 4A — Encumbrance-Free Property Confirmation',
    provider: 'lawyer',
    required: true,
    jenis3Only: true,
    note: 'Daripada firma guaman. ATAU Borang 4B jika ada pemegang gadaian.',
  },
  {
    id: 'SPA_J3_004',
    labelBm: 'Borang LPPSA 1/2016 — Akaun HDA',
    labelEn: 'Form LPPSA 1/2016 — HDA Account',
    provider: 'developer',
    required: true,
    jenis3Only: true,
    note: 'Housing Development Account — wajib bagi projek dalam pembinaan',
  },

  // ── Joint Application Items ──
  {
    id: 'SPA_JNT_001',
    labelBm: 'Salinan Sijil Nikah (pembiayaan bersama suami isteri)',
    labelEn: 'Copy of Marriage Certificate (joint husband-wife financing)',
    provider: 'buyer',
    required: true,
    jointOnly: true,
  },
  {
    id: 'SPA_JNT_002',
    labelBm: 'Salinan Kad Pengenalan Suami / Isteri (disahkan KJ)',
    labelEn: 'Copy of Spouse IC (certified by HoD)',
    provider: 'buyer',
    required: true,
    jointOnly: true,
  },
  {
    id: 'SPA_JNT_003',
    labelBm: 'Slip Gaji Suami / Isteri (disahkan KJ)',
    labelEn: 'Spouse Pay Slip (certified by HoD)',
    provider: 'buyer',
    required: true,
    jointOnly: true,
    note: 'Wajib jika pendapatan suami/isteri diambil kira dalam pengiraan DSR',
  },
  {
    id: 'SPA_JNT_004',
    labelBm: 'Surat Pengesahan KJ — Suami / Isteri',
    labelEn: 'HoD Confirmation Letter — Spouse',
    provider: 'buyer',
    required: true,
    jointOnly: true,
    note: 'Format baharu Okt 2025 — untuk pemohon bersama yang juga penjawat awam',
  },
  {
    id: 'SPA_JNT_005',
    labelBm: 'Borang 7 — Persetujuan Menggadaikan (jika perlu)',
    labelEn: 'Form 7 — Consent to Mortgage (if applicable)',
    provider: 'buyer',
    required: false,
    jointOnly: true,
    note: 'Wajib jika 2 nama dalam SPA tetapi hanya 1 pemohon pinjaman',
  },
];

const SPA_DEADLINES: SPADeadline[] = [
  {
    id: 'DL_SPA_001',
    labelBm: 'Serah SPA kepada LPPSA',
    labelEn: 'Submit SPA to LPPSA',
    days: 7,
    fromEventBm: 'Tarikh SPA ditandatangani',
    fromEventEn: 'SPA signing date',
    penaltyBm: 'Denda lewat dikenakan jika SPA tidak diserahkan dalam tempoh 7 hari',
  },
  {
    id: 'DL_SPA_002',
    labelBm: 'Tandatangan Borang Cagaran',
    labelEn: 'Sign Mortgage Form',
    days: 14,
    fromEventBm: 'Tarikh surat kelulusan LPPSA',
    fromEventEn: 'LPPSA approval letter date',
    penaltyBm: 'Borang cagaran wajib ditandatangani dalam 14 hari daripada surat kelulusan',
  },
  {
    id: 'DL_SPA_003',
    labelBm: 'Daftar Dokumen Cagaran',
    labelEn: 'Register Mortgage Documents',
    days: 30,
    fromEventBm: 'Tarikh borang cagaran ditandatangani oleh BPP',
    fromEventEn: 'BPP mortgage form signing date',
    penaltyBm: 'Dokumen cagaran wajib didaftarkan dalam 30 hari selepas ditandatangani BPP',
  },
];

// ─── Countdown Timer Hook ───────────────────────────────────────────────────

function useCountdown(targetDate: string | undefined): {
  daysLeft: number | null;
  isOverdue: boolean;
  isUrgent: boolean;
  label: string;
} {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (!targetDate) {
    return { daysLeft: null, isOverdue: false, isUrgent: false, label: '—' };
  }

  const target = new Date(targetDate);
  const diffMs = target.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    daysLeft,
    isOverdue: daysLeft < 0,
    isUrgent: daysLeft >= 0 && daysLeft <= 2,
    label: daysLeft < 0
      ? `${Math.abs(daysLeft)} hari lewat`
      : daysLeft === 0
        ? 'Hari ini'
        : `${daysLeft} hari lagi`,
  };
}

// ─── Provider Badge ─────────────────────────────────────────────────────────

function ProviderBadge({ provider, locale }: { provider: SPAChecklistItem['provider']; locale: 'bm' | 'en' }) {
  const config: Record<string, { label: { bm: string; en: string }; className: string }> = {
    buyer: { label: { bm: 'Pembeli', en: 'Buyer' }, className: 'bg-blue-50 text-blue-700 border-blue-200' },
    developer: { label: { bm: 'Pemaju', en: 'Developer' }, className: 'bg-teal-50 text-teal-700 border-teal-200' },
    lawyer: { label: { bm: 'Peguam', en: 'Lawyer' }, className: 'bg-purple-50 text-purple-700 border-purple-200' },
    agent: { label: { bm: 'Ejen', en: 'Agent' }, className: 'bg-amber-50 text-amber-700 border-amber-200' },
  };
  const c = config[provider];
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${c.className}`}>
      {c.label[locale]}
    </span>
  );
}

// ─── Deadline Card ──────────────────────────────────────────────────────────

function DeadlineCard({
  deadline,
  startDate,
  locale,
}: {
  deadline: SPADeadline;
  startDate?: string;
  locale: 'bm' | 'en';
}) {
  // Calculate the target date from startDate + days
  const targetDate = useMemo(() => {
    if (!startDate) return undefined;
    const d = new Date(startDate);
    d.setDate(d.getDate() + deadline.days);
    return d.toISOString();
  }, [startDate, deadline.days]);

  const { daysLeft, isOverdue, isUrgent, label } = useCountdown(targetDate);

  const bgColor = isOverdue
    ? 'bg-red-50 border-red-200'
    : isUrgent
      ? 'bg-amber-50 border-amber-200'
      : startDate
        ? 'bg-emerald-50 border-emerald-200'
        : 'bg-slate-50 border-slate-200';

  const textColor = isOverdue
    ? 'text-red-700'
    : isUrgent
      ? 'text-amber-700'
      : startDate
        ? 'text-emerald-700'
        : 'text-slate-500';

  const Icon = isOverdue ? XCircle : isUrgent ? AlertTriangle : startDate ? Clock : Timer;

  return (
    <div className={`rounded-lg border p-3 ${bgColor}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <Icon className={`w-4 h-4 mt-0.5 ${textColor}`} />
          <div>
            <p className={`text-sm font-medium ${textColor}`}>
              {locale === 'bm' ? deadline.labelBm : deadline.labelEn}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {locale === 'bm' ? deadline.fromEventBm : deadline.fromEventEn}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`text-lg font-bold ${textColor}`}>
            {deadline.days}d
          </span>
          {startDate && daysLeft !== null && (
            <p className={`text-xs font-medium ${textColor}`}>{label}</p>
          )}
          {!startDate && (
            <p className="text-xs text-slate-400">
              {locale === 'bm' ? 'Belum bermula' : 'Not started'}
            </p>
          )}
        </div>
      </div>
      {isOverdue && (
        <p className="text-xs text-red-600 mt-2 font-medium">{deadline.penaltyBm}</p>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function SPASubmissionChecklist({
  bookingRef,
  buyerName,
  hasJointPurchaser,
  isJenis3,
  apdlStatus = 'pending',
  caseStage = 'booking',
  completedWorkflowIds = new Set(),
  onWorkflowToggle,
  completedIds = new Set(),
  onToggleItem,
  deadlineEvents = {},
  locale = 'bm',
  viewerRole = 'agent',
}: SPASubmissionChecklistProps) {
  const [showDeadlines, setShowDeadlines] = useState(true);
  const [showWorkflow, setShowWorkflow] = useState(true);

  // Filter checklist items based on context
  const filteredItems = useMemo(() => {
    return SPA_CHECKLIST_ITEMS.filter(item => {
      if (item.jenis3Only && !isJenis3) return false;
      if (item.jointOnly && !hasJointPurchaser) return false;
      return true;
    });
  }, [isJenis3, hasJointPurchaser]);

  // Group items
  const coreItems = filteredItems.filter(i => !i.jenis3Only && !i.jointOnly);
  const jenis3Items = filteredItems.filter(i => i.jenis3Only);
  const jointItems = filteredItems.filter(i => i.jointOnly);

  // Stats
  const requiredItems = filteredItems.filter(i => i.required);
  const completedRequired = requiredItems.filter(i => completedIds.has(i.id));
  const allComplete = completedRequired.length === requiredItems.length;

  // Workflow stats
  const completedWorkflowCount = SPA_WORKFLOW_STEPS.filter(s => completedWorkflowIds.has(s.id)).length;

  // Amber alert: SP_COPY_PROVIDED (WF_003) unchecked at LO/KJ stage
  const showSpCopyAlert = (caseStage === 'lo_kj' || caseStage === 'submitted')
    && !completedWorkflowIds.has('WF_003');

  const handleToggle = useCallback((itemId: string) => {
    const newState = !completedIds.has(itemId);
    onToggleItem?.(itemId, newState);
  }, [completedIds, onToggleItem]);

  const handleWorkflowToggle = useCallback((step: SPAWorkflowStep) => {
    const newState = !completedWorkflowIds.has(step.id);
    onWorkflowToggle?.(step.id, step.proofEvent, newState);
  }, [completedWorkflowIds, onWorkflowToggle]);

  // ─── Render Item ──────────────────────────────────────────────────
  const renderItem = (item: SPAChecklistItem) => {
    const isDone = completedIds.has(item.id);
    return (
      <div
        key={item.id}
        className={`px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${
          isDone ? 'bg-emerald-50/30' : ''
        }`}
        onClick={() => handleToggle(item.id)}
        role="checkbox"
        aria-checked={isDone}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle(item.id); } }}
      >
        {/* Checkbox */}
        <div className="mt-0.5 flex-shrink-0">
          {isDone ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <div className="w-5 h-5 rounded border-2 border-slate-300 hover:border-teal-400 transition-colors" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm ${isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
              {locale === 'bm' ? item.labelBm : item.labelEn}
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <ProviderBadge provider={item.provider} locale={locale} />
              {item.required && !isDone && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 font-medium">
                  {locale === 'bm' ? 'Wajib' : 'Req'}
                </span>
              )}
            </div>
          </div>
          {item.note && (
            <p className="text-xs text-slate-400 mt-0.5">{item.note}</p>
          )}
        </div>
      </div>
    );
  };

  // ─── Section Header ───────────────────────────────────────────────
  const SectionHeader = ({
    icon,
    title,
    count,
    completedCount,
  }: {
    icon: React.ReactNode;
    title: string;
    count: number;
    completedCount: number;
  }) => (
    <div className="px-4 py-2.5 bg-slate-50 flex items-center justify-between border-b border-slate-200">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold text-slate-700">{title}</span>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        completedCount === count
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-slate-200 text-slate-600'
      }`}>
        {completedCount}/{count}
      </span>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Scale className="w-5 h-5 text-teal-600" />
              {locale === 'bm'
                ? 'Senarai Semak S&P — Penyerahan LPPSA'
                : 'S&P Checklist — LPPSA Submission'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {buyerName} • {bookingRef}
              {hasJointPurchaser && (
                <span className="text-blue-600 ml-2">
                  <Users className="w-3.5 h-3.5 inline mr-0.5" />
                  {locale === 'bm' ? 'Bersama' : 'Joint'}
                </span>
              )}
              {isJenis3 && (
                <span className="text-teal-600 ml-2">
                  <Building2 className="w-3.5 h-3.5 inline mr-0.5" />
                  Jenis 3
                </span>
              )}
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            allComplete
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {allComplete
              ? (locale === 'bm' ? 'Sedia' : 'Ready')
              : `${completedRequired.length}/${requiredItems.length}`
            }
          </div>
        </div>
      </div>

      {/* ── Countdown Timers ────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowDeadlines(!showDeadlines)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-semibold text-slate-700">
              {locale === 'bm'
                ? 'Tarikh Akhir Denda Lewat (ATOR)'
                : 'Late Penalty Deadlines (ATOR)'}
            </span>
          </div>
          {showDeadlines
            ? <ChevronDown className="w-4 h-4 text-slate-400" />
            : <ChevronRight className="w-4 h-4 text-slate-400" />
          }
        </button>
        {showDeadlines && (
          <div className="px-4 pb-4 space-y-2">
            <DeadlineCard
              deadline={SPA_DEADLINES[0]}
              startDate={deadlineEvents.spaSignedDate}
              locale={locale}
            />
            <DeadlineCard
              deadline={SPA_DEADLINES[1]}
              startDate={deadlineEvents.approvalLetterDate}
              locale={locale}
            />
            <DeadlineCard
              deadline={SPA_DEADLINES[2]}
              startDate={deadlineEvents.mortgageFormSignedDate}
              locale={locale}
            />
          </div>
        )}
      </div>

      {/* ── S&P Handoff Workflow (PRD 002-G) ───────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowWorkflow(!showWorkflow)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <CircleDot className="w-5 h-5 text-teal-600" />
            <span className="text-sm font-semibold text-slate-700">
              {locale === 'bm'
                ? 'Aliran Kerja Penyerahan S&P'
                : 'S&P Handoff Workflow'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              completedWorkflowCount === SPA_WORKFLOW_STEPS.length
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-200 text-slate-600'
            }`}>
              {completedWorkflowCount}/{SPA_WORKFLOW_STEPS.length}
            </span>
          </div>
          {showWorkflow
            ? <ChevronDown className="w-4 h-4 text-slate-400" />
            : <ChevronRight className="w-4 h-4 text-slate-400" />
          }
        </button>
        {showWorkflow && (
          <div className="px-4 pb-4">
            {SPA_WORKFLOW_STEPS.map((step, idx) => {
              const isDone = completedWorkflowIds.has(step.id);
              // CR-003: Step-level role enforcement
              const canToggle = canToggleStep(step.step, viewerRole);
              const stepPerms = getStepPermissions(step.step, viewerRole);
              const isReadOnly = stepPerms.readOnly;

              const actorColors: Record<string, string> = {
                developer: 'bg-teal-50 text-teal-700 border-teal-200',
                buyer: 'bg-blue-50 text-blue-700 border-blue-200',
                agent: 'bg-amber-50 text-amber-700 border-amber-200',
              };
              const actorLabels: Record<string, { bm: string; en: string }> = {
                developer: { bm: 'Pemaju', en: 'Developer' },
                buyer: { bm: 'Pembeli', en: 'Buyer' },
                agent: { bm: 'Ejen', en: 'Agent' },
              };

              return (
                <div key={step.id}>
                  <div
                    className={`flex items-start gap-3 py-2.5 rounded-lg px-2 transition-colors ${
                      isDone ? 'opacity-70' : ''
                    } ${canToggle ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'} ${
                      isReadOnly && !isDone ? 'bg-slate-50/50' : ''
                    }`}
                    onClick={() => canToggle && handleWorkflowToggle(step)}
                    role="checkbox"
                    aria-checked={isDone}
                    aria-disabled={!canToggle}
                    tabIndex={canToggle ? 0 : -1}
                    onKeyDown={(e) => { if (canToggle && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleWorkflowToggle(step); } }}
                  >
                    {/* Step indicator */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : isReadOnly ? (
                        <Lock className="w-5 h-5 text-slate-300" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-teal-300 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-teal-600">{step.step}</span>
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${isDone ? 'text-slate-400 line-through' : isReadOnly ? 'text-slate-400' : 'text-slate-700'}`}>
                          {locale === 'bm' ? step.labelBm : step.labelEn}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${actorColors[step.actor]}`}>
                            {actorLabels[step.actor][locale]}
                          </span>
                          {/* CR-003: Show read-only badge for locked steps */}
                          {isReadOnly && !isDone && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded border bg-slate-100 text-slate-400 border-slate-200 font-medium">
                              {locale === 'bm' ? 'Baca sahaja' : 'Read-only'}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {step.proofEvent} • authorityClaimed: false
                      </p>
                    </div>
                  </div>
                  {/* Arrow connector */}
                  {idx < SPA_WORKFLOW_STEPS.length - 1 && (
                    <div className="flex justify-start pl-4 py-0.5">
                      <ArrowDown className="w-3 h-3 text-slate-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Amber Alert: SP_COPY_PROVIDED unchecked at LO/KJ stage ── */}
      {showSpCopyAlert && (
        <div className="bg-amber-50 rounded-xl border border-amber-300 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {locale === 'bm'
                ? 'Peringatan: Salinan S&P belum diserahkan'
                : 'Warning: S&P copy not yet provided'}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              {locale === 'bm'
                ? 'Pastikan Pemaju telah menyerahkan salinan S&P kepada Pembeli untuk dikemukakan kepada Ketua Jabatan.'
                : 'Ensure the Developer has provided the S&P copy to the Buyer for submission to the Head of Department.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Core Documents ──────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <SectionHeader
          icon={<FileText className="w-4 h-4 text-teal-500" />}
          title={locale === 'bm' ? 'Dokumen Teras S&P' : 'Core S&P Documents'}
          count={coreItems.length}
          completedCount={coreItems.filter(i => completedIds.has(i.id)).length}
        />
        <div className="divide-y divide-slate-100">
          {coreItems.map(renderItem)}
        </div>
      </div>

      {/* ── Jenis 3 Documents ───────────────────────────────────── */}
      {isJenis3 && jenis3Items.length > 0 && (
        <div className="bg-white rounded-xl border border-teal-200 overflow-hidden">
          <SectionHeader
            icon={<Building2 className="w-4 h-4 text-teal-500" />}
            title={locale === 'bm' ? 'Dokumen Jenis 3 (Akujanji Pemaju)' : 'Type 3 Documents (Developer Undertaking)'}
            count={jenis3Items.length}
            completedCount={jenis3Items.filter(i => completedIds.has(i.id)).length}
          />
          <div className="divide-y divide-slate-100">
            {jenis3Items.map(renderItem)}
          </div>
          {/* APDL status note */}
          <div className={`px-4 py-2.5 border-t ${
            apdlStatus === 'valid' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
          }`}>
            <p className={`text-xs flex items-center gap-1.5 ${
              apdlStatus === 'valid' ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              <Shield className="w-3 h-3" />
              {apdlStatus === 'valid'
                ? (locale === 'bm'
                    ? 'APDL sah — JPPH Borang 1 dikecualikan'
                    : 'APDL valid — JPPH Form 1 exempted')
                : (locale === 'bm'
                    ? 'APDL belum disahkan — JPPH Borang 1 mungkin diperlukan'
                    : 'APDL not verified — JPPH Form 1 may be required')
              }
            </p>
          </div>
        </div>
      )}

      {/* ── Joint Application Documents ─────────────────────────── */}
      {hasJointPurchaser && jointItems.length > 0 && (
        <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
          <SectionHeader
            icon={<Users className="w-4 h-4 text-blue-500" />}
            title={locale === 'bm' ? 'Dokumen Pemohon Bersama' : 'Joint Applicant Documents'}
            count={jointItems.length}
            completedCount={jointItems.filter(i => completedIds.has(i.id)).length}
          />
          <div className="divide-y divide-slate-100">
            {jointItems.map(renderItem)}
          </div>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 px-4 py-2.5">
        <p className="text-xs text-slate-400 text-center">
          {locale === 'bm'
            ? 'Senarai semak berdasarkan LPPSA/ATOR Senarai Semak Peguam dan Notis Makluman 30 Sep 2025.'
            : 'Checklist based on LPPSA/ATOR Lawyer Checklist and Notice dated 30 Sep 2025.'}
        </p>
      </div>
    </div>
  );
}

export default SPASubmissionChecklist;
