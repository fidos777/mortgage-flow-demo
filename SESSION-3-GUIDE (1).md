# Session 3: WhatsApp Agent Notification (A09)

## Files Created

```
app/api/notifications/agent-case/route.ts    → NEW API endpoint
components/agent/AgentCaseNotification.tsx    → NEW component
supabase/seed/seed-whatsapp-template.sql     → Template seed
```

## What It Does

When an agent clicks "Hantar via WhatsApp" on a case:

1. `POST /api/notifications/agent-case` fetches case + agent + property data
2. Constructs BM message: "🏠 Kes Baru Diterima — {case_ref} / {property_name}"
3. Generates `wa.me` deep link with agent's phone number
4. Opens WhatsApp with pre-filled message
5. Logs `AGENT_NOTIFICATION_GENERATED` + `AGENT_WHATSAPP_NOTIFICATION_SENT` proof events

## Wiring into Agent Pages

### 1. Case Detail Page — `app/(demo)/agent/case/[id]/page.tsx`

Add import at top:
```tsx
import AgentCaseNotification from '@/components/agent/AgentCaseNotification';
```

Add component in the right sidebar, after `AgentReadinessPanel` and before the TAC booking card:
```tsx
{/* WhatsApp Agent Notification */}
<AgentCaseNotification
  caseId={caseData.id}
  caseRef={caseData.case_ref}
  buyerName={caseData.buyer_name}
  propertyName={propertyName}
  status={caseData.status}
/>
```

### 2. Agent Case List — `app/(demo)/agent/page.tsx`

Add import at top:
```tsx
import AgentCaseNotification from '@/components/agent/AgentCaseNotification';
```

Add compact button in each case card row (e.g. next to case status badge):
```tsx
<AgentCaseNotification
  caseId={c.id}
  caseRef={c.case_ref}
  compact
/>
```

### 3. Replace existing WhatsApp placeholder (if exists)

If the agent preview panel has a placeholder WhatsApp button, replace it with:
```tsx
<AgentCaseNotification
  caseId={selectedCase.id}
  caseRef={selectedCase.case_ref}
  buyerName={selectedCase.buyer_name}
  propertyName={selectedCase.properties?.name}
  status={selectedCase.status}
/>
```

## Deployment Steps

1. Copy files to project
2. Wire component into agent pages (see above)
3. `git add -A && git commit -m "feat(a09): WhatsApp agent notification" && git push origin main`
4. Wait for Vercel green
5. Run `seed-whatsapp-template.sql` in Supabase SQL Editor

**Note:** The seed SQL uses columns `code`, `name`, `description`, `message_bm`, `message_en`, `category`, `is_active` — matching the actual `whatsapp_templates` schema from migrations 003/005. The `ON CONFLICT (code)` clause matches the UNIQUE constraint on `code`.

## Proof Events Added

| Event Type | When | Actor |
|-----------|------|-------|
| `AGENT_NOTIFICATION_GENERATED` | API generates notification | system |
| `AGENT_WHATSAPP_NOTIFICATION_SENT` | Agent clicks send button | agent |

Combined with existing `WHATSAPP_CONTACT_INITIATED` from `WhatsAppContactCTA.tsx`, the full WhatsApp audit trail is:
- System generates notification → Agent sends via WhatsApp → Buyer contacts agent via WhatsApp CTA
