/* eslint-disable no-console */
/**
 * i18n Coverage & Compliance Check Script
 *
 * Run: npm run i18n:check
 *
 * This script:
 * 1. Checks key parity between BM and EN translations
 * 2. Scans translation VALUES only (not keys) for banned words
 * 3. Exits with error code if issues found (CI-friendly)
 */

import { translations } from '../lib/i18n/translations';

type AnyObj = Record<string, unknown>;

// Flatten nested object keys
function flattenKeys(obj: AnyObj, prefix = ''): string[] {
  const keys: string[] = [];
  for (const k of Object.keys(obj || {})) {
    const val = obj[k];
    const next = prefix ? `${prefix}.${k}` : k;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      keys.push(...flattenKeys(val as AnyObj, next));
    } else {
      keys.push(next);
    }
  }
  return keys;
}

// Flatten nested object values (strings only)
function flattenValues(obj: AnyObj): string[] {
  const values: string[] = [];
  for (const k of Object.keys(obj || {})) {
    const val = obj[k];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      values.push(...flattenValues(val as AnyObj));
    } else if (typeof val === 'string') {
      values.push(val);
    }
  }
  return values;
}

// Find keys in A that are not in B
function diff(a: string[], b: string[]): string[] {
  const setB = new Set(b);
  return a.filter((x) => !setB.has(x));
}

// Scan translation VALUES for banned words
function scanBannedValues(lang: 'bm' | 'en', values: string[]): string[] {
  const joined = values.join(' \n ').toLowerCase();
  const violations: string[] = [];

  // Banned word patterns (word boundaries to avoid false positives)
  const bannedBM = ['lulus', 'kelulusan', 'layak', 'ditolak'];
  const bannedEN = ['approved', 'approval', 'eligible', 'rejected', 'guarantee', 'guaranteed', 'approve', 'reject'];

  const bannedList = lang === 'bm' ? bannedBM : bannedEN;

  for (const word of bannedList) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(joined)) {
      violations.push(word);
    }
  }

  return violations;
}

function main() {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log('║     i18n Coverage & Compliance Check   ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');

  // Validate translations structure
  if (!translations?.bm || !translations?.en) {
    console.error('❌ translations.ts must export { translations: { bm: {...}, en: {...} } }');
    process.exit(1);
  }

  let hasErrors = false;

  // === 1. Key Parity Check ===
  console.log('📋 KEY PARITY CHECK');
  console.log('-------------------');

  const bmKeys = flattenKeys(translations.bm as AnyObj).sort();
  const enKeys = flattenKeys(translations.en as AnyObj).sort();
  const missingInEN = diff(bmKeys, enKeys);
  const missingInBM = diff(enKeys, bmKeys);

  console.log(`   BM keys: ${bmKeys.length}`);
  console.log(`   EN keys: ${enKeys.length}`);

  if (missingInEN.length) {
    console.log('');
    console.log('   ❌ Missing in EN:');
    missingInEN.forEach((k) => console.log(`      - ${k}`));
    hasErrors = true;
  }

  if (missingInBM.length) {
    console.log('');
    console.log('   ❌ Missing in BM:');
    missingInBM.forEach((k) => console.log(`      - ${k}`));
    hasErrors = true;
  }

  if (!missingInEN.length && !missingInBM.length) {
    console.log('   ✅ All keys match between BM and EN');
  }

  // === 2. Banned Words Check (VALUES ONLY) ===
  console.log('');
  console.log('🚫 BANNED WORDS CHECK (values only)');
  console.log('------------------------------------');

  const bmValues = flattenValues(translations.bm as AnyObj);
  const enValues = flattenValues(translations.en as AnyObj);

  const bmViolations = scanBannedValues('bm', bmValues);
  const enViolations = scanBannedValues('en', enValues);

  if (bmViolations.length) {
    console.log(`   ❌ BM contains banned words: ${bmViolations.join(', ')}`);
    hasErrors = true;
  } else {
    console.log('   ✅ BM values pass (no: lulus, kelulusan, layak, ditolak)');
  }

  if (enViolations.length) {
    console.log(`   ❌ EN contains banned words: ${enViolations.join(', ')}`);
    hasErrors = true;
  } else {
    console.log('   ✅ EN values pass (no: approved, approval, eligible, rejected, guarantee)');
  }

  // === Summary ===
  console.log('');
  console.log('════════════════════════════════════════');

  if (hasErrors) {
    console.log('❌ FAILED - Fix issues above before deployment');
    process.exit(1);
  } else {
    console.log('✅ PASSED - All translations compliant');
    process.exit(0);
  }
}

main();
