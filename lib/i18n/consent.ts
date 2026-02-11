/**
 * @scope VISUAL ONLY - Presentation Layer
 * PDPA Consent i18n Strings
 * Sprint 0, Session S0.2 | PRD v3.6.3 CR-010
 * SF.2: Added C1-C6 purpose labels
 *
 * Bilingual support (BM + EN) for PDPA consent gate.
 * All strings follow Safe Language Guidelines.
 *
 * ⚠️ BOUNDARIES:
 * - Presentation layer strings only
 * - Does NOT write consent records
 * - Does NOT make API calls
 *
 * @see /docs/UI-AMENDMENTS.md
 */

import type { ConsentPurpose } from '../types/consent';

export type Locale = 'bm' | 'en';

/**
 * SF.2: Purpose-specific labels
 */
export interface PurposeStrings {
  label: string;
  description: string;
  badge: string; // "Wajib" or "Pilihan"
  dataCategories: string[];
}

export interface ConsentStrings {
  // Page title and intro
  pageTitle: string;
  pageSubtitle: string;
  introText: string;

  // SF.2: Purpose-based consent (C1-C6)
  purposes: {
    C1_ELIGIBILITY: PurposeStrings;
    C2_DOCUMENT_PROCESSING: PurposeStrings;
    C3_SHARE_AGENT: PurposeStrings;
    C4_DEVELOPER_ANALYTICS: PurposeStrings;
    C5_COMMUNICATION: PurposeStrings;
    C6_PROMOTIONAL: PurposeStrings;
  };

  // Legacy consent types (backward compat)
  consentTypes: {
    PDPA_BASIC: {
      label: string;
      description: string;
      required: string;
    };
    PDPA_MARKETING: {
      label: string;
      description: string;
      optional: string;
    };
    PDPA_ANALYTICS: {
      label: string;
      description: string;
      optional: string;
    };
    PDPA_THIRD_PARTY: {
      label: string;
      description: string;
      situational: string;
    };
    LPPSA_SUBMISSION: {
      label: string;
      description: string;
      situational: string;
    };
  };

  // Buttons
  buttons: {
    acceptRequired: string;
    acceptAll: string;
    viewFullNotice: string;
    continue: string;
    back: string;
  };

  // Messages
  messages: {
    requiredConsent: string;
    consentSaved: string;
    errorSaving: string;
    loadingNotice: string;
  };

  // Notice modal
  noticeModal: {
    title: string;
    closeButton: string;
    version: string;
    effectiveDate: string;
  };

  // Summary
  summary: {
    title: string;
    granted: string;
    notGranted: string;
    timestamp: string;
  };

  // Footer
  footer: {
    disclaimer: string;
    privacyLink: string;
    contactLink: string;
  };
}

// =============================================================================
// BAHASA MALAYSIA (BM)
// =============================================================================

export const consentStringsBM: ConsentStrings = {
  pageTitle: 'Notis Perlindungan Data Peribadi',
  pageSubtitle: 'Sila semak dan berikan persetujuan anda',
  introText:
    'Menurut Akta Perlindungan Data Peribadi 2010 (Pindaan 2024), kami memerlukan persetujuan anda sebelum memproses data peribadi anda untuk penilaian kelayakan pinjaman perumahan.',

  // SF.2: Purpose-based consent (C1-C6)
  purposes: {
    C1_ELIGIBILITY: {
      label: 'Penilaian Kelayakan Pinjaman',
      description: 'Memproses data pendapatan, pekerjaan, dan kewangan anda untuk mengira kelayakan pinjaman LPPSA.',
      badge: 'Wajib',
      dataCategories: ['Pendapatan', 'Pekerjaan', 'Komitmen Kewangan', 'Pengenalan'],
    },
    C2_DOCUMENT_PROCESSING: {
      label: 'Pengesahan Dokumen',
      description: 'Mengesahkan dan memproses dokumen sokongan (slip gaji, penyata bank, salinan IC) untuk permohonan pinjaman.',
      badge: 'Wajib',
      dataCategories: ['Slip Gaji', 'Penyata Bank', 'Salinan IC', 'Surat Pengesahan Majikan'],
    },
    C3_SHARE_AGENT: {
      label: 'Kongsi dengan Ejen Dilantik',
      description: 'Membenarkan ejen hartanah dilantik anda untuk melihat status kes dan membantu permohonan anda.',
      badge: 'Wajib',
      dataCategories: ['Status Kes', 'Isyarat Kesediaan', 'Kemajuan Fasa'],
    },
    C4_DEVELOPER_ANALYTICS: {
      label: 'Metrik Pipeline Pemaju',
      description: 'Kongsi metrik pipeline agregat (tanpa identiti) dengan pemaju projek. Tiada maklumat peribadi dikongsi.',
      badge: 'Wajib',
      dataCategories: ['Kiraan Agregat', 'Taburan Fasa', 'Metrik Penukaran'],
    },
    C5_COMMUNICATION: {
      label: 'Kemaskini Permohonan',
      description: 'Terima pemberitahuan SMS dan e-mel tentang status permohonan, tarikh akhir, dan tindakan diperlukan.',
      badge: 'Pilihan',
      dataCategories: ['Nombor Telefon', 'Alamat E-mel'],
    },
    C6_PROMOTIONAL: {
      label: 'Komunikasi Promosi',
      description: 'Terima maklumat tentang projek baharu, tawaran istimewa, dan tip gadai janji daripada pemaju dan rakan kongsi.',
      badge: 'Pilihan',
      dataCategories: ['Nombor Telefon', 'Alamat E-mel', 'Minat Projek'],
    },
  },

  consentTypes: {
    PDPA_BASIC: {
      label: 'Pemprosesan Data Asas',
      description:
        'Membenarkan kami memproses maklumat pengenalan, kewangan, dan hartanah anda untuk penilaian kelayakan pinjaman LPPSA.',
      required: 'Wajib',
    },
    PDPA_MARKETING: {
      label: 'Komunikasi Pemasaran',
      description:
        'Terima maklumat tentang projek baharu, promosi, dan tip kewangan melalui SMS, e-mel, atau WhatsApp.',
      optional: 'Pilihan',
    },
    PDPA_ANALYTICS: {
      label: 'Analitik Penggunaan',
      description:
        'Bantu kami meningkatkan perkhidmatan dengan membenarkan analitik penggunaan tanpa nama.',
      optional: 'Pilihan',
    },
    PDPA_THIRD_PARTY: {
      label: 'Perkongsian Pihak Ketiga',
      description:
        'Kongsi data permohonan anda dengan LPPSA dan bank rakan kongsi untuk pemprosesan pinjaman. Diperlukan semasa penyerahan permohonan.',
      situational: 'Situasi',
    },
    LPPSA_SUBMISSION: {
      label: 'Permohonan Rasmi LPPSA',
      description:
        'Membenarkan ejen yang dilantik untuk mengemukakan permohonan pinjaman LPPSA bagi pihak anda menggunakan dokumen yang telah dimuat naik.',
      situational: 'Situasi',
    },
  },

  buttons: {
    acceptRequired: 'Terima Yang Wajib',
    acceptAll: 'Terima Semua',
    viewFullNotice: 'Lihat Notis Penuh',
    continue: 'Teruskan',
    back: 'Kembali',
  },

  messages: {
    requiredConsent: 'Anda mesti bersetuju dengan pemprosesan data asas untuk meneruskan.',
    consentSaved: 'Persetujuan anda telah disimpan.',
    errorSaving: 'Ralat menyimpan persetujuan. Sila cuba lagi.',
    loadingNotice: 'Memuatkan notis PDPA...',
  },

  noticeModal: {
    title: 'Notis Perlindungan Data Peribadi Penuh',
    closeButton: 'Tutup',
    version: 'Versi',
    effectiveDate: 'Berkuat kuasa dari',
  },

  summary: {
    title: 'Ringkasan Persetujuan Anda',
    granted: 'Diberikan',
    notGranted: 'Tidak diberikan',
    timestamp: 'Masa persetujuan',
  },

  footer: {
    disclaimer:
      'Sistem ini menyediakan readiness signal dan aliran kerja tersusun, bukan kelulusan pinjaman dan bukan pengganti portal rasmi.',
    privacyLink: 'Polisi Privasi',
    contactLink: 'Hubungi Kami',
  },
};

// =============================================================================
// ENGLISH (EN)
// =============================================================================

export const consentStringsEN: ConsentStrings = {
  pageTitle: 'Personal Data Protection Notice',
  pageSubtitle: 'Please review and provide your consent',
  introText:
    'Under the Personal Data Protection Act 2010 (Amendment 2024), we require your consent before processing your personal data for housing loan eligibility assessment.',

  // SF.2: Purpose-based consent (C1-C6)
  purposes: {
    C1_ELIGIBILITY: {
      label: 'Loan Eligibility Assessment',
      description: 'Process your income, employment, and financial data to calculate LPPSA loan eligibility.',
      badge: 'Required',
      dataCategories: ['Income', 'Employment', 'Financial Commitments', 'Identification'],
    },
    C2_DOCUMENT_PROCESSING: {
      label: 'Document Verification',
      description: 'Verify and process supporting documents (payslips, bank statements, IC copies) for loan application.',
      badge: 'Required',
      dataCategories: ['Payslips', 'Bank Statements', 'IC Copies', 'Employment Letters'],
    },
    C3_SHARE_AGENT: {
      label: 'Share with Appointed Agent',
      description: 'Allow your appointed real estate agent to view case status and assist with your application.',
      badge: 'Required',
      dataCategories: ['Case Status', 'Readiness Signals', 'Phase Progress'],
    },
    C4_DEVELOPER_ANALYTICS: {
      label: 'Developer Pipeline Metrics',
      description: 'Share aggregate (non-identifiable) pipeline metrics with the project developer. No personal details shared.',
      badge: 'Required',
      dataCategories: ['Aggregate Counts', 'Phase Distribution', 'Conversion Metrics'],
    },
    C5_COMMUNICATION: {
      label: 'Application Updates',
      description: 'Receive SMS and email notifications about your application status, deadlines, and required actions.',
      badge: 'Optional',
      dataCategories: ['Phone Number', 'Email Address'],
    },
    C6_PROMOTIONAL: {
      label: 'Promotional Communications',
      description: 'Receive updates about new projects, special offers, and mortgage tips from developers and partners.',
      badge: 'Optional',
      dataCategories: ['Phone Number', 'Email Address', 'Project Interests'],
    },
  },

  consentTypes: {
    PDPA_BASIC: {
      label: 'Basic Data Processing',
      description:
        'Allow us to process your identification, financial, and property information for LPPSA loan eligibility assessment.',
      required: 'Required',
    },
    PDPA_MARKETING: {
      label: 'Marketing Communications',
      description:
        'Receive updates about new projects, promotions, and financial tips via SMS, email, or WhatsApp.',
      optional: 'Optional',
    },
    PDPA_ANALYTICS: {
      label: 'Usage Analytics',
      description:
        'Help us improve our service by allowing anonymous usage analytics.',
      optional: 'Optional',
    },
    PDPA_THIRD_PARTY: {
      label: 'Third-Party Sharing',
      description:
        'Share your application data with LPPSA and partner banks for loan processing. Required at submission stage.',
      situational: 'Situational',
    },
    LPPSA_SUBMISSION: {
      label: 'LPPSA Formal Submission',
      description:
        'Authorize the appointed agent to submit formal LPPSA loan application on your behalf using uploaded documents.',
      situational: 'Situational',
    },
  },

  buttons: {
    acceptRequired: 'Accept Required Only',
    acceptAll: 'Accept All',
    viewFullNotice: 'View Full Notice',
    continue: 'Continue',
    back: 'Back',
  },

  messages: {
    requiredConsent: 'You must agree to basic data processing to continue.',
    consentSaved: 'Your consent has been saved.',
    errorSaving: 'Error saving consent. Please try again.',
    loadingNotice: 'Loading PDPA notice...',
  },

  noticeModal: {
    title: 'Full Personal Data Protection Notice',
    closeButton: 'Close',
    version: 'Version',
    effectiveDate: 'Effective from',
  },

  summary: {
    title: 'Your Consent Summary',
    granted: 'Granted',
    notGranted: 'Not granted',
    timestamp: 'Consent time',
  },

  footer: {
    disclaimer:
      'This system provides readiness signals and structured workflows, not loan approvals and not a replacement for official portals.',
    privacyLink: 'Privacy Policy',
    contactLink: 'Contact Us',
  },
};

// =============================================================================
// LOCALE HELPER
// =============================================================================

const strings: Record<Locale, ConsentStrings> = {
  bm: consentStringsBM,
  en: consentStringsEN,
};

/**
 * Get consent strings for a locale
 */
export function getConsentStrings(locale: Locale = 'bm'): ConsentStrings {
  return strings[locale] || strings.bm;
}

/**
 * Get a specific string by path
 * Usage: t('buttons.continue', 'en') => 'Continue'
 */
export function t(path: string, locale: Locale = 'bm'): string {
  const parts = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = strings[locale];

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return path; // Return path if not found
    }
  }

  return typeof current === 'string' ? current : path;
}

// =============================================================================
// SF.2: PURPOSE-SPECIFIC HELPERS
// =============================================================================

/**
 * Get purpose strings for a specific purpose code
 */
export function getPurposeStrings(purpose: ConsentPurpose, locale: Locale = 'bm'): PurposeStrings {
  return strings[locale].purposes[purpose];
}

/**
 * Get all purpose strings for rendering
 */
export function getAllPurposeStrings(locale: Locale = 'bm'): Record<ConsentPurpose, PurposeStrings> {
  return strings[locale].purposes;
}

/**
 * Check if purpose is required
 */
export function isPurposeRequired(purpose: ConsentPurpose): boolean {
  return ['C1_ELIGIBILITY', 'C2_DOCUMENT_PROCESSING', 'C3_SHARE_AGENT', 'C4_DEVELOPER_ANALYTICS'].includes(purpose);
}
