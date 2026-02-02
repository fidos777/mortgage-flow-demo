// lib/store/case-store.ts
// Zustand store for case management with demo data

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Case, CasePhase, Document, ReadinessResult, TacSchedule } from '@/types/case';
import { ProofEvent } from '@/types/proof-event';
import { Role } from '@/types/stakeholder';
import { ProofEventFactory } from '@/lib/qontrek/proof-events';
import { salaryToRange } from '@/lib/orchestrator/permissions';

// Demo cases with PRD-compliant data
const DEMO_CASES: Case[] = [
  {
    id: 'C001',
    buyer: {
      id: 'B001',
      name: 'Ahmad bin Ali',
      phone: '012-3456789',
      ic: '880515-14-5678',
      email: 'ahmad.ali@email.com',
      incomeRange: salaryToRange(4500), // PRD compliance: range not exact
      occupation: 'Cikgu',
      employer: 'Kementerian Pendidikan Malaysia',
      grade: 'DG41',
    },
    property: {
      name: 'Residensi Harmoni',
      unit: 'A-12-03',
      price: 450000,
      type: 'subsale',
      location: 'Kajang, Selangor',
    },
    phase: 'TAC_SCHEDULED',
    priority: 'P1',
    loanType: 'Jenis 1 - Rumah Siap (Subsale)',
    readiness: {
      band: 'ready',
      label: 'READY TO CONTINUE',
      guidance: 'Anda boleh meneruskan ke proses tempahan dan penyediaan dokumen.',
    },
    documents: [
      { id: 'd1', type: 'IC', name: 'IC (Depan & Belakang)', status: 'verified', confidence: 0.99 },
      { id: 'd2', type: 'SLIP_GAJI', name: 'Slip Gaji Terkini', status: 'verified', confidence: 0.92 },
      { id: 'd3', type: 'BANK', name: 'Penyata Bank (3 bulan)', status: 'verified', confidence: 0.95 },
      { id: 'd4', type: 'KWSP', name: 'Penyata KWSP', status: 'verified', confidence: 0.88 },
      { id: 'd5', type: 'SPA', name: 'SPA', status: 'verified', confidence: 0.96 },
      { id: 'd6', type: 'GERAN', name: 'Geran/Hakmilik', status: 'pending' },
    ],
    tacSchedule: { date: '3 Feb 2026', time: '10:00 - 10:10 pagi' },
    kjStatus: 'pending',
    loExpiry: 2,
    queryRisk: 'low',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-01-31T10:00:00Z',
  },
  {
    id: 'C002',
    buyer: {
      id: 'B002',
      name: 'Siti Aminah',
      phone: '013-9876543',
      incomeRange: salaryToRange(3800),
      occupation: 'Jururawat',
      employer: 'Hospital Kajang',
      grade: 'U29',
    },
    property: {
      name: 'Pangsapuri Damai',
      unit: 'B-5-10',
      price: 380000,
      type: 'new_project',
      location: 'Bangi, Selangor',
    },
    phase: 'DOCS_PENDING',
    priority: 'P3',
    loanType: 'Jenis 3 - Tanah + Bina Rumah',
    documents: [
      { id: 'd7', type: 'IC', name: 'IC (Depan & Belakang)', status: 'verified', confidence: 0.97 },
      { id: 'd8', type: 'SLIP_GAJI', name: 'Slip Gaji Terkini', status: 'verified', confidence: 0.89 },
      { id: 'd9', type: 'BANK', name: 'Penyata Bank (3 bulan)', status: 'pending' },
    ],
    queryRisk: 'none',
    createdAt: '2026-01-18T09:00:00Z',
    updatedAt: '2026-01-30T14:00:00Z',
  },
  {
    id: 'C003',
    buyer: {
      id: 'B003',
      name: 'Mohammad Razak',
      phone: '019-5551234',
      incomeRange: salaryToRange(5200),
      occupation: 'Polis',
      employer: 'PDRM',
      grade: 'YA13',
    },
    property: {
      name: 'Taman Sentosa',
      unit: '22',
      price: 520000,
      type: 'subsale',
      location: 'Semenyih, Selangor',
    },
    phase: 'KJ_PENDING',
    priority: 'P2',
    loanType: 'Jenis 1 - Rumah Siap (Subsale)',
    readiness: {
      band: 'ready',
      label: 'READY TO CONTINUE',
      guidance: 'Anda boleh meneruskan ke proses tempahan dan penyediaan dokumen.',
    },
    documents: [
      { id: 'd10', type: 'IC', name: 'IC (Depan & Belakang)', status: 'verified', confidence: 0.98 },
      { id: 'd11', type: 'SLIP_GAJI', name: 'Slip Gaji Terkini', status: 'verified', confidence: 0.94 },
      { id: 'd12', type: 'BANK', name: 'Penyata Bank (3 bulan)', status: 'verified', confidence: 0.91 },
      { id: 'd13', type: 'KWSP', name: 'Penyata KWSP', status: 'verified', confidence: 0.87 },
    ],
    kjStatus: 'overdue',
    kjDays: 12,
    loExpiry: 5,
    queryRisk: 'medium',
    createdAt: '2026-01-10T11:00:00Z',
    updatedAt: '2026-01-29T16:00:00Z',
  },
  {
    id: 'C004',
    buyer: {
      id: 'B004',
      name: 'Nurul Huda',
      phone: '016-7778899',
      incomeRange: salaryToRange(6800),
      occupation: 'Pegawai Bank',
      employer: 'Bank Negara Malaysia',
      grade: 'M41',
    },
    property: {
      name: 'Tanah Lot Cyberjaya',
      unit: 'Lot 88',
      price: 680000,
      type: 'land_build',
      location: 'Cyberjaya, Selangor',
    },
    phase: 'SUBMITTED',
    priority: 'P4',
    loanType: 'Jenis 3 - Tanah + Bina Rumah',
    readiness: {
      band: 'ready',
      label: 'READY TO CONTINUE',
      guidance: 'Anda boleh meneruskan ke proses tempahan dan penyediaan dokumen.',
    },
    documents: [
      { id: 'd14', type: 'IC', name: 'IC (Depan & Belakang)', status: 'verified', confidence: 0.99 },
      { id: 'd15', type: 'SLIP_GAJI', name: 'Slip Gaji Terkini', status: 'verified', confidence: 0.96 },
      { id: 'd16', type: 'BANK', name: 'Penyata Bank (3 bulan)', status: 'verified', confidence: 0.93 },
      { id: 'd17', type: 'KWSP', name: 'Penyata KWSP', status: 'verified', confidence: 0.90 },
    ],
    tacSchedule: { date: '28 Jan 2026', time: '2:00 petang', confirmed: true, confirmedAt: '2026-01-28T14:05:00Z' },
    queryRisk: 'high',
    createdAt: '2026-01-05T10:00:00Z',
    updatedAt: '2026-01-28T15:00:00Z',
  },
  {
    id: 'C005',
    buyer: {
      id: 'B005',
      name: 'Faizal Rahman',
      phone: '011-2223344',
      incomeRange: salaryToRange(4200),
      occupation: 'Askar',
      employer: 'Angkatan Tentera Malaysia',
      grade: 'Koperal',
    },
    property: {
      name: 'Residensi Harmoni',
      unit: 'A-15-07',
      price: 450000,
      type: 'subsale',
      location: 'Kajang, Selangor',
    },
    phase: 'LO_RECEIVED',
    priority: 'P2',
    loanType: 'Jenis 1 - Rumah Siap (Subsale)',
    readiness: {
      band: 'ready',
      label: 'READY TO CONTINUE',
      guidance: 'Anda boleh meneruskan ke proses tempahan dan penyediaan dokumen.',
    },
    documents: [
      { id: 'd18', type: 'IC', name: 'IC (Depan & Belakang)', status: 'verified', confidence: 0.97 },
      { id: 'd19', type: 'SLIP_GAJI', name: 'Slip Gaji Terkini', status: 'verified', confidence: 0.91 },
      { id: 'd20', type: 'BANK', name: 'Penyata Bank (3 bulan)', status: 'verified', confidence: 0.89 },
    ],
    kjStatus: 'pending',
    loExpiry: 8,
    queryRisk: 'low',
    createdAt: '2026-01-08T09:00:00Z',
    updatedAt: '2026-01-27T11:00:00Z',
  },
];

// Demo proof events
const DEMO_PROOF_EVENTS: ProofEvent[] = [
  {
    id: 'evt_001',
    eventType: 'DOC_UPLOADED',
    category: 'FACT',
    actor: 'buyer',
    intent: 'IC dimuat naik',
    timestamp: '2026-01-15T08:30:00Z',
    caseId: 'C001',
    authorityClaimed: false,
    humanConfirmationRequired: false,
  },
  {
    id: 'evt_002',
    eventType: 'READINESS_COMPUTED',
    category: 'DERIVED',
    actor: 'system',
    intent: 'Isyarat kesediaan dijana: READY',
    timestamp: '2026-01-15T08:35:00Z',
    caseId: 'C001',
    authorityClaimed: false,
    humanConfirmationRequired: false,
  },
  {
    id: 'evt_003',
    eventType: 'PHASE_TRANSITIONED',
    category: 'DERIVED',
    actor: 'system',
    intent: 'Fasa bertukar: DOCS_COMPLETE → TAC_SCHEDULED',
    timestamp: '2026-01-30T10:00:00Z',
    caseId: 'C001',
    authorityClaimed: false,
    humanConfirmationRequired: false,
  },
];

// Project info for developer view
const PROJECT_INFO = {
  name: 'Residensi Harmoni',
  location: 'Kajang, Selangor',
  totalUnits: 250,
  sold: 180,
  loanInProgress: 45,
};

interface CaseStore {
  // State
  cases: Case[];
  proofEvents: ProofEvent[];
  projectInfo: typeof PROJECT_INFO;
  currentRole: Role;
  currentCaseId: string | null;
  
  // Actions
  setRole: (role: Role) => void;
  selectCase: (id: string | null) => void;
  getCaseById: (id: string) => Case | undefined;
  updateCasePhase: (id: string, phase: CasePhase) => void;
  addDocument: (caseId: string, doc: Document) => void;
  scheduleTac: (caseId: string, schedule: TacSchedule) => void;
  confirmTac: (caseId: string) => void;
  addProofEvent: (event: ProofEvent) => void;
  
  // Filtered views
  getCasesForRole: (role: Role) => Case[];
  getAggregatesForDeveloper: () => {
    totalCases: number;
    byStatus: Record<string, number>;
    conversionRate: number;
  };
}

export const useCaseStore = create<CaseStore>()(
  persist(
    (set, get) => ({
      cases: DEMO_CASES,
      proofEvents: DEMO_PROOF_EVENTS,
      projectInfo: PROJECT_INFO,
      currentRole: 'buyer',
      currentCaseId: null,
      
      setRole: (role) => set({ currentRole: role }),
      
      selectCase: (id) => set({ currentCaseId: id }),
      
      getCaseById: (id) => get().cases.find(c => c.id === id),
      
      updateCasePhase: (id, phase) => {
        const caseData = get().getCaseById(id);
        if (!caseData) return;
        
        // Create proof event
        const event = ProofEventFactory.phaseTransitioned(id, caseData.phase, phase);
        
        set((state) => ({
          cases: state.cases.map(c =>
            c.id === id ? { ...c, phase, updatedAt: new Date().toISOString() } : c
          ),
          proofEvents: [...state.proofEvents, event],
        }));
      },
      
      addDocument: (caseId, doc) => {
        const event = ProofEventFactory.documentUploaded(caseId, doc.type);
        
        set((state) => ({
          cases: state.cases.map(c =>
            c.id === caseId
              ? { ...c, documents: [...c.documents, doc], updatedAt: new Date().toISOString() }
              : c
          ),
          proofEvents: [...state.proofEvents, event],
        }));
      },
      
      scheduleTac: (caseId, schedule) => {
        const event = ProofEventFactory.tacScheduled(caseId, schedule);
        
        set((state) => ({
          cases: state.cases.map(c =>
            c.id === caseId
              ? { ...c, tacSchedule: schedule, phase: 'TAC_SCHEDULED', updatedAt: new Date().toISOString() }
              : c
          ),
          proofEvents: [...state.proofEvents, event],
        }));
      },
      
      confirmTac: (caseId) => {
        const event = ProofEventFactory.tacConfirmed(caseId);
        
        set((state) => ({
          cases: state.cases.map(c =>
            c.id === caseId && c.tacSchedule
              ? {
                  ...c,
                  tacSchedule: { ...c.tacSchedule, confirmed: true, confirmedAt: new Date().toISOString() },
                  phase: 'TAC_CONFIRMED',
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
          proofEvents: [...state.proofEvents, event],
        }));
      },
      
      addProofEvent: (event) => set((state) => ({
        proofEvents: [...state.proofEvents, event],
      })),
      
      getCasesForRole: (role) => {
        const cases = get().cases;
        // Developer doesn't see individual cases
        if (role === 'developer') return [];
        return cases;
      },
      
      getAggregatesForDeveloper: () => {
        const cases = get().cases;
        const byStatus: Record<string, number> = {};
        
        cases.forEach(c => {
          const status = c.phase;
          byStatus[status] = (byStatus[status] || 0) + 1;
        });
        
        const completed = cases.filter(c => c.phase === 'COMPLETED').length;
        
        return {
          totalCases: cases.length,
          byStatus,
          conversionRate: cases.length > 0 ? Math.round((completed / cases.length) * 100) : 0,
        };
      },
    }),
    {
      name: 'mortgage-flow-demo',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentRole: state.currentRole,
        currentCaseId: state.currentCaseId,
      }),
    }
  )
);
