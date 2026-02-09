# UI/UX Design Amendments v2.1
## snang.my Pilot - Presentation Layer Changes

> **CRITICAL**: All changes in this document are **presentation-layer only**.
> No backend impact. No API changes. No database mutations.

---

## 📋 Scope Definition

### What This Covers
- Performance-aware animation system
- Progressive disclosure components
- Trust & security UI indicators
- i18n localization (BM/EN)
- Mobile-first responsive layouts

### What This Does NOT Touch
| Backend Feature | Status |
|-----------------|--------|
| CR-008 Doc Upload (`/buyer/upload`) | ✅ Unchanged |
| Temujanji Booking (`/buyer/temujanji`) | ✅ Unchanged |
| S5 Incentive Engine | ✅ Unchanged |
| CR-007A Unit Inventory | ✅ Unchanged |
| PDPA Consent Flow (writes) | ✅ Unchanged |
| Database schemas | ✅ Unchanged |
| Supabase RLS policies | ✅ Unchanged |
| API endpoints | ✅ Unchanged |

---

## 🎛️ Feature Flags

All UI amendments are controlled via feature flags in `.env.local`:

```env
NEXT_PUBLIC_ENABLE_ANIMATION=true
NEXT_PUBLIC_ENABLE_TRUST_UI=true
NEXT_PUBLIC_ENABLE_I18N=false
NEXT_PUBLIC_ENABLE_PROGRESSIVE_DISCLOSURE=true
```

### Kill Switch Behavior
| Flag | `false` Behavior |
|------|------------------|
| `ENABLE_ANIMATION` | Zero motion, instant transitions |
| `ENABLE_TRUST_UI` | Trust badges hidden |
| `ENABLE_I18N` | Defaults to BM only |
| `ENABLE_PROGRESSIVE_DISCLOSURE` | All content expanded |

---

## 🧩 Component Boundaries

### Animation Components (`lib/hooks/`)
```
useAnimationCapability  → Device tier detection (client-side only)
useAnimationToggle      → User preference (localStorage only)
useFPSMonitor           → Performance tracking (no telemetry)
useAnimateOnScroll      → Intersection observer (no server calls)
```

### Progressive Disclosure (`components/ui/`)
```
CollapsibleSection  → Expand/collapse (DOM persistence)
Accordion           → Multi-item FAQ
ExpandableCard      → Step cards
ReadMoreText        → Truncate with "Baca Lagi"
```

**Compliance Note**: Legal text always remains in DOM (not conditionally rendered).

### Trust UI (`components/trust/`)
```
TrustStrip           → PDPA/SSL banner (visual only)
InlineTrustIndicator → Small badge (visual only)
PrivacyNoteCTA       → Near-CTA reassurance (visual only)
ConsentIndicator     → Visual status (READ-ONLY, no mutations)
```

**Explicit Boundary**: Trust components do NOT:
- Write to server state
- Modify consent records
- Gate user progression
- Make API calls

### i18n (`lib/i18n/`)
```
dictionaries/ms.json  → Bahasa Malaysia strings
dictionaries/en.json  → English strings
useTranslation        → Key-based lookup (client-side)
LanguageProvider      → Context + localStorage persistence
```

---

## ⚠️ Future Risk Disclaimer

If any of the following occur, **backend review is required**:

1. Trust components become stateful (write consent)
2. Animation hooks add telemetry/analytics
3. i18n adds server-side rendering requirements
4. Progressive disclosure gates mandatory content

**Current Status**: None of these apply. All components are presentation-only.

---

## 🔄 Rollback Procedure

### Emergency Disable (No Deploy Required)
1. Set feature flag to `false` in `.env.local`
2. Restart dev server / redeploy

### Full Rollback
1. Revert commits in `components/ui/`, `components/trust/`, `lib/hooks/`, `lib/i18n/`
2. Remove feature flags from `.env.local`
3. Redeploy

**Impact**: Zero backend changes. Database remains intact.

---

## ✅ Sign-Off Checklist (Session 6)

Before shipping, verify:

- [ ] No new API calls (check Network tab)
- [ ] No backend logs triggered
- [ ] Animation fallback works (set `ENABLE_ANIMATION=false`)
- [ ] Trust badges on all CTAs
- [ ] BM/EN switch stable (no layout shift)
- [ ] Cross-browser tested (Chrome/Safari/Firefox)
- [ ] Accessibility tested (keyboard nav)
- [ ] Low-end Android tested (real device)

---

## 📅 Session-Based Implementation

| Session | Focus | Dependency |
|---------|-------|------------|
| 0 | Guardrails (this doc) | None |
| 1 | Animation Foundation | Session 0 |
| 2 | Progressive Disclosure | Session 0 |
| 3 | Trust UI | Session 0 |
| 4 | i18n Localization | Session 0 |
| 5 | Mobile-First Polish | Sessions 1-4 |
| 6 | Integration QA | Session 5 |

Sessions 1-4 can run in parallel.

---

*Last updated: February 2026*
*Author: Claude (AI Assistant)*
*Review: Pending engineering sign-off*
