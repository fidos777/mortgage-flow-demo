// app/components/hero/hero-data.ts
// Hero Section V7 — Data layer (types, bilingual copy, tokens, config)
// Extracted from monolithic V6 for clean separation

import type { Locale } from '@/app/context/locale'

/* ─── TYPES ─── */
export type SceneType = 'parties' | 'chaos' | 'transition' | 'clarity'

export type SubtitleCfg = {
  plain?: string
  before?: string
  accent: string
  after: string
}

export type IconName =
  | 'Package' | 'BarChart3' | 'FileText' | 'HelpCircle'
  | 'Phone' | 'MessageSquare' | 'TrendingUp' | 'Users'
  | 'Printer' | 'Shield' | 'CheckCircle2'

export type ChaosCard = { icon: IconName; label: string; sub: string }
export type TransitionCard = { label: string; sub: string; actorIdx: number }
export type ClarityBeat = { icon: IconName; label: string; sub: string; actorIdx: number }
export type StepLabel = { label: string }
export type ActorCopy = { label: string; desc: string }

export type PipelineCase = {
  name: string; type: string; progress: number
  status: string; dsr: string; docs: string
}
export type PipelineLabels = {
  name: string; type: string; progress: string
  dsr: string; docs: string; status: string
}
export type PipelineStatuses = {
  ready: string; review: string; pending: string; submitted: string
}

export interface LocaleCopy {
  pill: string
  headline1: string
  headline2: string
  actors: ActorCopy[]
  steps: StepLabel[]
  subtitleParties: SubtitleCfg
  partiesTitle: string
  subtitleChaos: SubtitleCfg
  subtitleTransition: SubtitleCfg
  subtitleClarity: SubtitleCfg
  chaosCards: ChaosCard[]
  transitionCards: TransitionCard[]
  transitionBadge: string
  transitionBadgeSub: string
  clarityBeats: ClarityBeat[]
  clarityBadge: string
  dashboardChip: string
  ctaPrimary: string
  ctaSecondary: string
  ctaMicro: string
  disclaimer: string
  pipelineTitle: string
  pipelineSub: string
  pipelineCases: PipelineCase[]
  pipelineLabels: PipelineLabels
  pipelineStatuses: PipelineStatuses
  pipelineFooter: string
  pipelineCta: string
}

/* ─── COLOR TOKENS ─── */
export const T: Record<number, string> = {
  900: '#042F2E', 800: '#134E4A', 700: '#115E59', 600: '#0D9488',
  500: '#14B8A6', 400: '#2DD4BF', 300: '#5EEAD4', 200: '#99F6E4',
  100: '#CCFBF1', 50: '#F0FDFA',
}
export const S: Record<number, string> = {
  900: '#0F172A', 800: '#1E293B', 700: '#334155', 600: '#475569',
  500: '#64748B', 400: '#94A3B8', 300: '#CBD5E1', 200: '#E2E8F0',
  100: '#F1F5F9', 50: '#F8FAFC',
}
export const A: Record<number, string> = {
  500: '#D97706', 400: '#F59E0B', 100: '#FEF3C7', 50: '#FFFBEB',
}

/* ─── SWEEP CONFIG (scene-driven background + accent system) ─── */
export type SweepConfig = {
  bg: string[]; accent: string; accentMuted: string
  accentSoft: string; border: string; lineStops: string[]
}

export const SWEEPS: Record<SceneType, SweepConfig> = {
  parties: {
    bg: [S[50], 'white', S[50]],
    accent: T[500], accentMuted: T[300], accentSoft: T[300] + '40',
    border: S[200], lineStops: [T[400], T[500], T[400]],
  },
  chaos: {
    bg: ['#FFF8F8', 'white', S[50]],
    accent: '#EF4444', accentMuted: S[400], accentSoft: '#FCA5A520',
    border: '#FECACA50', lineStops: [S[300], S[400], S[300]],
  },
  transition: {
    bg: [`${T[50]}60`, 'white', `${T[50]}40`],
    accent: T[500], accentMuted: T[400], accentSoft: T[500] + '15',
    border: T[200], lineStops: [T[300], T[400], T[300]],
  },
  clarity: {
    bg: [T[50] + 'CC', 'white', T[50] + 'CC'],
    accent: T[500], accentMuted: T[400], accentSoft: T[500] + '18',
    border: T[200], lineStops: [T[400], T[500], T[400]],
  },
}

/* ─── SCENE CONFIG ─── */
export const SCENES: SceneType[] = ['parties', 'chaos', 'transition', 'clarity']
export const DURATIONS: Record<SceneType, number> = {
  parties: 3500, chaos: 5000, transition: 4000, clarity: 4500,
}

/* ─── FIXED ACTOR POSITIONS (constant across all 4 scenes) ─── */
export const ACTOR_POS = [
  { x: '15%', y: '64%' },
  { x: '50%', y: '64%' },
  { x: '85%', y: '64%' },
]

/* ─── NODE SIZES per scene (developer always dominant) ─── */
export type NodeSize = { s: number; i: number; f: number }
export const NODE_SIZES: Record<SceneType, NodeSize[]> = {
  parties:    [{ s: 64, i: 28, f: 14 }, { s: 60, i: 26, f: 14 }, { s: 60, i: 26, f: 14 }],
  chaos:      [{ s: 60, i: 26, f: 14 }, { s: 48, i: 20, f: 12 }, { s: 48, i: 20, f: 12 }],
  transition: [{ s: 64, i: 28, f: 14 }, { s: 50, i: 22, f: 12 }, { s: 50, i: 22, f: 12 }],
  clarity:    [{ s: 64, i: 28, f: 14 }, { s: 52, i: 22, f: 12 }, { s: 52, i: 22, f: 12 }],
}

/* ─── CHAOS CARD ROTATIONS ─── */
export const CHAOS_ROTATIONS = [-8, 5, -4, 7, -10, 3, -6, 9, -5]

/* ═══════════════════════════════════════════
   BILINGUAL COPY MAP (v7 — 4-Act, Lucide icons)
   ═══════════════════════════════════════════ */
export const COPY: Record<Locale, LocaleCopy> = {
  bm: {
    pill: 'Kawalan Penukaran LPPSA untuk Pemaju',
    headline1: 'LPPSA Tak Sepatutnya',
    headline2: 'Perlahankan Jualan Anda.',
    actors: [
      { label: 'Pemaju', desc: 'Jual unit, pantau pipeline' },
      { label: 'Pembeli', desc: 'Penjawat awam, guna LPPSA' },
      { label: 'Ejen Bertauliah', desc: 'Uruskan submission' },
    ],
    steps: [
      { label: '3 Peranan' },
      { label: 'Realiti' },
      { label: 'Cara Lain' },
      { label: 'Terkawal' },
    ],
    subtitleParties: {
      before: 'Setiap transaksi LPPSA melibatkan ',
      accent: 'tiga peranan utama',
      after: ' — pemaju, pembeli, dan ejen.',
    },
    partiesTitle: 'Pihak Utama dalam Proses Permohonan LPPSA',
    subtitleChaos: {
      plain: 'Kes LPPSA tergendala. Dokumen tak lengkap. Status tak jelas. Dan setiap bulan tertangguh, ',
      accent: 'cashflow projek anda terjejas',
      after: '.',
    },
    subtitleTransition: {
      before: 'Anda tak perlu ganti ejen anda. Anda perlu ',
      accent: 'nampak apa yang berlaku',
      after: ' — sebelum kes tergendala.',
    },
    subtitleClarity: {
      plain: 'Setiap kes LPPSA — visible. Setiap dokumen — tracked. LPPSA berhenti jadi bottleneck. ',
      accent: 'Mula jadi conversion channel',
      after: '.',
    },
    chaosCards: [
      { icon: 'Package', label: 'Kes tertangguh', sub: '4 bulan, belum submit' },
      { icon: 'BarChart3', label: 'DSR tak disemak', sub: 'Tahu lepas reject' },
      { icon: 'FileText', label: 'Dokumen tak lengkap', sub: 'Pembeli tak tahu apa perlu' },
      { icon: 'HelpCircle', label: 'Status tak jelas', sub: '"Ejen kata masih proses"' },
      { icon: 'Phone', label: 'Pembeli telefon', sub: '"Macam mana status saya?"' },
      { icon: 'MessageSquare', label: 'WhatsApp berterabur', sub: 'Ejen, pembeli, peguam' },
      { icon: 'TrendingUp', label: 'Forecast tak tepat', sub: 'Berapa unit convert?' },
      { icon: 'Users', label: 'Pasukan jualan', sub: 'Tak boleh guide pembeli' },
      { icon: 'Printer', label: 'Banyak isi borang', sub: 'Manual, rawan kesilapan' },
    ],
    transitionCards: [
      { label: 'Beri link QR', sub: 'Link generation + invitation', actorIdx: 0 },
      { label: 'Pembeli isi sendiri', sub: 'PreScan self-service', actorIdx: 1 },
      { label: 'Ejen uruskan', sub: 'Agent routing + Portal Kit', actorIdx: 2 },
    ],
    transitionBadge: 'Pemaju pantau semua',
    transitionBadgeSub: 'Pipeline dashboard',
    clarityBeats: [
      { icon: 'FileText', label: 'Dokumen terstruktur', sub: 'Senarai semak ikut jenis pinjaman', actorIdx: 0 },
      { icon: 'Shield', label: 'Kesediaan ditapis awal', sub: 'Risiko DSR dikesan sebelum submit', actorIdx: 1 },
      { icon: 'CheckCircle2', label: 'Submission berjaya', sub: '>90% kes lengkap pertama kali', actorIdx: 2 },
    ],
    clarityBadge: 'Real-time Sales Pipeline',
    dashboardChip: '4/5 kes progressing',
    ctaPrimary: 'Lihat Demo Pipeline',
    ctaSecondary: 'Bagaimana Ia Berfungsi',
    ctaMicro: 'Tiada pendaftaran. Lihat bagaimana 10 kes LPPSA bergerak melalui satu dashboard — dalam masa nyata.',
    disclaimer: 'Sistem ini untuk rujukan sahaja. Tiada penghantaran atau kelulusan dilakukan oleh sistem.',
    pipelineTitle: 'Lihat Bagaimana Pipeline Anda Akan Kelihatan',
    pipelineSub: 'Dashboard yang menunjukkan setiap kes LPPSA — dari dokumen pertama hingga submission akhir.',
    pipelineCases: [
      { name: 'Ahmad bin Ismail', type: 'Jenis 1', progress: 92, status: 'ready', dsr: 'Rendah', docs: '8/8' },
      { name: 'Siti Nurhaliza', type: 'Jenis 4', progress: 75, status: 'review', dsr: 'Sederhana', docs: '6/8' },
      { name: 'Mohd Razif', type: 'Jenis 1', progress: 45, status: 'pending', dsr: 'Belum semak', docs: '3/8' },
      { name: 'Noraini Hassan', type: 'Jenis 2', progress: 100, status: 'submitted', dsr: 'Rendah', docs: '8/8' },
      { name: 'Kamal Effendi', type: 'Jenis 4', progress: 60, status: 'review', dsr: 'Tinggi', docs: '5/8' },
    ],
    pipelineLabels: { name: 'Pembeli', type: 'Jenis', progress: 'Kesediaan', dsr: 'Risiko DSR', docs: 'Dokumen', status: 'Status' },
    pipelineStatuses: { ready: 'Sedia', review: 'Semakan', pending: 'Menunggu', submitted: 'Dihantar' },
    pipelineFooter: 'Pantau, bukan kejar. Setiap kes jelas statusnya.',
    pipelineCta: 'Cuba Demo Dengan Data Contoh',
  },
  en: {
    pill: 'LPPSA Conversion Control for Developers',
    headline1: 'LPPSA Shouldn\u2019t Slow',
    headline2: 'Your Sales Pipeline.',
    actors: [
      { label: 'Developer', desc: 'Sell units, track pipeline' },
      { label: 'Buyer', desc: 'Public servant, uses LPPSA' },
      { label: 'Qualified Agent', desc: 'Handles submission' },
    ],
    steps: [
      { label: '3 Roles' },
      { label: 'The Reality' },
      { label: 'A Better Way' },
      { label: 'Under Control' },
    ],
    subtitleParties: {
      before: 'Every LPPSA transaction involves ',
      accent: 'three key roles',
      after: ' \u2014 developer, buyer, and agent.',
    },
    partiesTitle: 'Key Parties in the LPPSA Application Process',
    subtitleChaos: {
      plain: 'LPPSA cases stalling. Documents incomplete. Status unknown. And every month of delay quietly impacts ',
      accent: 'your project cashflow',
      after: '.',
    },
    subtitleTransition: {
      before: 'You don\u2019t need to replace your agent. You need to ',
      accent: 'see what\u2019s happening',
      after: ' \u2014 before cases stall.',
    },
    subtitleClarity: {
      plain: 'Every LPPSA case \u2014 visible. Every document \u2014 tracked. LPPSA stops being a bottleneck. ',
      accent: 'Starts being a conversion channel',
      after: '.',
    },
    chaosCards: [
      { icon: 'Package', label: 'Case stuck', sub: '4 months, not submitted' },
      { icon: 'BarChart3', label: 'DSR unchecked', sub: 'Found out after rejection' },
      { icon: 'FileText', label: 'Docs incomplete', sub: 'Buyer doesn\u2019t know what\u2019s needed' },
      { icon: 'HelpCircle', label: 'Status unknown', sub: '"Agent says still processing"' },
      { icon: 'Phone', label: 'Buyer calling', sub: '"What\u2019s my status?"' },
      { icon: 'MessageSquare', label: 'WhatsApp chaos', sub: 'Agent, buyer, lawyer \u2014 one thread' },
      { icon: 'TrendingUp', label: 'Forecast unreliable', sub: 'How many units converting?' },
      { icon: 'Users', label: 'Sales team', sub: 'Can\u2019t guide LPPSA buyers' },
      { icon: 'Printer', label: 'Too many forms', sub: 'Manual, error-prone' },
    ],
    transitionCards: [
      { label: 'Share QR link', sub: 'Link generation + invitation', actorIdx: 0 },
      { label: 'Buyer fills in details', sub: 'PreScan self-service', actorIdx: 1 },
      { label: 'Agent handles it', sub: 'Agent routing + Portal Kit', actorIdx: 2 },
    ],
    transitionBadge: 'Developer monitors everything',
    transitionBadgeSub: 'Pipeline dashboard',
    clarityBeats: [
      { icon: 'FileText', label: 'Docs structured', sub: 'Checklist per loan type', actorIdx: 0 },
      { icon: 'Shield', label: 'Readiness filtered early', sub: 'DSR risk caught before submission', actorIdx: 1 },
      { icon: 'CheckCircle2', label: 'Submission success', sub: '>90% cases complete on first try', actorIdx: 2 },
    ],
    clarityBadge: 'Real-time Sales Pipeline',
    dashboardChip: '4/5 cases progressing',
    ctaPrimary: 'See the Pipeline Demo',
    ctaSecondary: 'How It Works',
    ctaMicro: 'No signup required. See how 10 LPPSA cases flow through one dashboard \u2014 in real time.',
    disclaimer: 'This system is for reference only. No submission or approval is performed by the system.',
    pipelineTitle: 'See What Your Pipeline Will Look Like',
    pipelineSub: 'A dashboard showing every LPPSA case \u2014 from first document to final submission.',
    pipelineCases: [
      { name: 'Ahmad bin Ismail', type: 'Type 1', progress: 92, status: 'ready', dsr: 'Low', docs: '8/8' },
      { name: 'Siti Nurhaliza', type: 'Type 4', progress: 75, status: 'review', dsr: 'Medium', docs: '6/8' },
      { name: 'Mohd Razif', type: 'Type 1', progress: 45, status: 'pending', dsr: 'Unchecked', docs: '3/8' },
      { name: 'Noraini Hassan', type: 'Type 2', progress: 100, status: 'submitted', dsr: 'Low', docs: '8/8' },
      { name: 'Kamal Effendi', type: 'Type 4', progress: 60, status: 'review', dsr: 'High', docs: '5/8' },
    ],
    pipelineLabels: { name: 'Buyer', type: 'Type', progress: 'Readiness', dsr: 'DSR Risk', docs: 'Documents', status: 'Status' },
    pipelineStatuses: { ready: 'Ready', review: 'In Review', pending: 'Pending', submitted: 'Submitted' },
    pipelineFooter: 'Monitor, don\u2019t chase. Every case shows its status clearly.',
    pipelineCta: 'Try Demo With Sample Data',
  },
}
