-- PDPA Privacy Notice v1.1 Update
-- Run ONLY after lawyer has reviewed and approved the notice text
-- This updates the privacy_notice_versions table (from migration 007)

-- Step 1: Insert v1.1 notice
INSERT INTO pdpa_notice_versions (
  version,
  content_bm,
  content_en,
  effective_from
) VALUES (
  '1.1',
  -- BM TEXT (paste final lawyer-approved BM text here)
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

  -- EN TEXT (paste final lawyer-approved EN text here)
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

  -- Set effective date to when you deploy
  NOW()
) ON CONFLICT (version) DO UPDATE SET
  content_bm = EXCLUDED.content_bm,
  content_en = EXCLUDED.content_en,
  effective_from = EXCLUDED.effective_from;

-- Step 2: Verify
SELECT version, LENGTH(content_bm) as bm_chars, LENGTH(content_en) as en_chars, effective_from
FROM pdpa_notice_versions
ORDER BY effective_from DESC;
