/**
 * @scope VISUAL ONLY - Presentation Layer
 * Glossary for consistent terminology across BM/EN translations
 *
 * This file serves as the single source of truth for key terms used in the mortgage flow.
 * When adding new translations, always refer to this glossary for consistency.
 *
 * COMPLIANCE NOTE:
 * Avoid using approval-related terms (lulus, kelulusan, approved, eligible, etc.)
 * Use neutral terms like "signal", "readiness", "indication" instead.
 *
 * @see /docs/UI-AMENDMENTS.md
 */

export const glossary = {
  bm: {
    signal: 'Isyarat',
    readinessScan: 'Imbasan Kesediaan',
    identityVerification: 'Pengesahan identiti',
    commitmentRatio: 'Nisbah Komitmen (DSR)',
    contributingFactors: 'Faktor yang mempengaruhi',
    earlyScreening: 'Semakan awal',
    officialOutcome: 'Keputusan rasmi',
    documentCollection: 'Pengumpulan dokumen',
  },
  en: {
    signal: 'Signal',
    readinessScan: 'Readiness Scan',
    identityVerification: 'Identity verification',
    commitmentRatio: 'Commitment ratio (DSR)',
    contributingFactors: 'Contributing factors',
    earlyScreening: 'Early screening',
    officialOutcome: 'Official outcome',
    documentCollection: 'Document collection',
  },
} as const;

// Type for glossary keys
export type GlossaryKey = keyof typeof glossary.bm;

// Helper to get term in specific language
export function getTerm(key: GlossaryKey, lang: 'bm' | 'en'): string {
  return glossary[lang][key];
}

// Export banned words for reference (also in check-i18n.ts)
export const BANNED_WORDS = {
  bm: ['lulus', 'kelulusan', 'layak', 'ditolak'],
  en: ['approved', 'approval', 'eligible', 'rejected', 'guaranteed', 'guarantee', 'approve', 'reject'],
} as const;
