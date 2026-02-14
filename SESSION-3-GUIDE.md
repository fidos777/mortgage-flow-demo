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

## Wiring into Agent Case Detail

In `app/(demo)/agent/case/[id]/page.tsx`, add the notification component:

```tsx
import AgentCaseNotification from '@/components/agent/AgentCaseNotification';

// Inside the case detail JSX, add after the AgentReadinessPanel:
<AgentCaseNotification
  caseId={caseData.id}
  caseRef={caseData.case_ref}
  buyerName={caseData.buyer_name}
  propertyName={propertyName}
  status={caseData.status}
/>
```

For compact mode in the agent case list (`app/(demo)/agent/page.tsx`), add per-row:

```tsx
<AgentCaseNotification
  caseId={case.id}
  caseRef={case.case_ref}
  compact
/>
```

## Deployment Steps

1. Copy files to project
2. `git add -A && git commit -m "feat(a09): WhatsApp agent notification" && git push origin main`
3. Wait for Vercel green
4. Run `seed-whatsapp-template.sql` in Supabase SQL Editor

## Proof Events Added

| Event Type | When | Actor |
|-----------|------|-------|
| `AGENT_NOTIFICATION_GENERATED` | API generates notification | system |
| `AGENT_WHATSAPP_NOTIFICATION_SENT` | Agent clicks send button | agent |

Combined with existing `WHATSAPP_CONTACT_INITIATED` from `WhatsAppContactCTA.tsx`, the full WhatsApp audit trail is:
- System generates notification → Agent sends via WhatsApp → Buyer contacts agent via WhatsApp CTA
