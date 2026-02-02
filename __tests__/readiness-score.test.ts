// __tests__/readiness-score.test.ts
// Unit tests for PRD Appendix A scoring formula
// P3-5: Includes determinism verification tests
// Run with: npx vitest run __tests__/readiness-score.test.ts

import { describe, it, expect } from 'vitest';
import {
  calculateReadiness,
  ReadinessInputs,
  verifyDeterminism,
  runTestVectors,
  hashInputs,
  calculateReadinessWithVerification,
} from '../lib/kuasaturbo/readiness-score';

describe('Readiness Scoring - PRD Appendix A Compliance', () => {
  // Base inputs for testing
  const baseInputs: ReadinessInputs = {
    employmentType: 'tetap',
    employmentScheme: 'persekutuan',
    incomeRange: '4001-5000',
    serviceYears: '5+',
    existingLoan: 'no',
    ageRange: '35-49',
    commitmentRange: '0-30',
    hasUpload: false,
    propertyPrice: 450000,
  };

  describe('Component A: Rule Coverage (0-30 pts)', () => {
    it('should give max 30 pts for tetap + 5+ years + optimal age', () => {
      const result = calculateReadiness(baseInputs);
      // Employment: 20, Service: 10, Age: 0 adjustment = 30
      expect(result._breakdown?.componentA).toBe(30);
    });

    it('should give 18 pts for kontrak + 5+ years', () => {
      const result = calculateReadiness({ ...baseInputs, employmentType: 'kontrak' });
      // Employment: 8, Service: 10, Age: 0 = 18
      expect(result._breakdown?.componentA).toBe(18);
    });

    it('should apply age penalty for 56+', () => {
      const result = calculateReadiness({ ...baseInputs, ageRange: '56+' });
      // 20 + 10 - 5 = 25
      expect(result._breakdown?.componentA).toBe(25);
    });

    it('should apply smaller penalty for 50-55', () => {
      const result = calculateReadiness({ ...baseInputs, ageRange: '50-55' });
      // 20 + 10 - 2 = 28
      expect(result._breakdown?.componentA).toBe(28);
    });

    it('should give lower score for short service', () => {
      const result = calculateReadiness({ ...baseInputs, serviceYears: '0-2' });
      // 20 + 2 + 0 = 22
      expect(result._breakdown?.componentA).toBe(22);
    });
  });

  describe('Component B: Income Pattern (0-25 pts)', () => {
    it('should give max 25 pts for high income + tetap', () => {
      const result = calculateReadiness({ ...baseInputs, incomeRange: '8001+' });
      // Base: 18 + Consistency: 7 = 25
      expect(result._breakdown?.componentB).toBe(25);
    });

    it('should give lower score for kontrak (less consistency)', () => {
      const result = calculateReadiness({ 
        ...baseInputs, 
        incomeRange: '8001+',
        employmentType: 'kontrak' 
      });
      // Base: 18 + Consistency: 3 = 21
      expect(result._breakdown?.componentB).toBe(21);
    });

    it('should give appropriate score for mid-range income', () => {
      const result = calculateReadiness({ ...baseInputs, incomeRange: '4001-5000' });
      // Base: 9 + Consistency: 7 = 16
      expect(result._breakdown?.componentB).toBe(16);
    });
  });

  describe('Component C: Commitment Signal (0-25 pts)', () => {
    it('should give max 25 pts for low commitment (0-30%)', () => {
      const result = calculateReadiness({ ...baseInputs, commitmentRange: '0-30' });
      expect(result._breakdown?.componentC).toBe(25);
    });

    it('should give 18 pts for moderate commitment (31-40%)', () => {
      const result = calculateReadiness({ ...baseInputs, commitmentRange: '31-40' });
      expect(result._breakdown?.componentC).toBe(18);
    });

    it('should give 10 pts for high commitment (41-50%)', () => {
      const result = calculateReadiness({ ...baseInputs, commitmentRange: '41-50' });
      expect(result._breakdown?.componentC).toBe(10);
    });

    it('should give 4 pts for very high commitment (51+%)', () => {
      const result = calculateReadiness({ ...baseInputs, commitmentRange: '51+' });
      expect(result._breakdown?.componentC).toBe(4);
    });
  });

  describe('Component D: Property Context (0-20 pts)', () => {
    it('should give high score for affordable property', () => {
      // Income ~4500/month = 54000/year, Property 200000 = 3.7x multiple
      const result = calculateReadiness({ ...baseInputs, propertyPrice: 200000 });
      expect(result._breakdown?.componentD).toBe(20);
    });

    it('should apply -8 penalty for existing LPPSA loan', () => {
      const withoutLoan = calculateReadiness({ ...baseInputs, existingLoan: 'no' });
      const withLoan = calculateReadiness({ ...baseInputs, existingLoan: 'yes' });
      
      const difference = withoutLoan._breakdown!.componentD - withLoan._breakdown!.componentD;
      expect(difference).toBe(8);
    });
  });

  describe('Band Classification (PRD Section 16.2)', () => {
    it('should classify ≥70 as READY', () => {
      // Optimal inputs should score ≥70
      const result = calculateReadiness(baseInputs);
      expect(result.band).toBe('ready');
      expect(result.label).toBe('READY TO CONTINUE');
    });

    it('should classify 50-69 as CAUTION', () => {
      // Kontrak + lower income + higher commitment
      const result = calculateReadiness({
        ...baseInputs,
        employmentType: 'kontrak',
        incomeRange: '3001-4000',
        commitmentRange: '31-40',
        serviceYears: '3-4',
      });
      expect(result.band).toBe('caution');
      expect(result.label).toBe('CONTINUE WITH CAUTION');
    });

    it('should classify <50 as NOT_READY', () => {
      // Worst case scenario
      const result = calculateReadiness({
        ...baseInputs,
        employmentType: 'kontrak',
        incomeRange: '2000-3000',
        commitmentRange: '51+',
        serviceYears: '0-2',
        ageRange: '56+',
        existingLoan: 'yes',
        propertyPrice: 800000,
      });
      expect(result.band).toBe('not_ready');
      expect(result.label).toBe('NOT READY TO PROCEED');
    });
  });

  describe('Score never exposed to UI', () => {
    it('should have _internalScore as internal only', () => {
      const result = calculateReadiness(baseInputs);
      // Internal score exists for system use
      expect(result._internalScore).toBeDefined();
      expect(typeof result._internalScore).toBe('number');

      // But UI should only use band/label/guidance
      expect(result.band).toBeDefined();
      expect(result.label).toBeDefined();
      expect(result.guidance).toBeDefined();
    });
  });

  // P3-5: Determinism Tests
  describe('P3-5: Determinism Guarantees', () => {
    it('should produce identical results for same inputs (100 iterations)', () => {
      const verification = verifyDeterminism(baseInputs, 100);
      expect(verification.isDeterministic).toBe(true);
      expect(verification.iterations).toBe(100);
    });

    it('should produce identical hash for same inputs', () => {
      const hash1 = hashInputs(baseInputs);
      const hash2 = hashInputs(baseInputs);
      const hash3 = hashInputs({ ...baseInputs }); // Spread copy

      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
    });

    it('should produce different hash for different inputs', () => {
      const hash1 = hashInputs(baseInputs);
      const hash2 = hashInputs({ ...baseInputs, incomeRange: '8001+' });

      expect(hash1).not.toBe(hash2);
    });

    it('should pass all test vectors (regression check)', () => {
      const vectorResults = runTestVectors();
      expect(vectorResults.passed).toBe(true);

      // Log any failures for debugging
      vectorResults.results.forEach(r => {
        if (!r.passed) {
          console.error(`Test vector failed: ${r.name}`);
          console.error(`  Expected: ${r.expectedBand}, Got: ${r.actualBand}, Score: ${r.score}`);
        }
      });
    });

    it('should include verification metadata', () => {
      const withVerification = calculateReadinessWithVerification(baseInputs);

      expect(withVerification.result).toBeDefined();
      expect(withVerification.inputHash).toMatch(/^inp_/);
      expect(withVerification.version).toBe('v3.6.1');
      expect(withVerification.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should be order-independent for input fields', () => {
      // Create inputs in different orders
      const inputs1: ReadinessInputs = {
        employmentType: 'tetap',
        employmentScheme: 'persekutuan',
        incomeRange: '4001-5000',
        serviceYears: '5+',
        existingLoan: 'no',
        ageRange: '35-49',
        commitmentRange: '0-30',
        hasUpload: false,
        propertyPrice: 450000,
      };

      const inputs2: ReadinessInputs = {
        propertyPrice: 450000,
        hasUpload: false,
        commitmentRange: '0-30',
        ageRange: '35-49',
        existingLoan: 'no',
        serviceYears: '5+',
        incomeRange: '4001-5000',
        employmentScheme: 'persekutuan',
        employmentType: 'tetap',
      };

      const result1 = calculateReadiness(inputs1);
      const result2 = calculateReadiness(inputs2);

      expect(result1._internalScore).toBe(result2._internalScore);
      expect(result1.band).toBe(result2.band);
    });
  });
});
