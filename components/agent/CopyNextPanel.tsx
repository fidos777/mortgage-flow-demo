'use client';

/**
 * CR-KP-002 Sprint 1 (A9) — Copy-Next Panel
 *
 * Agent-facing wizard for copying buyer data into the SPPB portal.
 * Consumes the field registry (lib/config/field-registry.ts) and displays
 * fields organized by 14 Copy-Next groups (matching LPPSA Borang sections).
 *
 * Features:
 * 1. Section-by-section field display with completion tracking
 * 2. Jenis-conditional visibility (e.g. Section M only for Jenis 3)
 * 3. Joint applicant conditional fields (Section L)
 * 4. Readiness v2 integration — 5-component progress
 * 5. Portal Kit proof events: PORTAL_KIT_STARTED, PORTAL_SECTION_MARKED_COMPLETE,
 *    PORTAL_COPY_SESSION_SUMMARY
 * 6. J.7 micro-flow: show field → clipboard copy → toast → advance k → progress → complete
 * 7. Section M auto-population from APDL developer data (source: 'developer')
 * 8. PROP_014 auto-default to INDUK for Jenis 3
 *
 * DEC-001: Readiness score displayed as band label only, NEVER as approval probability.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  ClipboardCopy,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  FileText,
  Users,
  Building2,
  Briefcase,
  Home,
  Shield,
  PenTool,
  Wallet,
  Scale,
  Heart,
  UserCheck,
  FileSignature,
  ListChecks,
  Copy,
  ArrowRight,
  Cpu,
} from 'lucide-react';
import {
  getCopyNextGroups,
  getFieldsByJenis,
  getJointFields,
  type FieldDefinition,
  type BorangSection,
} from '@/lib/config/field-registry';
import { PORTAL_KIT_PROOF_EVENTS } from '@/lib/engine/readiness-score-v2';
import type { LoanTypeCode } from '@/lib/config/loan-types';
import type { ReadinessBand } from '@/types/case';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CopyNextPanelProps {
  /** Loan type code — determines which fields are visible */
  jenisCode: LoanTypeCode;
  /** Whether buyer has a joint applicant */
  hasJointApplicant: boolean;
  /** Map of field IDs to their current values (from case data) */
  fieldValues: Record<string, string>;
  /** Map of field IDs to their data source — 'developer' fields auto-populated from APDL */
  fieldSources?: Record<string, 'buyer' | 'agent' | 'developer' | 'derived'>;
  /** Overall readiness band — displayed as label only per DEC-001 */
  readinessBand?: ReadinessBand;
  /** Callback when a section is marked complete by agent */
  onSectionComplete?: (sectionGroup: number, sectionLabel: string) => void;
  /** Callback when the full copy session summary is requested */
  onCopySessionSummary?: (summary: CopySessionSummary) => void;
  /** Callback for proof event logging */
  onProofEvent?: (event: string, metadata?: Record<string, unknown>) => void;
  /** Callback when a field value is copied to clipboard */
  onFieldCopied?: (fieldId: string, value: string) => void;
}

export interface CopySessionSummary {
  totalFields: number;
  completedFields: number;
  completedSections: number;
  totalSections: number;
  incompleteSections: string[];
  copiedFieldCount: number;
  autoPopulatedCount: number;
  timestamp: string;
}

interface SectionMeta {
  group: number;
  section: BorangSection;
  labelBm: string;
  labelEn: string;
  icon: React.ReactNode;
}

// ─── Section Metadata ───────────────────────────────────────────────────────

const SECTION_META: SectionMeta[] = [
  { group: 1,  section: 'A_PERMOHONAN',   labelBm: 'Jenis Permohonan',         labelEn: 'Application Type',      icon: <FileText className="w-4 h-4" /> },
  { group: 2,  section: 'B_PEMOHON',      labelBm: 'Maklumat Pemohon',         labelEn: 'Applicant Info',        icon: <UserCheck className="w-4 h-4" /> },
  { group: 3,  section: 'C_ALAMAT',       labelBm: 'Alamat',                   labelEn: 'Address',               icon: <Home className="w-4 h-4" /> },
  { group: 4,  section: 'D_PERKHIDMATAN', labelBm: 'Maklumat Perkhidmatan',    labelEn: 'Employment',            icon: <Briefcase className="w-4 h-4" /> },
  { group: 5,  section: 'E_PINJAMAN',     labelBm: 'Maklumat Pinjaman',        labelEn: 'Financing',             icon: <Wallet className="w-4 h-4" /> },
  { group: 6,  section: 'F_HARTANAH',     labelBm: 'Maklumat Hartanah',        labelEn: 'Property',              icon: <Building2 className="w-4 h-4" /> },
  { group: 7,  section: 'G_KOMITMEN',     labelBm: 'Komitmen Kewangan',        labelEn: 'Financial Commitments', icon: <Scale className="w-4 h-4" /> },
  { group: 8,  section: 'H_PEGUAM',       labelBm: 'Maklumat Peguam',          labelEn: 'Lawyer',                icon: <Shield className="w-4 h-4" /> },
  { group: 9,  section: 'J_INSURANS',     labelBm: 'Insurans / Takaful',       labelEn: 'Insurance / Takaful',   icon: <Heart className="w-4 h-4" /> },
  { group: 10, section: 'K_PERAKUAN',     labelBm: 'Perakuan Pemohon',         labelEn: 'Declaration',           icon: <ListChecks className="w-4 h-4" /> },
  { group: 11, section: 'L_KELUARGA',     labelBm: 'Maklumat Suami/Isteri',    labelEn: 'Spouse / Family',       icon: <Users className="w-4 h-4" /> },
  { group: 12, section: 'M_PEMAJU',       labelBm: 'Maklumat Pemaju',          labelEn: 'Developer Info',        icon: <Building2 className="w-4 h-4" /> },
  { group: 13, section: 'N_WARIS',        labelBm: 'Waris / Keluarga Terdekat', labelEn: 'Emergency Contacts',   icon: <Heart className="w-4 h-4" /> },
  { group: 14, section: 'P_TANDATANGAN',  labelBm: 'Tandatangan',              labelEn: 'Signatures',            icon: <PenTool className="w-4 h-4" /> },
];

// ─── Readiness Band Display (DEC-001: label only, never score) ─────────────

const BAND_DISPLAY: Record<ReadinessBand, { label: string; className: string }> = {
  ready:     { label: 'SEDIA',           className: 'bg-teal-100 text-teal-800 border-teal-300' },
  caution:   { label: 'PERLU PERHATIAN', className: 'bg-amber-100 text-amber-800 border-amber-300' },
  not_ready: { label: 'BELUM SEDIA',     className: 'bg-red-100 text-red-800 border-red-300' },
};

// ─── PROP_014 Auto-Default ──────────────────────────────────────────────────

/** When Jenis 3 and PROP_014 has no value, auto-default to 'INDUK' */
function applyAutoDefaults(
  fieldValues: Record<string, string>,
  jenisCode: LoanTypeCode
): Record<string, string> {
  const merged = { ...fieldValues };
  // PROP_014 auto-default for Jenis 3
  if (jenisCode === 3 && (!merged['PROP_014'] || merged['PROP_014'].trim() === '')) {
    merged['PROP_014'] = 'INDUK';
  }
  return merged;
}

// ─── Toast Component ────────────────────────────────────────────────────────

function CopyToast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <div className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded-md shadow-lg flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
        {message}
      </div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CopyNextPanel({
  jenisCode,
  hasJointApplicant,
  fieldValues: rawFieldValues,
  fieldSources = {},
  readinessBand,
  onSectionComplete,
  onCopySessionSummary,
  onProofEvent,
  onFieldCopied,
}: CopyNextPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([1]));
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  const [sessionStarted, setSessionStarted] = useState(false);
  const [copiedFields, setCopiedFields] = useState<Set<string>>(new Set());
  const [activeFieldIndex, setActiveFieldIndex] = useState<Record<number, number>>({});
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Apply auto-defaults (e.g. PROP_014 → INDUK for Jenis 3)
  const fieldValues = useMemo(
    () => applyAutoDefaults(rawFieldValues, jenisCode),
    [rawFieldValues, jenisCode]
  );

  // ── Compute applicable fields per group ───────────────────────────────────

  const groupedFields = useMemo(() => {
    const allGroups = getCopyNextGroups();
    const applicableByJenis = getFieldsByJenis(jenisCode);
    const applicableIds = new Set(applicableByJenis.map(f => f.id));

    const filtered: Record<number, FieldDefinition[]> = {};
    for (const [groupStr, fields] of Object.entries(allGroups)) {
      const group = parseInt(groupStr);
      const applicable = fields.filter(f => {
        if (!applicableIds.has(f.id)) return false;
        if (f.jointConditional && !hasJointApplicant) return false;
        return true;
      });
      if (applicable.length > 0) {
        filtered[group] = applicable;
      }
    }
    return filtered;
  }, [jenisCode, hasJointApplicant]);

  // ── Section completion stats ──────────────────────────────────────────────

  const sectionStats = useMemo(() => {
    const stats: Record<number, { total: number; completed: number; fields: FieldDefinition[] }> = {};
    for (const [groupStr, fields] of Object.entries(groupedFields)) {
      const group = parseInt(groupStr);
      const completed = fields.filter(f => {
        const val = fieldValues[f.id];
        return val !== undefined && val !== null && val.trim() !== '';
      }).length;
      stats[group] = { total: fields.length, completed, fields };
    }
    return stats;
  }, [groupedFields, fieldValues]);

  const totalFields = useMemo(
    () => Object.values(sectionStats).reduce((sum, s) => sum + s.total, 0),
    [sectionStats]
  );

  const totalCompleted = useMemo(
    () => Object.values(sectionStats).reduce((sum, s) => sum + s.completed, 0),
    [sectionStats]
  );

  const autoPopulatedCount = useMemo(
    () => Object.values(fieldSources).filter(s => s === 'developer').length,
    [fieldSources]
  );

  // ── Proof event: session started ──────────────────────────────────────────

  useEffect(() => {
    if (!sessionStarted) {
      setSessionStarted(true);
      onProofEvent?.(PORTAL_KIT_PROOF_EVENTS.PORTAL_KIT_STARTED, {
        jenisCode,
        hasJointApplicant,
        totalFields,
        autoPopulatedCount,
        timestamp: new Date().toISOString(),
      });
    }
  }, [sessionStarted, jenisCode, hasJointApplicant, totalFields, autoPopulatedCount, onProofEvent]);

  // ── Toast helper ──────────────────────────────────────────────────────────

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 1500);
  }, []);

  // ── J.7 Micro-flow: Copy field value to clipboard ────────────────────────

  const copyFieldToClipboard = useCallback(async (field: FieldDefinition, group: number) => {
    const val = fieldValues[field.id];
    if (!val || val.trim() === '') return;

    try {
      await navigator.clipboard.writeText(val);

      // Mark field as copied
      setCopiedFields(prev => {
        const next = new Set(prev);
        next.add(field.id);
        return next;
      });

      // Toast feedback
      showToast(`${field.nameMy} disalin`);

      // Advance to next field in section (advance k)
      const sectionFields = sectionStats[group]?.fields ?? [];
      const currentIdx = activeFieldIndex[group] ?? 0;
      const nextIdx = currentIdx + 1;
      if (nextIdx < sectionFields.length) {
        setActiveFieldIndex(prev => ({ ...prev, [group]: nextIdx }));
      }

      // Callback
      onFieldCopied?.(field.id, val);
    } catch {
      showToast('Gagal menyalin — cuba sekali lagi');
    }
  }, [fieldValues, sectionStats, activeFieldIndex, showToast, onFieldCopied]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleGroup = useCallback((group: number) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
        // Reset active field index when expanding
        setActiveFieldIndex(p => ({ ...p, [group]: 0 }));
      }
      return next;
    });
  }, []);

  const markSectionComplete = useCallback((group: number) => {
    const meta = SECTION_META.find(s => s.group === group);
    if (!meta) return;

    setCompletedSections(prev => {
      const next = new Set(prev);
      next.add(group);
      return next;
    });

    // Proof event: section marked complete
    onProofEvent?.(PORTAL_KIT_PROOF_EVENTS.PORTAL_SECTION_MARKED_COMPLETE, {
      group,
      section: meta.section,
      label: meta.labelBm,
      fieldsInSection: sectionStats[group]?.total ?? 0,
      fieldsCompleted: sectionStats[group]?.completed ?? 0,
      fieldsCopied: sectionStats[group]?.fields.filter(f => copiedFields.has(f.id)).length ?? 0,
      timestamp: new Date().toISOString(),
    });

    onSectionComplete?.(group, meta.labelBm);

    // Auto-advance: expand next non-complete section
    const visibleSections = SECTION_META.filter(s => groupedFields[s.group]);
    const currentIdx = visibleSections.findIndex(s => s.group === group);
    if (currentIdx >= 0 && currentIdx < visibleSections.length - 1) {
      const nextGroup = visibleSections[currentIdx + 1].group;
      if (!completedSections.has(nextGroup)) {
        setExpandedGroups(prev => {
          const next = new Set(prev);
          next.delete(group);
          next.add(nextGroup);
          return next;
        });
        setActiveFieldIndex(p => ({ ...p, [nextGroup]: 0 }));
      }
    }
  }, [sectionStats, copiedFields, groupedFields, completedSections, onSectionComplete, onProofEvent]);

  const generateSummary = useCallback(() => {
    const visibleSections = SECTION_META.filter(s => groupedFields[s.group]);
    const incompleteSections = visibleSections
      .filter(s => !completedSections.has(s.group))
      .map(s => s.labelBm);

    const summary: CopySessionSummary = {
      totalFields,
      completedFields: totalCompleted,
      completedSections: completedSections.size,
      totalSections: visibleSections.length,
      incompleteSections,
      copiedFieldCount: copiedFields.size,
      autoPopulatedCount,
      timestamp: new Date().toISOString(),
    };

    onProofEvent?.(PORTAL_KIT_PROOF_EVENTS.PORTAL_COPY_SESSION_SUMMARY, { ...summary });
    onCopySessionSummary?.(summary);
  }, [totalFields, totalCompleted, completedSections, copiedFields, autoPopulatedCount, groupedFields, onCopySessionSummary, onProofEvent]);

  // ── Render ────────────────────────────────────────────────────────────────

  const visibleSections = SECTION_META.filter(s => groupedFields[s.group]);
  const overallPct = totalFields > 0 ? Math.round((totalCompleted / totalFields) * 100) : 0;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCopy className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Portal Kit — Copy-Next
            </h3>
          </div>
          {readinessBand && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${BAND_DISPLAY[readinessBand].className}`}>
              {BAND_DISPLAY[readinessBand].label}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Salin data pembeli ke portal SPPB mengikut seksyen borang.
        </p>
        {/* Overall progress */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{totalCompleted} / {totalFields} medan</span>
            <span>{copiedFields.size} disalin</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Section List ───────────────────────────────────────────────── */}
      <div className="divide-y divide-slate-100">
        {visibleSections.map(meta => {
          const stats = sectionStats[meta.group];
          if (!stats) return null;

          const isExpanded = expandedGroups.has(meta.group);
          const isComplete = completedSections.has(meta.group);
          const sectionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
          const isAutoPopSection = meta.section === 'M_PEMAJU';
          const activeIdx = activeFieldIndex[meta.group] ?? 0;

          return (
            <div key={meta.group} className="group">
              {/* Section header */}
              <button
                onClick={() => toggleGroup(meta.group)}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors"
              >
                <span className="text-slate-400">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
                <span className="text-slate-500">{meta.icon}</span>
                <div className="flex-1 text-left">
                  <span className="text-sm font-medium text-slate-800">
                    {meta.labelBm}
                  </span>
                  <span className="text-xs text-slate-400 ml-2">
                    {meta.labelEn}
                  </span>
                  {isAutoPopSection && (
                    <span className="ml-2 text-xs text-violet-500 font-medium">[APDL]</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {stats.completed}/{stats.total}
                  </span>
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-500" />
                  ) : sectionPct === 100 ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-300" />
                  ) : sectionPct > 0 ? (
                    <Circle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300" />
                  )}
                </div>
              </button>

              {/* Expanded field list with J.7 micro-flow */}
              {isExpanded && (
                <div className="px-4 pb-3">
                  {/* Auto-population banner for Section M */}
                  {isAutoPopSection && (
                    <div className="ml-7 mb-2 px-2.5 py-1.5 bg-violet-50 border border-violet-200 rounded-md flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                      <span className="text-xs text-violet-700">
                        Medan pemaju dipra-isi daripada data APDL (A2). Semak dan salin ke portal.
                      </span>
                    </div>
                  )}

                  <div className="ml-7 space-y-0.5">
                    {stats.fields.map((field, idx) => {
                      const val = fieldValues[field.id];
                      const hasValue = val !== undefined && val !== null && val.trim() !== '';
                      const isCopied = copiedFields.has(field.id);
                      const isActive = idx === activeIdx;
                      const source = fieldSources[field.id] ?? field.classification === 'DEVELOPER_SOURCED' ? 'developer' : undefined;
                      const isDeveloperSource = source === 'developer' || (isAutoPopSection && hasValue);

                      return (
                        <div
                          key={field.id}
                          className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded-md transition-colors ${
                            isActive && hasValue ? 'bg-teal-50 border border-teal-200' :
                            isActive ? 'bg-slate-50 border border-slate-200' :
                            ''
                          }`}
                        >
                          {/* Status icon */}
                          {isCopied ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                          ) : hasValue ? (
                            <Circle className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                          ) : field.required ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          )}

                          {/* Field label */}
                          <div className="flex-1 min-w-0">
                            <span className={`${hasValue ? 'text-slate-700' : 'text-slate-500'}`}>
                              {field.nameMy}
                            </span>
                            {field.required && !hasValue && (
                              <span className="ml-1 text-amber-500">*</span>
                            )}
                            {field.jointConditional && (
                              <span className="ml-1 text-blue-400">[bersama]</span>
                            )}
                            {isDeveloperSource && (
                              <span className="ml-1 text-violet-400">[pemaju]</span>
                            )}
                          </div>

                          {/* Value + copy button (J.7 micro-flow) */}
                          {hasValue ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-600 truncate max-w-[120px]" title={val}>
                                {val}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyFieldToClipboard(field, meta.group);
                                }}
                                className={`p-1 rounded transition-colors ${
                                  isCopied
                                    ? 'text-teal-500'
                                    : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'
                                }`}
                                title={isCopied ? 'Disalin' : 'Salin ke papan klip'}
                              >
                                {isCopied ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-300 italic">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Advance to next / mark section complete */}
                  <div className="ml-7 mt-2 flex items-center gap-3">
                    {!isComplete && (
                      <button
                        onClick={() => markSectionComplete(meta.group)}
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                      >
                        <FileSignature className="w-3.5 h-3.5" />
                        Tandakan seksyen selesai
                      </button>
                    )}
                    {isComplete && (
                      <div className="text-xs text-teal-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Seksyen ditandakan selesai
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer: Copy Session Summary ───────────────────────────────── */}
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
        <button
          onClick={generateSummary}
          className="w-full text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md px-3 py-2 flex items-center justify-center gap-2 transition-colors"
        >
          <ClipboardCopy className="w-4 h-4" />
          Jana Ringkasan Sesi Copy-Next
        </button>
        <p className="text-xs text-slate-400 text-center mt-1">
          Ringkasan akan merekod status semua seksyen.
        </p>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      <CopyToast message={toastMessage} visible={toastVisible} />
    </div>
  );
}
