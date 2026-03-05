# TECH-DEBT-001: Propagate A7 Document Key Renames to Pre-Sprint-1 Files

**Created:** 2026-03-04
**Sprint:** Post CR-KP-002 Sprint 1 (production wiring phase)
**Priority:** Low (demo data, not type-checked)
**Effort:** ~15 min

## Background

CR-KP-002 Sprint 1 A7 corrected document keys in the canonical config files (`document-checklist.ts`, `loan-types.ts`). However, pre-Sprint-1 files that use string-matched demo data still reference the old keys. These are not build-breaking (string literals in demo/mock data) but should be aligned for consistency.

## Key Renames

| Old Key | New Key | Reason |
|---------|---------|--------|
| `SLIP_GAJI` | `SLIP_GAJI_ASAL` | A7: Corrected to match official label "Slip Gaji Asal Terkini / E-Slip" |

Note: `SURAT_IRINGAN_KJ` was already fully migrated to `SURAT_PENGESAHAN_KJ` during A7. No orphaned references remain (the only occurrence is in a historical note in `document-checklist.ts:128`).

## Files Requiring Update

### 1. `lib/store/case-store.ts`
- Lines 61, 109, 161, 217, 271: 5 demo case entries use `'SLIP_GAJI'`
- Action: Replace with `'SLIP_GAJI_ASAL'`

### 2. `__tests__/permissions.test.ts`
- Line 43: Test fixture uses `'SLIP_GAJI'`
- Action: Replace with `'SLIP_GAJI_ASAL'`

### 3. `lib/kuasaturbo/file-validation.ts`
- Line 170: Validation config uses `'SLIP_GAJI'` as key
- Action: Replace with `'SLIP_GAJI_ASAL'`

### 4. `lib/services/telemetry-service.ts`
- Line 37: Comment example references `'SLIP_GAJI'`
- Action: Update comment to `'SLIP_GAJI_ASAL'`

## Risk Assessment

**Low risk.** All occurrences are in demo data or string literals, not type-checked against `DocumentChecklistItem.id`. No runtime breakage possible — this is purely a consistency cleanup.

## Acceptance Criteria

- [ ] All 4 files updated with `SLIP_GAJI_ASAL`
- [ ] `npx tsc --noEmit` passes (already should, since strings aren't type-checked)
- [ ] No other orphaned keys found via `grep -r "SLIP_GAJI'" --include='*.ts' --include='*.tsx'`
