# REF: LPPSA Notis Makluman — Surat Pengesahan Ketua Jabatan

**Tag:** `authoritative-reference`
**Source:** Official LPPSA Notis Makluman, dated 30 September 2025
**Archived:** 2026-03-04 (CR-KP-002 Sprint 1, A7)

## Summary

Effective **1 Oktober 2025**, LPPSA replaced the "Surat Iringan Ketua Jabatan" with a new format: **"Surat Pengesahan Ketua Jabatan"**.

### Key Facts

| Item | Detail |
|------|--------|
| Old document name | Surat Iringan KJ |
| New document name | Surat Pengesahan Ketua Jabatan |
| Effective date | 1 Oktober 2025 |
| Transition period end | 31 Oktober 2025 |
| Post-transition handling | Applications using old format will be "dikuiri" (queried) by LPPSA |
| New format download | Available from myfinancing.lppsa.gov.my |

### Impact on Snang.my

- System key: `SURAT_PENGESAHAN_KJ` (canonical, used in all 7 Jenis types)
- DOC_003 in `lib/config/document-checklist.ts` carries the official label and formatNote
- The old name "Surat Iringan" appears only in historical/explanatory notes
- `loan-types.ts` comments reference this document as the authoritative source

### Cross-References

- `lib/config/document-checklist.ts` → DOC_003
- `lib/config/loan-types.ts` → all 7 Jenis `requiredDocs` arrays
- `docs/DECISIONS-LOG.md` → DEC-002
- Original PDF uploaded by project owner during CR-KP-002 Sprint 1 verification
