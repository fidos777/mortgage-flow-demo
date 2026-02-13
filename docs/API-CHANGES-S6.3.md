# API Contract Changelog — S6.3
## Sprint S6, Session 3: API Hardening

---

| Field | Value |
|-------|-------|
| **Date** | 12 February 2026 |
| **Sprint** | S6.3 |
| **Scope** | 4 API hardening fixes (N1, N3, N4, N5) |
| **N2 Status** | Already resolved — `POST /api/documents/upload` already has 20MB limit + MIME whitelist |
| **TypeScript** | 0 production errors post-changes |
| **Dependency** | zod@^3.x added to package.json |

---

## Purpose

This document records the API contract changes made in S6.3 so that S6.4 (Buyer Portal Dashboard Wiring) can wire against the correct response shapes. **S6.4 must consume these contracts, not the pre-S6.3 shapes.**

---

## N1: POST /api/readiness — Zod Validation Added

**File:** `app/api/readiness/route.ts`

### What Changed

Before S6.3, the endpoint accepted any JSON body and only checked for the presence of 3 fields. Now it validates all fields with Zod:

| Field | Validation | Before S6.3 |
|-------|-----------|-------------|
| `employment_type` | Must be `'tetap'`, `'kontrak'`, or `''` | Any string accepted |
| `service_years` | Must be `'0-2'`, `'3-4'`, or `'5+'` | Any string accepted |
| `age_range` | Must be `'below35'`, `'35-49'`, `'50-55'`, or `'56+'` | Any string accepted |
| `income_range` | Must be one of 6 valid ranges | Any string accepted |
| `commitment_range` | Must be `'0-30'`, `'31-40'`, `'41-50'`, or `'51+'` | Any string accepted |
| `existing_loan` | Must be `'yes'`, `'no'`, or `''` | Any string accepted |
| `property_price` | Must be a positive number (if provided) | Negative numbers accepted |
| `case_id` | Must be a valid UUID (if provided) | Any string accepted |

### New Error Response Shape

```typescript
// Status 400 — Validation failure
{
  error: "Validation failed",
  details: [
    {
      code: "invalid_enum_value",
      path: ["income_range"],
      message: "income_range must be one of: 2000-3000, 3001-4000, ..."
    }
  ]
}
```

### S6.4 Impact

The buyer portal's DSR check page (`/buyer/dsr-check`) already sends valid enum values from dropdown selects. However, the error handling must now:

1. Check for `response.details` array (ZodIssue[]) on 400 errors
2. Display field-level validation messages from `details[].message` and `details[].path`

### Success Response (unchanged)

```typescript
{
  success: true,
  data: {
    band: "ready" | "caution" | "not_ready",
    label: string,
    guidance: string,
    dsr_ratio: number | null
  },
  persisted: boolean,
  case_id: string | null
}
```

---

## N3: GET /api/cases — Pagination Overhaul

**File:** `app/api/cases/route.ts`

### What Changed

| Aspect | Before S6.3 | After S6.3 |
|--------|------------|-----------|
| Pagination param | `?offset=0&limit=50` | `?page=1&limit=20` |
| Default limit | 50 | 20 |
| Max limit | Unlimited | 100 |
| Total count | Not available | `total` field in response |
| Buyer filter | Not available | `?buyer_hash=...` filter added |

### New Response Shape

```typescript
// BEFORE S6.3:
{
  success: true,
  data: Case[],
  meta: { count: number, limit: number, offset: number }
}

// AFTER S6.3:
{
  success: true,
  data: Case[],    // Array of cases for current page
  page: number,    // 1-indexed page number
  limit: number,   // Effective page size (capped at 100)
  total: number    // Total matching cases across ALL pages
}
```

### S6.4 Impact

The buyer portal must:

1. **Unwrap `.data` array** — same as before, but `meta` is removed
2. **Use `?page=1` instead of `?offset=0`** — page-based, not offset-based
3. **Use `?buyer_hash=...`** to filter for the current buyer's cases
4. **Read `total`** for pagination UI if needed (total case count)
5. **Handle reduced default** — limit is now 20 (was 50); pass `?limit=50` explicitly if needed

### New Query Parameters

| Param | Type | Default | Max | Description |
|-------|------|---------|-----|-------------|
| `page` | number | 1 | — | 1-indexed page number |
| `limit` | number | 20 | 100 | Cases per page |
| `buyer_hash` | string | — | — | Filter by buyer (new in S6.3) |
| `developer_id` | string | — | — | Filter by developer |
| `agent_id` | string | — | — | Filter by agent |
| `status` | string | — | — | Filter by case status |

---

## N4: POST /api/proof-events — event_type Validation

**File:** `app/api/proof-events/route.ts`

### What Changed

`event_type` was previously accepted as any non-empty string. Now it must be one of the known event types:

```typescript
const VALID_EVENT_TYPES = [
  // BUYER events
  'DOC_UPLOADED', 'DOC_UPLOAD_FAILED', 'ALL_REQUIRED_DOCS_UPLOADED',
  'PRESCAN_COMPLETED', 'TEMUJANJI_BOOKED', 'TAC_SESSION_BOOKED',
  'LPPSA_SUBMISSION_CONSENT_GRANTED',
  // AGENT events
  'CASE_REVIEWED', 'DOCS_VERIFIED', 'BYOD_STARTED',
  // CONSENT events
  'CONSENT_GRANTED', 'CONSENT_REVOKED', 'CONSENT_CASE_LINKED',
  // SYSTEM events
  'READINESS_COMPUTED', 'CASE_CREATED',
];
```

### New Error Response

```typescript
// Status 400 — Invalid event_type
{
  error: "event_type must be one of: DOC_UPLOADED, DOC_UPLOAD_FAILED, ..."
}
```

### S6.4 Impact

Minimal. The buyer portal fires proof events with `DOC_UPLOADED`, `PRESCAN_COMPLETED`, `TEMUJANJI_BOOKED`, `CONSENT_GRANTED` — all are in the valid list. No changes needed unless new event types are added.

**Note:** If a new event type is needed in S6.4 or later, add it to the `VALID_EVENT_TYPES` array first.

---

## N5: GET /api/properties — Field Whitelist

**File:** `app/api/properties/route.ts`

### What Changed

The `select('*')` query was replaced with an explicit field whitelist. The following internal fields are NO LONGER returned:

| Removed Field | Reason |
|--------------|--------|
| `qr_generated` | Internal QR management state |
| `qr_url` | Internal storage reference |
| `qr_token` | Security-sensitive link token |
| `created_at` | Internal timestamp |
| `updated_at` | Internal timestamp |

### Fields Still Available

```
id, developer_id, name, slug, property_type,
address, city, state, postcode, latitude, longitude,
price_min, price_max, currency,
description, description_bm,
total_units, available_units, completion_date,
tenure, lease_years,
cover_image_url, gallery_urls, brochure_url, video_url,
status, published_at,
developer: { id, company_name, slug }
```

### Additional Change

Sort order changed from `created_at DESC` to `published_at DESC` (nulls last). This better reflects the public-facing property listing order.

### S6.4 Impact

The buyer portal's property display must NOT reference:
- `qr_generated`, `qr_url`, `qr_token`
- `created_at`, `updated_at`

All fields needed for the buyer portal (name, address, price range, description, images) remain available.

---

## N2: POST /api/documents/upload — No Change Needed

**File:** `app/api/documents/upload/route.ts`

Pre-verification found this endpoint already implements:
- `MAX_FILE_SIZE = 20 * 1024 * 1024` (20MB)
- `ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf']`
- Server-side file size check (lines 62-67)
- Server-side MIME type check (lines 69-74)
- Document type validation against enum (line 48)

**No changes applied. Existing validation is sufficient.**

---

## Consumer Fixes Applied (Post-Review)

The N3 pagination change reduced the default limit from 50 to 20. Three existing consumers compute client-side aggregates (`cases.length`, `cases.filter()`, `cases.reduce()`) and would show partial data with only 20 rows. Fixed by adding explicit `?limit=100`:

| Consumer | File | Fix Applied |
|----------|------|-------------|
| Agent Dashboard | `app/(demo)/agent/page.tsx` | `fetch('/api/cases?limit=100')` |
| Developer Dashboard | `app/(demo)/developer/page.tsx` | `fetch('/api/cases?limit=100')` + `fetch('/api/properties?limit=100')` |
| PropertyConsole | `components/developer/PropertyConsole.tsx` | `fetch('/api/cases?...&limit=100')` |

**Lesson:** When changing API defaults, audit all consumers first. Dashboard pages that compute aggregates client-side must always request a sufficiently large page.

---

## Summary for S6.4 Developers

| Route | Key Change | S6.4 Action Required |
|-------|-----------|---------------------|
| POST /api/readiness | Zod validation; field-level errors | Handle `{ error, details: ZodIssue[] }` on 400 |
| GET /api/cases | `?page=1&limit=20`; response `{ data, page, limit, total }` | Use `page` param, unwrap `.data`, read `total` |
| POST /api/proof-events | event_type validated against enum | Ensure only valid event types are sent |
| GET /api/properties | No `qr_*`, `created_at`, `updated_at` fields | Don't reference removed fields |

---

*Changelog generated: 12 February 2026*
*Post-review consumer fixes applied: 12 February 2026*
*Review this document before starting S6.4.*
