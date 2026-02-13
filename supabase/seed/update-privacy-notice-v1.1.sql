-- ============================================================================
-- PDPA Privacy Notice v1.1 Update (CORRECTED)
-- ============================================================================
-- Fixes 3 issues from original SQL identified in Session 4 (12 Feb 2026):
--   1. Missing superseded_at update on v1.0
--   2. Missing summary_bm / summary_en (powers PDPAConsentGate checkbox)
--   3. Missing change_reason / approved_by (PDPA audit trail)
--
-- PREREQUISITES:
--   - Migration 007 (pdpa_notice_versions table) already applied
--   - v1.0 notice exists in database
--   - Lawyer has reviewed and approved PDPA-PRIVACY-NOTICE-LEGAL-REVIEW-v1.1.docx
--
-- BEFORE RUNNING:
--   1. Replace [NO. SYARIKAT] with SSM registration number
--   2. Replace [ALAMAT] / [ADDRESS] with registered office address
--   3. Replace [TELEFON] / [PHONE] with company phone number
--   4. Replace [TARIKH] / [DATE] with effective date (post lawyer approval)
--
-- RUN ORDER (in Supabase SQL Editor):
--   1. seed-demo-data.sql          (if not already run)
--   2. seed-whatsapp-template.sql  (if not already run)
--   3. THIS FILE                   (only after lawyer sign-off)
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Supersede v1.0
-- ============================================================================
-- Without this, getCurrentNoticeVersion() query:
--   .is('superseded_at', null).order('effective_from', { ascending: false })
-- would match BOTH v1.0 and v1.1, returning whichever has later effective_from.
-- Setting superseded_at on v1.0 ensures only v1.1 matches the IS NULL filter.

UPDATE pdpa_notice_versions
SET superseded_at = NOW()
WHERE version = '1.0'
  AND superseded_at IS NULL;

-- ============================================================================
-- STEP 2: Insert v1.1 with all required fields
-- ============================================================================

INSERT INTO pdpa_notice_versions (
  version,
  content_bm,
  content_en,
  summary_bm,
  summary_en,
  effective_from,
  change_reason,
  approved_by
) VALUES (
  '1.1',

  -- ── BM FULL TEXT ──────────────────────────────────────────────────────────
  'NOTIS PRIVASI

SME Cloud Sdn Bhd ([NO. SYARIKAT])
beroperasi sebagai Snang.my

Notis privasi ini dikeluarkan menurut Seksyen 7 Akta Perlindungan Data Peribadi 2010 (Akta 709), sebagaimana dipinda oleh Akta Perlindungan Data Peribadi (Pindaan) 2024 (Akta A1699).

DATA PERIBADI YANG DIKUMPUL:
- Nombor Kad Pengenalan (IC)
- Nama penuh
- Nombor telefon dan alamat emel
- Maklumat gaji dan pendapatan (slip gaji 3 bulan, gred jawatan, maklumat majikan)
- Penyata bank
- Penyata KWSP/EPF
- Maklumat hartanah (nama projek, jenis unit, harga belian)
- Maklumat pekerjaan (nama majikan, gred jawatan, surat pengesahan jawatan)
- Alamat IP dan maklumat peranti

TUJUAN PEMPROSESAN:
1. Pemprosesan Data Asas: Penilaian kelayakan pinjaman LPPSA, pengiraan DSR, semakan kesediaan dokumen
2. Pendedahan Kepada Pihak Ketiga: Perkongsian maklumat kes dengan ejen hartanah bertauliah
3. Penyediaan Permohonan LPPSA: Penyediaan draf dokumen permohonan LPPSA (ejen submit, BUKAN sistem)
4. Analitik Agregat: Statistik agregat tanpa maklumat peribadi untuk kegunaan pemaju
5. Komunikasi Pemasaran: Tawaran hartanah, promosi, kemas kini platform (PILIHAN)

PENDEDAHAN KEPADA PIHAK KETIGA:
- Ejen Hartanah Bertauliah
- Pemaju Hartanah (data agregat sahaja)
- LPPSA (dengan persetujuan anda)
- Pembekal Teknologi (Vercel, Supabase)
- Pihak Berkuasa (jika dikehendaki undang-undang)

HAK ANDA:
- Hak Akses (Seksyen 12) - dalam tempoh 21 hari
- Hak Pembetulan (Seksyen 34)
- Hak Penarikan Balik Persetujuan (Seksyen 38)
- Hak Mudah Alih Data (Seksyen 43A)
- Hak Mengelak Pemasaran Langsung (Seksyen 43)

TEMPOH PENYIMPANAN:
- Data kes aktif: tempoh pemprosesan + 6 bulan
- Log audit: minimum 7 tahun
- Data agregat: tanpa had masa
- Kes dibatalkan: 12 bulan selepas pembatalan

HUBUNGI: privacy@smecloud.my | [ALAMAT] | [TELEFON]
Versi: 1.1 | Tarikh Berkuat Kuasa: [TARIKH]',

  -- ── EN FULL TEXT ──────────────────────────────────────────────────────────
  'PRIVACY NOTICE

SME Cloud Sdn Bhd ([COMPANY NO.])
operating as Snang.my

This privacy notice is issued pursuant to Section 7 of the Personal Data Protection Act 2010 (Act 709), as amended by the Personal Data Protection (Amendment) Act 2024 (Act A1699).

PERSONAL DATA COLLECTED:
- Identity Card (IC) number
- Full name
- Phone number and email address
- Salary and income information (payslips 3 months, job grade, employer info)
- Bank statements
- EPF/KWSP statements
- Property information (project name, unit type, purchase price)
- Employment information (employer name, job grade, confirmation letter)
- IP address and device information

PURPOSES OF PROCESSING:
1. Basic Data Processing: LPPSA loan eligibility assessment, DSR calculation, document readiness checking
2. Third Party Disclosure: Sharing case information with licensed property agents
3. LPPSA Submission Preparation: Preparing draft LPPSA application documents (agent submits, NOT system)
4. Aggregate Analytics: Aggregate statistics without personal information for developer use
5. Marketing Communications: Property offers, promotions, platform updates (OPTIONAL)

DISCLOSURE TO THIRD PARTIES:
- Licensed Property Agents
- Property Developers (aggregate data only)
- LPPSA (with your consent)
- Technology Providers (Vercel, Supabase)
- Authorities (if required by law)

YOUR RIGHTS:
- Right of Access (Section 12) - within 21 days
- Right of Correction (Section 34)
- Right to Withdraw Consent (Section 38)
- Right to Data Portability (Section 43A)
- Right to Prevent Direct Marketing (Section 43)

DATA RETENTION:
- Active case data: processing duration + 6 months
- Audit logs: minimum 7 years
- Aggregate data: no time limit
- Cancelled cases: 12 months after cancellation

CONTACT: privacy@smecloud.my | [ADDRESS] | [PHONE]
Version: 1.1 | Effective Date: [DATE]',

  -- ── SUMMARY BM (one-line checkbox label in PDPAConsentGate.tsx) ──────────
  'Saya bersetuju data peribadi saya diproses untuk penilaian kelayakan LPPSA dan dikongsi dengan ejen hartanah bertauliah mengikut Notis Privasi v1.1.',

  -- ── SUMMARY EN (one-line checkbox label in PDPAConsentGate.tsx) ──────────
  'I agree to my personal data being processed for LPPSA eligibility assessment and shared with licensed property agents per Privacy Notice v1.1.',

  -- ── EFFECTIVE DATE ──────────────────────────────────────────────────────
  NOW(),

  -- ── CHANGE REASON (audit trail: why v1.0 → v1.1) ───────────────────────
  'Expanded to full Section 7(1)(a)-(g) compliance: added third-party disclosure classes, cross-border transfer notice (Vercel/Supabase), data retention periods, mandatory/voluntary classification, data portability right (2024 Amendment Act A1699). v1.0 was insufficient per gap analysis.',

  -- ── APPROVED BY (placeholder until lawyer signs off) ────────────────────
  'pending_legal_review'
);

COMMIT;

-- ============================================================================
-- STEP 3: Verify the update
-- ============================================================================
-- Expected result:
--   v1.1: superseded_at = NULL (active)
--   v1.0: superseded_at = [timestamp] (retired)
--   summary_bm and summary_en populated for v1.1

SELECT
  version,
  CASE WHEN superseded_at IS NULL THEN '✅ ACTIVE' ELSE '⏹ RETIRED' END AS status,
  LENGTH(content_bm) AS bm_chars,
  LENGTH(content_en) AS en_chars,
  LEFT(summary_bm, 50) AS summary_bm_preview,
  LEFT(summary_en, 50) AS summary_en_preview,
  change_reason IS NOT NULL AS has_change_reason,
  approved_by,
  effective_from,
  superseded_at
FROM pdpa_notice_versions
ORDER BY effective_from DESC;

-- ============================================================================
-- STEP 4: Verify consent chain will work
-- ============================================================================
-- This simulates what consent-service.getCurrentNoticeVersion() does:
--   .from('pdpa_notice_versions')
--   .select('*')
--   .is('superseded_at', null)
--   .order('effective_from', { ascending: false })
--   .limit(1)
--
-- Expected: Returns exactly 1 row → v1.1

SELECT version, summary_bm, summary_en
FROM pdpa_notice_versions
WHERE superseded_at IS NULL
ORDER BY effective_from DESC
LIMIT 1;

-- ============================================================================
-- POST-RUN CHECKLIST:
-- ============================================================================
-- [ ] Step 3 shows v1.1 ACTIVE, v1.0 RETIRED
-- [ ] Step 4 returns exactly 1 row (v1.1)
-- [ ] summary_bm and summary_en are populated (not NULL)
-- [ ] Replace 'pending_legal_review' in approved_by with lawyer name:
--     UPDATE pdpa_notice_versions
--     SET approved_by = 'Nama Peguam / Firma'
--     WHERE version = '1.1';
-- ============================================================================
