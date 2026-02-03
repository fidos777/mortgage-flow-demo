# Mortgage Flow Demo Guide v1.2

**Duration:** 10-15 minutes
**Audience:** LPPSA stakeholders, property developers, banking partners
**Demo URL:** http://localhost:3000 (or Vercel deployment)

---

## Pre-Demo Checklist

- [ ] Server running on port 3000
- [ ] Chrome browser ready (incognito recommended)
- [ ] 7 tabs pre-opened in order (optional)
- [ ] Language set to BM (Bahasa Malaysia)
- [ ] Screen sharing enabled

### Quick Start (1-Command)

```bash
# Option A: Full setup (kill port + build + start)
npm run demo:full

# Option B: Step by step
npm run demo:health    # verify routes
npm run demo:prep      # kill port 3000 + build
npm run demo:start     # start server
```

---

## Demo Flow Overview

```
ACT 1: Developer View (3-4 min)
    └─> Pipeline Dashboard → Proof Logs

ACT 2: Buyer View (4-5 min)
    └─> Prescan → DSR Calculator → Application Journey

ACT 3: Agent View (3-4 min)
    └─> Control Panel → Case Detail
```

---

## ACT 1: Developer (Pemaju) View
**Duration:** 3-4 minutes
**Screenshot refs:** 01-developer.png, 02-developer-proof.png

### Scene 1.1: Pipeline Dashboard
**Route:** `/developer`
**Time:** ~2 minutes

#### What You'll See
- Project card: "Residensi Harmoni" (Kajang, Selangor)
- Stats: 250 units total, 180 sold, 45 loans in process
- Access restriction banner (orange) citing PRD Section 9.2

#### Script

> "Let's start with the **Developer view**. This is what a property developer like Residensi Harmoni sees."
>
> *[Point to stats cards]*
>
> "Notice they see **aggregate data only** — 250 units, 180 sold, 45 loans being processed. The system shows the pipeline health without exposing individual buyer details."
>
> *[Point to orange banner]*
>
> "This banner is key: **'Akses Terhad'** — the developer can monitor their project's loan progress, but they cannot see buyer names, phone numbers, prices, or target dates. This protects buyer privacy while giving developers the visibility they need."

#### Win Condition
✅ Audience understands: Developers see aggregated pipeline data, NOT individual buyer information.

---

### Scene 1.2: Proof Logs (Judicial Layer)
**Route:** `/developer/proof`
**Time:** ~1.5 minutes

#### What You'll See
- "Log Bukti Aktiviti" title with "Qontrek Judicial Layer" subtitle
- Info banner showing `authorityClaimed: false`
- Three proof categories: FACT (blue), DECLARE (green), DERIVED (purple)

#### Script

> "Now the **Proof Logs** — this is our audit trail."
>
> *[Point to authorityClaimed: false]*
>
> "See this? **'authorityClaimed: false'** — the system explicitly declares it makes no decisions. Every action is logged with a category:"
>
> - **FACT** — extracted from documents
> - **DECLARE** — stated by a human
> - **DERIVED** — calculated by the system
>
> "If there's ever a dispute, this log shows exactly what happened and who said what. No black boxes."

#### Win Condition
✅ Audience understands: Full audit trail exists; system claims no authority.

#### Transition
> "Now let's see the **buyer's experience** — how someone actually applies for LPPSA financing..."

---

## ACT 2: Buyer (Pembeli) View
**Duration:** 4-5 minutes
**Screenshot refs:** 03-buyer-prescan.png, 04-buyer-dsr.png, 05-buyer-journey.png

### Scene 2.1: Pre-Application Readiness Scan
**Route:** `/buyer/prescan`
**Time:** ~1.5 minutes

#### What You'll See
- Step indicator: 1/7
- Property details: Residensi Harmoni, Unit A-12-03, RM 450,000
- "Imbasan Kesediaan" title (Pre-Application Readiness Scan)

#### Script

> "This is **Imbasan Kesediaan** — a readiness scan before the buyer commits."
>
> *[Point to property card]*
>
> "The buyer sees the unit they're interested in — Residensi Harmoni, Unit A-12-03, RM 450,000. Before they fill out any forms, the system helps them understand if they're likely ready."
>
> "Think of it as a **self-assessment** — not a pre-approval, just preparation."

#### Win Condition
✅ Audience understands: Buyers can self-assess readiness before committing.

---

### Scene 2.2: DSR Calculator
**Route:** `/buyer/dsr-check`
**Time:** ~2 minutes

#### What You'll See
- Blue header: "Kalkulator DSR" (Debt Service Ratio Quick Check)
- **PENAFIAN PENTING** warning banner (critical)
- Income input field (RM 5,000 default)
- "+ Tambah" button for adding existing commitments

#### Script

> "Here's the **DSR Calculator** — Debt Service Ratio."
>
> *[Point to PENAFIAN PENTING banner — READ IT ALOUD]*
>
> "This disclaimer is crucial: **'Ini adalah isyarat kesediaan sahaja, bukan kelulusan pinjaman.'** This is a readiness signal only, NOT loan approval. The actual DSR will be calculated by LPPSA based on official documents."
>
> *[Point to input fields]*
>
> "Buyers enter their gross monthly income and existing commitments. The system gives them a **signal** — are they in a healthy range? But we never say 'you qualify' or 'you're approved.'"

#### Win Condition
✅ Audience understands: DSR calculator is educational, NOT decisional.

---

### Scene 2.3: Application Journey
**Route:** `/buyer/journey`
**Time:** ~1 minute

#### What You'll See
- Step indicator: 1/5
- "Permohonan LPPSA" title
- Document checklist (IC, payslip, bank statements)
- Footer: "Tiada kelulusan" (No approval)

#### Script

> "Once ready, buyers enter the **Application Journey**."
>
> *[Point to document list]*
>
> "The system guides them on what documents to prepare — IC front and back, current payslip, 3-month bank statements. It's a **document organizer**, not a decision-maker."
>
> *[Point to footer]*
>
> "And there it is again: **'Tiada kelulusan'** — No approval. This system helps organize, not decide."

#### Win Condition
✅ Audience understands: System is a workflow facilitator, NOT an authority.

#### Transition
> "Finally, let's see what the **loan agent** sees when managing cases..."

---

## ACT 3: Agent (Ejen) View
**Duration:** 3-4 minutes
**Screenshot refs:** 06-agent.png, 07-agent-case-C001.png

### Scene 3.1: Control Panel
**Route:** `/agent`
**Time:** ~2 minutes

#### What You'll See
- Stats: 5 cases, 2 TAC this week, 2 need attention, 0 ready to send
- Privacy banner about income ranges (HIGH/LOW confidence)
- Case list with priority badges (P1, P3)
- Filter tabs: TAC Dijadual, Dokumen Pending, KJ Overdue, LO Hampir Tamat

#### Script

> "This is the **Agent Control Panel** — the operational hub."
>
> *[Point to stats cards]*
>
> "At a glance: 5 total cases, 2 TAC meetings this week, 2 need attention. Agents can prioritize their workload."
>
> *[Point to privacy banner]*
>
> "Important: **'Ejen melihat julat pendapatan sahaja, bukan angka tepat.'** Agents see income RANGES, not exact figures. Confidence is shown as HIGH or LOW, not precise scores."
>
> *[Point to case cards]*
>
> "Each case shows the buyer name, project, priority level, and status — but always within the privacy boundaries."

#### Win Condition
✅ Audience understands: Agents have operational visibility without sensitive details.

---

### Scene 3.2: Case Detail
**Route:** `/agent/case/C001`
**Time:** ~1.5 minutes

#### What You'll See
- Buyer: Ahmad bin Ali, Residensi Harmoni A-12-03
- Status badge: "TAC Dijadualkan" (TAC Scheduled)
- Privacy banner: "Dokumen mentah dan angka tepat tidak ditunjukkan"
- Buyer info with income RANGE (RM 4,001 - 5,000)
- "READY TO CONTINUE" signal

#### Script

> "Let's open a specific case — **Ahmad bin Ali**."
>
> *[Point to buyer info section]*
>
> "The agent sees: name, phone, job (Cikgu — teacher), employer (Ministry of Education), grade (DG41), and income **range** — RM 4,001 to 5,000. Not the exact figure."
>
> *[Point to privacy banner]*
>
> "The system states clearly: **'Dokumen mentah dan angka tepat tidak ditunjukkan.'** Raw documents and exact numbers are not shown."
>
> *[Point to READY TO CONTINUE]*
>
> "The status shows **'READY TO CONTINUE'** — this is a signal to proceed to the next step, not an approval of anything. The agent coordinates, the system organizes, but **LPPSA decides.**"

#### Win Condition
✅ Audience understands: System empowers agents without overstepping authority.

---

## Closing Summary
**Time:** ~1 minute

> "So to recap what Qontrek Mortgage Flow does:"
>
> 1. **Developers** see aggregate pipeline health — no individual buyer data
> 2. **Buyers** get self-service readiness tools — guidance, not decisions
> 3. **Agents** manage cases efficiently — operational visibility, privacy protected
>
> "Throughout the system, you'll notice: **no approval language, no authority claims, full audit trails.** This is a workflow orchestration layer that respects the boundaries of who actually makes lending decisions — LPPSA."
>
> "Questions?"

---

## DO / DON'T SAY Reference

### Words to AVOID (Never Say)

| Avoid | Why | Instead Say |
|-------|-----|-------------|
| "Approved" / "Lulus" | Implies lending authority | "Ready to proceed" / "Sedia diteruskan" |
| "Rejected" / "Ditolak" | Implies lending authority | "Needs attention" / "Perlu perhatian" |
| "Qualified" / "Layak" | Implies assessment authority | "Within typical range" / "Dalam julat biasa" |
| "Pre-approved" | Implies conditional commitment | "Pre-assessed" / "Pra-dinilai" |
| "Guaranteed" | Implies outcome certainty | "Indicated" / "Ditunjukkan" |
| "Decision" / "Keputusan" | Implies system authority | "Signal" / "Isyarat" |
| "Score" (exact) | Implies precise assessment | "Confidence level" / "Tahap keyakinan" |

### Words to USE (Safe Language)

| Safe Term | Context |
|-----------|---------|
| "Readiness signal" / "Isyarat kesediaan" | DSR calculator results |
| "Ready to continue" / "Sedia diteruskan" | Case progression |
| "Needs attention" / "Perlu perhatian" | Cases requiring action |
| "Within range" / "Dalam julat" | Income/DSR guidance |
| "Organize documents" / "Susun dokumen" | Application journey |
| "Coordinate" / "Selaras" | Agent workflow |
| "Facilitate" / "Memudahkan" | System role description |

---

## Q&A Preparation

### Likely Questions

**Q: Does this system approve loans?**
> "No. Qontrek facilitates the workflow and organizes information. All lending decisions are made by LPPSA based on their official assessment process."

**Q: Why can't agents see exact income figures?**
> "Privacy protection. Agents need to coordinate, not assess creditworthiness. They see enough to do their job — schedule TAC, track documents — without accessing sensitive financial details."

**Q: What happens if the DSR calculation is wrong?**
> "Our calculation is a guidance tool only. The disclaimer states this clearly. LPPSA performs the official DSR calculation using verified documents. Ours is for buyer self-preparation."

**Q: How do you ensure audit compliance?**
> "Every action is logged in the Proof Logs with timestamps, categories (FACT/DECLARE/DERIVED), and the explicit statement that the system claims no authority. This creates a complete audit trail."

---

## Technical Appendix

### Demo Routes (Correct Order)

1. `http://localhost:3000/developer`
2. `http://localhost:3000/developer/proof`
3. `http://localhost:3000/buyer/prescan`
4. `http://localhost:3000/buyer/dsr-check`
5. `http://localhost:3000/buyer/journey`
6. `http://localhost:3000/agent`
7. `http://localhost:3000/agent/case/C001` ⚠️ (Note: Use C001, not DEMO-001)

### Keyboard Shortcuts During Demo

- `BM/EN` toggle in header — switch languages live
- Back navigation available on all detail pages
- Filter tabs on agent dashboard are clickable

---

**Guide Version:** 1.2
**Last Updated:** 2026-02-03
**Verified Against:** Mortgage Flow Demo v3.6.1
