# Seed Execution Guide — Sprint S6.1
## Run Order: B1 → B2 → B3

---

## Prerequisites

- Browser access to your Supabase project dashboard
- Supabase project URL: check your `.env.local` for `NEXT_PUBLIC_SUPABASE_URL`
- Service role key available (for RLS bypass if needed)
- The 3 seed files from your local codebase:
  - `supabase/seed/seed-demo-data.sql` (B1)
  - `supabase/seed/seed-whatsapp-template.sql` (B2)
  - `supabase/seed/update-privacy-notice-v1.1.sql` (B3 — use the **corrected** version)

---

## Step 1: Open Supabase SQL Editor

1. Go to **https://supabase.com/dashboard**
2. Select your Qontrek project
3. In the left sidebar, click **SQL Editor** (the terminal icon)
4. You'll see a blank query window — this is where you'll paste and run each file

---

## Step 2: Run B1 — seed-demo-data.sql

**What it does:** Inserts the Nur Adilah test case (QTK-2026-DEMO1) into `mortgage_cases` with a deliberate gred mismatch for cross-validation demo. Also seeds consent records (2 rows), case documents (4 rows), and proof events (9 rows). The referenced developer (Seven Sky Development) and property (Residensi Harmoni) must already exist from migration 002; agents from migration 003.

**How:**
1. Open `supabase/seed/seed-demo-data.sql` from your local codebase in any text editor
2. Copy the entire file contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or Cmd+Enter / Ctrl+Enter)
5. Verify: you should see success messages with row counts

**Verification query** (paste and run after the seed):
```sql
-- Should return 1 row with case_ref = 'QTK-2026-DEMO1'
SELECT id, case_ref, status, buyer_name, property_price
FROM mortgage_cases
WHERE case_ref LIKE 'QTK-2026%'
ORDER BY created_at DESC;
```

**If it fails:**
- If you run it again, it silently skips (the seed uses `ON CONFLICT (case_ref) DO NOTHING`).
- `relation does not exist` → migrations 001–010 haven't all been applied. The seed depends on tables from migrations 002 (properties, developers) and 003 (agents).
- `foreign key violation` → the referenced developer/property/agent IDs from migrations 002–003 don't exist. Ensure all migrations are applied before running seeds.

---

## Step 3: Run B2 — seed-whatsapp-template.sql

**What it does:** Inserts the `agent_case_alert` WhatsApp template into `whatsapp_templates`. This powers the "Kes baru diterima" notification sent to agents when a buyer submits.

**How:**
1. Open `supabase/seed/seed-whatsapp-template.sql` from your local codebase
2. Copy entire contents
3. Paste into Supabase SQL Editor (clear the previous query first, or open a new tab with the **+** button)
4. Click **Run**

**Verification query:**
```sql
-- Should return 1 row with code = 'agent_case_alert'
SELECT code, name, category, is_active, created_at
FROM whatsapp_templates
WHERE code = 'agent_case_alert';
```

**If it fails:**
- `relation "whatsapp_templates" does not exist` → the table is created in migration 003_agent_contacts.sql. Ensure all migrations are applied.
- If you run it again, it upserts the existing record (the seed uses `ON CONFLICT (code) DO UPDATE`). No error, just overwrites.

---

## Step 4: Run B3 — update-privacy-notice-v1.1.sql (CORRECTED version)

> **IMPORTANT:** Use the **corrected** version, not the original upload. The corrected version has the `BEGIN/COMMIT` transaction wrapper, the `superseded_at` update on v1.0, and the `summary_bm`/`summary_en` fields populated.

**What it does:**
1. Retires v1.0 by setting `superseded_at = NOW()`
2. Inserts v1.1 with full bilingual content, checkbox summaries, and audit metadata
3. Verifies the consent chain will work

**Before running — fill in 4 placeholders:**

Open the SQL file and find-replace these placeholders with actual SME Cloud details:

| Placeholder | Replace with | Example |
|-------------|--------------|---------|
| `[NO. SYARIKAT]` | SSM registration number | `202301012345 (1234567-X)` |
| `[ALAMAT]` | Registered office address | `No. 12, Jalan SS15/4, 47500 Subang Jaya, Selangor` |
| `[TELEFON]` | Company phone | `+603-5678 1234` |
| `[TARIKH]` | Effective date | `14 Mac 2026` |
| `[COMPANY NO.]` | Same as NO. SYARIKAT (EN version) | `202301012345 (1234567-X)` |
| `[ADDRESS]` | Same as ALAMAT (EN version) | `No. 12, Jalan SS15/4, 47500 Subang Jaya, Selangor` |
| `[PHONE]` | Same as TELEFON (EN version) | `+603-5678 1234` |
| `[DATE]` | Same as TARIKH (EN version) | `14 March 2026` |

> **Note:** If the lawyer hasn't signed off yet, you can still run B3 now for testing with placeholder values. After lawyer approval, update the text with:
> ```sql
> UPDATE pdpa_notice_versions
> SET content_bm = '...approved text...',
>     content_en = '...approved text...',
>     approved_by = 'Nama Peguam / Firma'
> WHERE version = '1.1';
> ```

**How:**
1. Open the corrected `update-privacy-notice-v1.1.sql`
2. Do the find-replace for all 8 placeholders
3. Copy entire contents
4. Paste into Supabase SQL Editor
5. Click **Run**

**What you should see:**

The script runs Steps 1-2 inside a transaction, then Steps 3-4 as verification queries.

**Step 3 output** should show two rows with these key columns:
```
version | status      | bm_chars | en_chars | summary_bm_preview                          | has_change_reason | approved_by          | superseded_at
--------|-------------|----------|----------|---------------------------------------------|-------------------|----------------------|--------------
1.1     | ✅ ACTIVE   | ~1800    | ~1600    | Saya bersetuju data peribadi saya diprose... | true              | pending_legal_review | NULL
1.0     | ⏹ RETIRED  | ...      | ...      | (null or original)                          | true              | (original value)     | (timestamp)
```

**Step 4 output** should return **exactly 1 row** — v1.1:
```
version | summary_bm                                                    | summary_en
--------|---------------------------------------------------------------|----------------------------------------------------------
1.1     | Saya bersetuju data peribadi saya diproses untuk penilaian... | I agree to my personal data being processed for LPPSA...
```

**If Step 4 returns 0 rows:** The `superseded_at` update on v1.0 didn't work — both versions might have `superseded_at` set. Check with:
```sql
SELECT version, superseded_at FROM pdpa_notice_versions;
```

**If Step 4 returns 2 rows:** The v1.0 `superseded_at` wasn't set. Run manually:
```sql
UPDATE pdpa_notice_versions SET superseded_at = NOW() WHERE version = '1.0';
```

---

## Step 5: Post-Seed Verification (all 3 seeds)

Run this combined check to confirm everything landed:

```sql
-- ═══════════════════════════════════════════
-- POST-SEED VERIFICATION — run after B1+B2+B3
-- ═══════════════════════════════════════════

-- 1. Demo case exists
SELECT 'B1: Demo case' AS check,
  CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM mortgage_cases WHERE case_ref LIKE 'QTK-2026%';

-- 2. WhatsApp template exists
SELECT 'B2: WhatsApp template' AS check,
  CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM whatsapp_templates WHERE code = 'agent_case_alert';

-- 3. Privacy notice v1.1 is active
SELECT 'B3: Privacy v1.1 active' AS check,
  CASE WHEN COUNT(*) = 1 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM pdpa_notice_versions WHERE version = '1.1' AND superseded_at IS NULL;

-- 4. Privacy notice v1.0 is retired
SELECT 'B3: Privacy v1.0 retired' AS check,
  CASE WHEN COUNT(*) = 1 THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM pdpa_notice_versions WHERE version = '1.0' AND superseded_at IS NOT NULL;

-- 5. Consent checkbox text populated
SELECT 'B3: Summaries populated' AS check,
  CASE WHEN summary_bm IS NOT NULL AND summary_en IS NOT NULL
    THEN '✅ PASS' ELSE '❌ FAIL' END AS status
FROM pdpa_notice_versions WHERE version = '1.1';
```

**Expected output: 5 rows, all ✅ PASS.**

---

## Step 6: Deploy Code Changes

After seeds are in the database, deploy the S6.3 + S6.4 code changes:

```bash
cd /path/to/mortgage-flow-demo
git add -A
git commit -m "S6.3: API hardening (Zod validation, pagination, field whitelist) + S6.4: buyer portal live API wiring"
git push
```

Vercel will auto-deploy. Wait for the build to complete (check Vercel dashboard or `vercel` CLI).

---

## Step 7: Live Smoke Test

Once deployed, walk through all 3 demo paths on **snang.my**:

### Buyer path
1. Open `/buyer/start` → complete consent flow → should set `sessionStorage.buyer_hash`
2. Navigate to `/buyer` → should show live case data (not hardcoded demo data)
3. Check footer: should say "Live Data" not "Demo Mode"

### Agent path
1. Open `/agent` → verify case list loads with real data
2. Check aggregate numbers (Jumlah Kes, TAC Minggu Ini, etc.) match actual case count
3. Open a case detail → verify readiness panel and WhatsApp button

### Developer path
1. Open `/developer` → verify aggregate stats load
2. Open `/developer/proof` → verify proof events appear

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Agent dashboard shows 0 cases | Seed B1 didn't run, or RLS blocking | Check `mortgage_cases` table in Supabase Table Editor |
| Buyer portal shows hardcoded data | `sessionStorage.buyer_hash` not set | Go through `/buyer/start` first |
| Consent checkbox is blank | B3 `summary_bm`/`summary_en` NULL | Check `pdpa_notice_versions` table |
| WhatsApp notification fails | B2 template missing | Check `whatsapp_templates` table |
| API returns 500 | Zod validation rejecting old data format | Check Vercel function logs |
| Pages show "Demo Mode" | Feature flags set to demo preset | Check feature flags in admin panel |

---

*Guide generated: 12 February 2026*
*Sprint: S6.1 — Seed Execution + Live Verification*
*Rev 2: Corrected table names (cases→mortgage_cases), column names (template_name→code), removed phantom columns (language, status), fixed B1/B2 descriptions, updated B3 expected output columns*
