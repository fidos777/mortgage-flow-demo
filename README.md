# Mortgage Flow Engine Demo

**Three Powers Architecture Demo for LPPSA Workflow Automation**

Built with PRD v3.4 compliance — demonstrating the constitutional governance model for Malaysian government housing loan workflows.

## 🎯 Quick Start (Demo)

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

## 🚀 Deploy to Vercel

```bash
# One-click deploy
npx vercel --prod
```

---

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    MORTGAGE FLOW ENGINE                         │
├─────────────────────────────────────────────────────────────────┤
│  ROLE SWITCHER: [ 👤 Buyer ] [ 🏢 Agent ] [ 🏗️ Developer ]      │
├─────────────────────────────────────────────────────────────────┤
│         ↓                   ↓                   ↓               │
│  ┌───────────┐       ┌───────────┐       ┌───────────┐         │
│  │  BUYER    │       │  AGENT    │       │ DEVELOPER │         │
│  │  PreScan  │       │  Control  │       │ Pipeline  │         │
│  │  Journey  │       │  Panel    │       │ Dashboard │         │
│  │  KJ Flow  │       │  Cases    │       │ Analytics │         │
│  └─────┬─────┘       └─────┬─────┘       └─────┬─────┘         │
│        └──────────┬────────┴──────────────────┘                │
│                   ▼                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           ORCHESTRATOR (Legislative Layer)               │   │
│  │   Case State Machine │ Permission Enforcement │ Workflow │   │
│  └─────────────────────────────────────────────────────────┘   │
│                   │                                            │
│        ┌─────────┴─────────┐                                  │
│        ▼                   ▼                                  │
│  ┌───────────┐       ┌───────────┐                            │
│  │KUASATURBO │       │  QONTREK  │                            │
│  │(Executive)│       │ (Judicial)│                            │
│  │OCR, Score │       │Proof Events│                           │
│  └───────────┘       └───────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
mortgage-flow-demo/
├── app/
│   ├── layout.tsx              # Root layout with role switcher
│   ├── page.tsx                # Landing page with role selection
│   │
│   ├── buyer/                  # 👤 Buyer interfaces
│   │   ├── page.tsx            # Buyer dashboard
│   │   ├── prescan/page.tsx    # Pre-application readiness scan
│   │   ├── journey/page.tsx    # Document upload & TAC flow
│   │   └── kj-confirm/page.tsx # KJ identity verification report
│   │
│   ├── agent/                  # 🏢 Agent interfaces
│   │   ├── page.tsx            # Control panel dashboard
│   │   └── case/[id]/page.tsx  # Case detail view
│   │
│   └── developer/              # 🏗️ Developer interfaces
│       ├── page.tsx            # Pipeline dashboard (aggregate only)
│       └── proof/page.tsx      # Proof event log
│
├── components/
│   ├── role-switcher.tsx       # Global role toggle
│   └── permission-gate.tsx     # PRD permission enforcement
│
├── lib/
│   ├── orchestrator/           # Legislative layer
│   │   ├── case-state.ts       # Case lifecycle FSM
│   │   └── permissions.ts      # Role-based access control
│   │
│   ├── kuasaturbo/             # Executive layer
│   │   ├── readiness-score.ts  # PRD Appendix A scoring (exact)
│   │   └── file-validation.ts  # Stage-aware upload validation
│   │
│   ├── qontrek/                # Judicial layer
│   │   └── proof-events.ts     # Proof event factory
│   │
│   ├── services/               # Service abstraction layer
│   │   ├── index.ts            # Service interfaces & factory
│   │   └── mock/               # Mock implementations for demo
│   │
│   └── store/                  # State management
│       └── case-store.ts       # Zustand store with demo data
│
└── types/                      # TypeScript definitions
    ├── case.ts                 # Case entity types
    ├── stakeholder.ts          # Role & permission types
    └── proof-event.ts          # Audit event types
```

---

## 🔒 PRD v3.4 Compliance

### Locked Doctrines (Implemented)

| Doctrine | Implementation |
|----------|----------------|
| **Authority** | Disclaimers on every screen |
| **Execution** | Three-layer separation |
| **Evidence** | Stage-aware upload validation |
| **Validation** | Advisory signals only |
| **Non-Authority** | `authorityClaimed: false` always |

### Permission Enforcement

| Role | CAN See | CANNOT See |
|------|---------|------------|
| **Buyer** | Own status, timeline, docs | Scoring breakdown, risk flags |
| **Agent** | Case status, income RANGE, confidence LABEL | Exact salary, TAC code, raw docs |
| **Developer** | Aggregate counts, conversion rates | Individual buyer data |

### Scoring Formula (PRD Appendix A Exact)

```
A. Rule Coverage (0-30 pts)
   - Employment Type: Tetap=20, Kontrak=8
   - Service Years: 5+=10, 3-4=6, <3=2
   - Age Factor: 50-55=-2, 56+=-5

B. Income Pattern (0-25 pts)
   - Base Income: 5-18 pts based on range
   - Consistency: Tetap=7, Kontrak=3

C. Commitment Signal (0-25 pts)
   - DSR 0-30%=25, 31-40%=18, 41-50%=10, 51+=4

D. Property Context (0-20 pts)
   - Price Multiple: <5x=20, 5-7x=15, 7-10x=10, >10x=5
   - Existing LPPSA: -8 penalty

TOTAL: 100 pts → Bands: ≥70 READY, 50-69 CAUTION, <50 NOT READY
```

---

## 🔄 Demo to Production Transition

### Step 1: Enable API Mode

```typescript
// In your app initialization
import { configureServices } from '@/lib/services';

configureServices({
  mode: 'api',  // Switch from 'mock' to 'api'
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL,
});
```

### Step 2: Implement API Services

Create `lib/services/api/case-service.ts`:

```typescript
import { ICaseService } from '../index';

export class ApiCaseService implements ICaseService {
  constructor(private baseUrl: string) {}
  
  async getCases(role: Role): Promise<Case[]> {
    const res = await fetch(`${this.baseUrl}/cases?role=${role}`);
    return res.json();
  }
  // ... implement other methods
}
```

### Step 3: Add Authentication

```bash
npm install next-auth
# or
npm install @clerk/nextjs
```

### Step 4: Connect to Database

```bash
npm install @supabase/supabase-js
# or your preferred database client
```

### Service Layer Benefits

The abstraction layer (`lib/services/`) means:
- ✅ Zero UI changes needed for production
- ✅ Backend can be swapped without touching components
- ✅ Easy to add caching, optimistic updates
- ✅ Testable with mock services

---

## 🎮 Demo Scenarios

### Scenario 1: Buyer Journey
1. `/buyer` → "Imbasan Kesediaan"
2. Complete pre-scan (see PRD-exact scoring)
3. Upload docs (screenshot blocked at evidence stage)
4. Schedule TAC
5. Report KJ status

### Scenario 2: Agent Coordination
1. Switch to Agent via header
2. View income as RANGE only
3. See confidence as HIGH/LOW labels
4. TAC code never shown

### Scenario 3: Developer Oversight
1. Switch to Developer
2. See ONLY aggregate metrics
3. Individual cases → Access Denied

---

## 📋 Environment Variables

**Demo Mode (default):** None required

**Production Mode:**
```env
NEXT_PUBLIC_SERVICE_MODE=api
NEXT_PUBLIC_API_URL=https://your-api.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=your-anon-key
```

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State**: Zustand with persistence
- **Icons**: Lucide React
- **Language**: TypeScript
- **Deployment**: Vercel

---

## 📄 License

Proprietary - SME Cloud Sdn Bhd © 2026

---

**Built with ❤️ by Qontrek Team**

*"AI bantu, bukan ganti"* — Our governance doctrine
