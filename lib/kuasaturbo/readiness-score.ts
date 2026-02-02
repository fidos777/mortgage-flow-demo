// lib/kuasaturbo/readiness-score.ts
// Readiness scoring aligned with PRD v3.6.1 Section 16 & Appendix A
// NOTE: This generates ADVISORY SIGNALS only, not eligibility decisions
// P3-5: Deterministic - Same input ALWAYS produces same output

import { ReadinessResult, ReadinessBand } from '@/types/case';

export interface ReadinessInputs {
  employmentType: 'tetap' | 'kontrak' | '';
  employmentScheme: string;
  incomeRange: string;
  serviceYears: string;
  existingLoan: 'yes' | 'no' | '';
  ageRange: string;
  commitmentRange: string;
  hasUpload: boolean;
  propertyPrice?: number;
}

/**
 * PRD Appendix A: Readiness Scoring Formula (EXACT)
 * 
 * A. Rule Coverage (0-30 pts)
 *    - Employment Type: Tetap=20, Kontrak=8
 *    - Service Years: 5+=10, 3-4=6, <3=2
 *    - Age Factor: <35=0 (full tenure), 35-49=0, 50-55=-2, 56+=-5
 * 
 * B. Income Pattern (0-25 pts)
 *    - Base Income Score: Maps income range to 5-18 pts
 *    - Consistency Bonus: Tetap=7, Kontrak=3
 * 
 * C. Commitment Signal (0-25 pts)
 *    - DSR Range: 0-30%=25, 31-40%=18, 41-50%=10, 51-60%=4, >60%=0
 * 
 * D. Property Context (0-20 pts)
 *    - Price-to-Income Multiple: <5x=20, 5-7x=15, 7-10x=10, >10x=5
 *    - Existing LPPSA Loan: -8 penalty
 * 
 * TOTAL: 100 pts max
 */
export function calculateReadiness(inputs: ReadinessInputs): ReadinessResult {
  const componentA = calculateRuleCoverage(inputs);
  const componentB = calculateIncomePattern(inputs);
  const componentC = calculateCommitmentSignal(inputs);
  const componentD = calculatePropertyContext(inputs);
  
  const totalScore = Math.min(100, Math.max(0, 
    componentA + componentB + componentC + componentD
  ));
  
  return scoreToResult(totalScore, { componentA, componentB, componentC, componentD });
}

/**
 * A. Rule Coverage (0-30 pts)
 */
function calculateRuleCoverage(inputs: ReadinessInputs): number {
  let score = 0;
  
  // Employment Type (max 20)
  if (inputs.employmentType === 'tetap') {
    score += 20;
  } else if (inputs.employmentType === 'kontrak') {
    score += 8;
  }
  
  // Service Years (max 10)
  if (inputs.serviceYears === '5+') {
    score += 10;
  } else if (inputs.serviceYears === '3-4') {
    score += 6;
  } else if (inputs.serviceYears === '0-2') {
    score += 2;
  }
  
  // Age Factor (adjustment, can be negative)
  if (inputs.ageRange === '50-55') {
    score -= 2;
  } else if (inputs.ageRange === '56+') {
    score -= 5;
  }
  // below35 and 35-49 get no penalty (full tenure potential)
  
  return Math.max(0, Math.min(30, score));
}

/**
 * B. Income Pattern (0-25 pts)
 */
function calculateIncomePattern(inputs: ReadinessInputs): number {
  let score = 0;
  
  // Base Income Score (max 18)
  const incomeScores: Record<string, number> = {
    '8001+': 18,
    '6001-8000': 15,
    '5001-6000': 12,
    '4001-5000': 9,
    '3001-4000': 6,
    '2000-3000': 5,
  };
  score += incomeScores[inputs.incomeRange] || 5;
  
  // Consistency Bonus (max 7)
  if (inputs.employmentType === 'tetap') {
    score += 7; // Stable income pattern
  } else if (inputs.employmentType === 'kontrak') {
    score += 3; // Variable income pattern
  }
  
  return Math.min(25, score);
}

/**
 * C. Commitment Signal (0-25 pts)
 * Based on declared DSR (Debt Service Ratio)
 */
function calculateCommitmentSignal(inputs: ReadinessInputs): number {
  const commitmentScores: Record<string, number> = {
    '0-30': 25,   // Excellent - low existing commitments
    '31-40': 18,  // Good - moderate commitments
    '41-50': 10,  // Caution - high commitments
    '51+': 4,     // Warning - very high commitments
  };
  
  return commitmentScores[inputs.commitmentRange] || 0;
}

/**
 * D. Property Context (0-20 pts)
 */
function calculatePropertyContext(inputs: ReadinessInputs): number {
  let score = 0;
  
  // Price-to-Income Multiple estimation
  // Since we only have income range, estimate midpoint
  const incomeMidpoints: Record<string, number> = {
    '8001+': 10000,
    '6001-8000': 7000,
    '5001-6000': 5500,
    '4001-5000': 4500,
    '3001-4000': 3500,
    '2000-3000': 2500,
  };
  
  const monthlyIncome = incomeMidpoints[inputs.incomeRange] || 4000;
  const annualIncome = monthlyIncome * 12;
  const propertyPrice = inputs.propertyPrice || 450000; // Default demo property
  
  const priceMultiple = propertyPrice / annualIncome;
  
  if (priceMultiple < 5) {
    score += 20; // Very affordable
  } else if (priceMultiple < 7) {
    score += 15; // Affordable
  } else if (priceMultiple < 10) {
    score += 10; // Stretched
  } else {
    score += 5;  // High stretch
  }
  
  // Existing LPPSA Loan Penalty
  if (inputs.existingLoan === 'yes') {
    score -= 8; // Significant penalty for existing loan
  }
  
  return Math.max(0, Math.min(20, score));
}

/**
 * Score breakdown for internal logging (never shown to user)
 */
interface ScoreBreakdown {
  componentA: number;
  componentB: number;
  componentC: number;
  componentD: number;
}

/**
 * PRD Section 16.2: Result Classification
 * READY TO CONTINUE (≥70)
 * CONTINUE WITH CAUTION (50-69)
 * NOT READY TO PROCEED (<50)
 */
function scoreToResult(score: number, breakdown?: ScoreBreakdown): ReadinessResult {
  let band: ReadinessBand;
  let label: string;
  let guidance: string;
  
  if (score >= 70) {
    band = 'ready';
    label = 'READY TO CONTINUE';
    guidance = 'Anda boleh meneruskan ke proses tempahan dan penyediaan dokumen.';
  } else if (score >= 50) {
    band = 'caution';
    label = 'CONTINUE WITH CAUTION';
    guidance = 'Anda boleh meneruskan dengan perhatian kepada item yang ditandakan.';
  } else {
    band = 'not_ready';
    label = 'NOT READY TO PROCEED';
    guidance = 'Sila selesaikan perkara yang ditandakan sebelum meneruskan.';
  }
  
  return {
    band,
    label,
    guidance,
    // Internal score and breakdown for system use only - NEVER expose to UI
    _internalScore: score,
    _breakdown: breakdown,
  };
}

/**
 * PRD Section 16.5: Auto-Invalidation Rules
 * Readiness signal expires when certain conditions change
 */
export function shouldInvalidateReadiness(
  previousInputs: Partial<ReadinessInputs>,
  currentInputs: Partial<ReadinessInputs>
): boolean {
  const invalidationFields: (keyof ReadinessInputs)[] = [
    'incomeRange',
    'commitmentRange',
    'existingLoan',
    'propertyPrice',
  ];
  
  return invalidationFields.some(
    field => previousInputs[field] !== currentInputs[field]
  );
}

/**
 * Get readiness band configuration for UI
 */
export function getReadinessBandConfig(band: ReadinessBand): {
  icon: 'check' | 'alert' | 'x';
  bgColor: string;
  bgLight: string;
  borderColor: string;
  textColor: string;
} {
  const configs: Record<ReadinessBand, ReturnType<typeof getReadinessBandConfig>> = {
    ready: {
      icon: 'check',
      bgColor: 'bg-green-500',
      bgLight: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
    },
    caution: {
      icon: 'alert',
      bgColor: 'bg-yellow-500',
      bgLight: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
    },
    not_ready: {
      icon: 'x',
      bgColor: 'bg-red-500',
      bgLight: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
    },
  };
  return configs[band];
}

/**
 * Get component-level feedback for guidance (without exposing scores)
 * This provides actionable feedback based on which components are weak
 */
export function getComponentFeedback(inputs: ReadinessInputs): string[] {
  const feedback: string[] = [];

  // Rule Coverage feedback
  if (inputs.employmentType === 'kontrak') {
    feedback.push('Lantikan kontrak mungkin memerlukan dokumen tambahan.');
  }
  if (inputs.serviceYears === '0-2') {
    feedback.push('Tempoh perkhidmatan kurang dari 3 tahun - pertimbangkan untuk menunggu.');
  }
  if (inputs.ageRange === '56+') {
    feedback.push('Tempoh pinjaman mungkin lebih pendek disebabkan umur persaraan.');
  }

  // Income Pattern feedback
  if (['2000-3000', '3001-4000'].includes(inputs.incomeRange)) {
    feedback.push('Julat pendapatan mungkin mengehadkan jumlah pinjaman.');
  }

  // Commitment feedback
  if (['41-50', '51+'].includes(inputs.commitmentRange)) {
    feedback.push('Komitmen sedia ada agak tinggi - pertimbangkan untuk mengurangkan.');
  }

  // Property Context feedback
  if (inputs.existingLoan === 'yes') {
    feedback.push('Pinjaman LPPSA sedia ada akan diambil kira dalam penilaian.');
  }

  return feedback;
}

// =============================================================================
// P3-5: DETERMINISM GUARANTEES
// =============================================================================

/**
 * Generate a deterministic hash of inputs for verification
 * This allows checking that the same inputs always produce the same result
 */
export function hashInputs(inputs: ReadinessInputs): string {
  const normalized = {
    employmentType: inputs.employmentType || '',
    employmentScheme: inputs.employmentScheme || '',
    incomeRange: inputs.incomeRange || '',
    serviceYears: inputs.serviceYears || '',
    existingLoan: inputs.existingLoan || '',
    ageRange: inputs.ageRange || '',
    commitmentRange: inputs.commitmentRange || '',
    hasUpload: Boolean(inputs.hasUpload),
    propertyPrice: inputs.propertyPrice || 0,
  };

  // Simple deterministic hash (for verification, not security)
  const str = JSON.stringify(normalized, Object.keys(normalized).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `inp_${Math.abs(hash).toString(36)}`;
}

/**
 * Calculate readiness with verification metadata
 * Returns the result along with input hash for determinism verification
 */
export function calculateReadinessWithVerification(inputs: ReadinessInputs): {
  result: ReadinessResult;
  inputHash: string;
  version: string;
  calculatedAt: string;
} {
  const result = calculateReadiness(inputs);
  const inputHash = hashInputs(inputs);

  return {
    result,
    inputHash,
    version: 'v3.6.1', // PRD version
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Verify that calculation is deterministic
 * Runs the same calculation multiple times and confirms identical results
 */
export function verifyDeterminism(inputs: ReadinessInputs, iterations: number = 10): {
  isDeterministic: boolean;
  iterations: number;
  band: ReadinessBand;
  score: number;
} {
  const results: number[] = [];
  const bands: ReadinessBand[] = [];

  for (let i = 0; i < iterations; i++) {
    const result = calculateReadiness(inputs);
    results.push(result._internalScore!);
    bands.push(result.band);
  }

  // Check all results are identical
  const allScoresEqual = results.every(s => s === results[0]);
  const allBandsEqual = bands.every(b => b === bands[0]);

  return {
    isDeterministic: allScoresEqual && allBandsEqual,
    iterations,
    band: bands[0],
    score: results[0],
  };
}

/**
 * Known test vectors for regression testing
 * These ensure the algorithm hasn't changed unexpectedly
 */
export const TEST_VECTORS = [
  {
    name: 'Optimal Candidate',
    inputs: {
      employmentType: 'tetap' as const,
      employmentScheme: 'persekutuan',
      incomeRange: '8001+',
      serviceYears: '5+',
      existingLoan: 'no' as const,
      ageRange: '35-49',
      commitmentRange: '0-30',
      hasUpload: false,
      propertyPrice: 400000,
    },
    expectedBand: 'ready' as ReadinessBand,
    expectedScoreRange: [90, 100],
  },
  {
    name: 'Mid-Range Candidate',
    inputs: {
      employmentType: 'tetap' as const,
      employmentScheme: 'persekutuan',
      incomeRange: '4001-5000',
      serviceYears: '3-4',
      existingLoan: 'no' as const,
      ageRange: '35-49',
      commitmentRange: '31-40',
      hasUpload: false,
      propertyPrice: 450000,
    },
    expectedBand: 'caution' as ReadinessBand,
    expectedScoreRange: [55, 75],
  },
  {
    name: 'Risk Candidate',
    inputs: {
      employmentType: 'kontrak' as const,
      employmentScheme: 'swasta',
      incomeRange: '2000-3000',
      serviceYears: '0-2',
      existingLoan: 'yes' as const,
      ageRange: '56+',
      commitmentRange: '51+',
      hasUpload: false,
      propertyPrice: 600000,
    },
    expectedBand: 'not_ready' as ReadinessBand,
    expectedScoreRange: [0, 40],
  },
] as const;

/**
 * Run test vectors to verify algorithm integrity
 */
export function runTestVectors(): {
  passed: boolean;
  results: Array<{
    name: string;
    passed: boolean;
    expectedBand: ReadinessBand;
    actualBand: ReadinessBand;
    score: number;
  }>;
} {
  const results = TEST_VECTORS.map(vector => {
    const result = calculateReadiness(vector.inputs);
    const score = result._internalScore!;
    const bandMatch = result.band === vector.expectedBand;
    const scoreInRange = score >= vector.expectedScoreRange[0] && score <= vector.expectedScoreRange[1];

    return {
      name: vector.name,
      passed: bandMatch && scoreInRange,
      expectedBand: vector.expectedBand,
      actualBand: result.band,
      score,
    };
  });

  return {
    passed: results.every(r => r.passed),
    results,
  };
}
