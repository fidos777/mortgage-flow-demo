/**
 * Mobile Viewport QA
 * UX.1: Mobile Viewport QA | PRD v3.6.3
 *
 * Utilities for testing mobile responsiveness across all buyer-facing screens.
 * Target: iPhone SE (375px) minimum width support.
 */

// =============================================================================
// VIEWPORT BREAKPOINTS
// =============================================================================

export const VIEWPORT_BREAKPOINTS = {
  // Mobile devices
  MOBILE_XS: 320,   // iPhone SE (1st gen)
  MOBILE_SM: 375,   // iPhone SE (2nd/3rd gen) - PRIMARY TARGET
  MOBILE_MD: 390,   // iPhone 14
  MOBILE_LG: 428,   // iPhone 14 Pro Max

  // Tablet
  TABLET_SM: 768,   // iPad Mini
  TABLET_MD: 834,   // iPad Air
  TABLET_LG: 1024,  // iPad Pro

  // Desktop
  DESKTOP_SM: 1280,
  DESKTOP_MD: 1440,
  DESKTOP_LG: 1920,
} as const;

export type ViewportBreakpoint = keyof typeof VIEWPORT_BREAKPOINTS;

// =============================================================================
// TEST DEVICES
// =============================================================================

export interface TestDevice {
  name: string;
  width: number;
  height: number;
  pixelRatio: number;
  userAgent?: string;
}

export const TEST_DEVICES: TestDevice[] = [
  // Primary target - minimum supported
  { name: 'iPhone SE', width: 375, height: 667, pixelRatio: 2 },

  // Common devices
  { name: 'iPhone 14', width: 390, height: 844, pixelRatio: 3 },
  { name: 'iPhone 14 Pro Max', width: 428, height: 926, pixelRatio: 3 },
  { name: 'Samsung Galaxy S21', width: 360, height: 800, pixelRatio: 3 },
  { name: 'Pixel 7', width: 412, height: 915, pixelRatio: 2.625 },

  // Tablets
  { name: 'iPad Mini', width: 768, height: 1024, pixelRatio: 2 },
  { name: 'iPad Air', width: 834, height: 1194, pixelRatio: 2 },
];

// =============================================================================
// QA CHECKLIST ITEMS
// =============================================================================

export type QACheckStatus = 'PASS' | 'FAIL' | 'PARTIAL' | 'NOT_TESTED';

export interface QACheckItem {
  id: string;
  category: string;
  description: string;
  descriptionBm: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  testSteps: string[];
  expectedResult: string;
}

export const MOBILE_QA_CHECKLIST: QACheckItem[] = [
  // ==========================================================================
  // LAYOUT & OVERFLOW
  // ==========================================================================
  {
    id: 'layout-001',
    category: 'Layout',
    description: 'No horizontal scroll on any page',
    descriptionBm: 'Tiada scroll horizontal pada mana-mana halaman',
    severity: 'CRITICAL',
    testSteps: [
      'Open each page on iPhone SE (375px)',
      'Attempt to scroll horizontally',
      'Check for content overflow',
    ],
    expectedResult: 'Page should not scroll horizontally',
  },
  {
    id: 'layout-002',
    category: 'Layout',
    description: 'Text does not overflow containers',
    descriptionBm: 'Teks tidak melebihi bekas',
    severity: 'CRITICAL',
    testSteps: [
      'Check all text content on mobile',
      'Verify long text truncates or wraps properly',
      'Check button labels, headings, paragraphs',
    ],
    expectedResult: 'All text should fit within containers',
  },
  {
    id: 'layout-003',
    category: 'Layout',
    description: 'Cards and panels stack vertically on mobile',
    descriptionBm: 'Kad dan panel tersusun menegak pada mobile',
    severity: 'MAJOR',
    testSteps: [
      'View dashboard cards on mobile',
      'Check multi-column layouts',
    ],
    expectedResult: 'Items should stack into single column',
  },

  // ==========================================================================
  // TOUCH TARGETS
  // ==========================================================================
  {
    id: 'touch-001',
    category: 'Touch',
    description: 'All buttons meet 44x44px minimum touch target',
    descriptionBm: 'Semua butang memenuhi sasaran sentuh minimum 44x44px',
    severity: 'CRITICAL',
    testSteps: [
      'Measure button dimensions',
      'Check icon buttons',
      'Verify spacing between clickable items',
    ],
    expectedResult: 'Touch targets >= 44x44px with adequate spacing',
  },
  {
    id: 'touch-002',
    category: 'Touch',
    description: 'Form inputs are easily tappable',
    descriptionBm: 'Input borang mudah ditap',
    severity: 'CRITICAL',
    testSteps: [
      'Test all form inputs on mobile',
      'Verify input height >= 48px',
      'Check dropdown/select accessibility',
    ],
    expectedResult: 'Inputs should be easy to tap accurately',
  },
  {
    id: 'touch-003',
    category: 'Touch',
    description: 'Links have adequate tap area',
    descriptionBm: 'Pautan mempunyai kawasan tap yang mencukupi',
    severity: 'MAJOR',
    testSteps: [
      'Check inline links',
      'Verify navigation links',
      'Test footer links',
    ],
    expectedResult: 'Links should be easy to tap without mis-taps',
  },

  // ==========================================================================
  // FORMS
  // ==========================================================================
  {
    id: 'form-001',
    category: 'Forms',
    description: 'Keyboard does not obscure active input',
    descriptionBm: 'Papan kekunci tidak menghalang input aktif',
    severity: 'CRITICAL',
    testSteps: [
      'Tap into form inputs',
      'Check if viewport scrolls to show input',
      'Test in long forms',
    ],
    expectedResult: 'Active input should remain visible above keyboard',
  },
  {
    id: 'form-002',
    category: 'Forms',
    description: 'Form validation messages are visible',
    descriptionBm: 'Mesej pengesahan borang boleh dilihat',
    severity: 'CRITICAL',
    testSteps: [
      'Trigger validation errors',
      'Check error message visibility',
      'Verify error does not overflow',
    ],
    expectedResult: 'Error messages visible and readable',
  },
  {
    id: 'form-003',
    category: 'Forms',
    description: 'Submit buttons always visible or accessible',
    descriptionBm: 'Butang hantar sentiasa kelihatan atau boleh diakses',
    severity: 'MAJOR',
    testSteps: [
      'Check form submit button position',
      'Verify sticky footer if used',
      'Test scrolling to submit',
    ],
    expectedResult: 'User can easily find and tap submit',
  },

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================
  {
    id: 'nav-001',
    category: 'Navigation',
    description: 'Mobile navigation is accessible',
    descriptionBm: 'Navigasi mobile boleh diakses',
    severity: 'CRITICAL',
    testSteps: [
      'Check hamburger menu (if exists)',
      'Verify bottom navigation (if exists)',
      'Test all nav links',
    ],
    expectedResult: 'Navigation should be fully functional',
  },
  {
    id: 'nav-002',
    category: 'Navigation',
    description: 'Back navigation works correctly',
    descriptionBm: 'Navigasi kembali berfungsi dengan betul',
    severity: 'MAJOR',
    testSteps: [
      'Use browser back button',
      'Test in-app back buttons',
      'Verify state is preserved',
    ],
    expectedResult: 'Back navigation returns to expected page',
  },

  // ==========================================================================
  // MODALS & OVERLAYS
  // ==========================================================================
  {
    id: 'modal-001',
    category: 'Modals',
    description: 'Modals fit within mobile viewport',
    descriptionBm: 'Modal muat dalam viewport mobile',
    severity: 'CRITICAL',
    testSteps: [
      'Open all modals on mobile',
      'Check modal width and height',
      'Verify scrollable if content overflows',
    ],
    expectedResult: 'Modals should not exceed viewport',
  },
  {
    id: 'modal-002',
    category: 'Modals',
    description: 'Modal close button is accessible',
    descriptionBm: 'Butang tutup modal boleh diakses',
    severity: 'CRITICAL',
    testSteps: [
      'Check X button position',
      'Verify tap area',
      'Test closing by backdrop tap',
    ],
    expectedResult: 'Easy to close modals',
  },

  // ==========================================================================
  // TYPOGRAPHY
  // ==========================================================================
  {
    id: 'type-001',
    category: 'Typography',
    description: 'Body text is readable (min 16px)',
    descriptionBm: 'Teks badan boleh dibaca (min 16px)',
    severity: 'CRITICAL',
    testSteps: [
      'Check paragraph text size',
      'Verify line height',
      'Test readability',
    ],
    expectedResult: 'Text should be comfortable to read',
  },
  {
    id: 'type-002',
    category: 'Typography',
    description: 'Headings scale appropriately',
    descriptionBm: 'Heading berskala dengan sesuai',
    severity: 'MAJOR',
    testSteps: [
      'Check H1, H2, H3 sizes on mobile',
      'Verify heading hierarchy',
    ],
    expectedResult: 'Headings readable but not oversized',
  },

  // ==========================================================================
  // IMAGES & MEDIA
  // ==========================================================================
  {
    id: 'media-001',
    category: 'Media',
    description: 'Images are responsive',
    descriptionBm: 'Imej responsif',
    severity: 'MAJOR',
    testSteps: [
      'Check all images on mobile',
      'Verify max-width: 100%',
      'Test aspect ratio preservation',
    ],
    expectedResult: 'Images should scale without overflow',
  },

  // ==========================================================================
  // PERFORMANCE
  // ==========================================================================
  {
    id: 'perf-001',
    category: 'Performance',
    description: 'Page loads quickly on 3G',
    descriptionBm: 'Halaman dimuatkan dengan pantas pada 3G',
    severity: 'MAJOR',
    testSteps: [
      'Throttle to 3G in DevTools',
      'Measure LCP (Largest Contentful Paint)',
      'Check for render blocking',
    ],
    expectedResult: 'LCP < 2.5s on 3G',
  },
  {
    id: 'perf-002',
    category: 'Performance',
    description: 'Interactions feel responsive',
    descriptionBm: 'Interaksi terasa responsif',
    severity: 'MAJOR',
    testSteps: [
      'Tap buttons and links',
      'Check for lag or delay',
      'Test form input responsiveness',
    ],
    expectedResult: 'No perceptible delay on interactions',
  },
];

// =============================================================================
// BUYER FLOW SCREENS TO TEST
// =============================================================================

export const BUYER_FLOW_SCREENS = [
  { path: '/buyer/start', name: 'PDPA Consent', nameBm: 'Persetujuan PDPA' },
  { path: '/buyer/upload', name: 'Document Upload', nameBm: 'Muat Naik Dokumen' },
  { path: '/buyer/upload-complete', name: 'Upload Complete', nameBm: 'Muat Naik Selesai' },
  { path: '/buyer/temujanji', name: 'Appointment Booking', nameBm: 'Tempah Temujanji' },
  { path: '/buyer/prescan', name: 'PreScan (Legacy)', nameBm: 'PreScan (Lama)' },
  { path: '/buyer/prescan/result', name: 'PreScan Result', nameBm: 'Keputusan PreScan' },
] as const;

// =============================================================================
// QA RESULT TRACKING
// =============================================================================

export interface QATestResult {
  checkId: string;
  device: string;
  screen: string;
  status: QACheckStatus;
  notes?: string;
  screenshot?: string;
  testedAt: string;
  testedBy: string;
}

export interface QAReport {
  id: string;
  createdAt: string;
  createdBy: string;
  devices: string[];
  screens: string[];
  results: QATestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    partial: number;
    notTested: number;
    passRate: number;
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate empty QA report template
 */
export function generateQAReportTemplate(
  screens: typeof BUYER_FLOW_SCREENS,
  devices: TestDevice[]
): QATestResult[] {
  const results: QATestResult[] = [];

  for (const screen of screens) {
    for (const device of devices) {
      for (const check of MOBILE_QA_CHECKLIST) {
        results.push({
          checkId: check.id,
          device: device.name,
          screen: screen.path,
          status: 'NOT_TESTED',
          testedAt: '',
          testedBy: '',
        });
      }
    }
  }

  return results;
}

/**
 * Calculate QA report summary
 */
export function calculateQASummary(results: QATestResult[]): QAReport['summary'] {
  const total = results.length;
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const partial = results.filter(r => r.status === 'PARTIAL').length;
  const notTested = results.filter(r => r.status === 'NOT_TESTED').length;

  return {
    total,
    passed,
    failed,
    partial,
    notTested,
    passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
  };
}

/**
 * Get critical failures from results
 */
export function getCriticalFailures(results: QATestResult[]): QATestResult[] {
  return results.filter(r => {
    if (r.status !== 'FAIL') return false;
    const check = MOBILE_QA_CHECKLIST.find(c => c.id === r.checkId);
    return check?.severity === 'CRITICAL';
  });
}

/**
 * Check if QA is ready for release (no critical failures)
 */
export function isReadyForRelease(results: QATestResult[]): boolean {
  const criticalFailures = getCriticalFailures(results);
  return criticalFailures.length === 0;
}
