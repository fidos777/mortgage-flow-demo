# Session 6: Integration QA Sign-Off Checklist
## snang.my Pilot - UI/UX Design Amendments v2.1

**Date**: February 2026
**Version**: Sessions 0-6 Complete
**Status**: ✅ Ready for Review

---

## 🔍 Automated Verification Results

### API Call Audit (PASSED ✅)

```
Grep scan for: fetch( | axios | supabase. | .from( | useSWR | useQuery
```

| Directory | Result |
|-----------|--------|
| `components/ui/` | ✅ No matches |
| `components/trust/` | ✅ No matches |
| `components/mobile/` | ✅ No matches |
| `lib/i18n/` | ✅ No matches |
| `lib/hooks/use-animation.ts` | ✅ No matches |

**Verdict**: No new API calls introduced by UI amendments.

---

### TypeScript Compilation (PASSED ✅)

- Application code compiles without errors
- Test file errors are expected (vitest/playwright not installed)
- Fixed: `AnimationCapability` type export

---

## ✅ Manual QA Checklist

### Backend Impact Verification

| Check | Status | Verified By |
|-------|--------|-------------|
| No new API calls in Network tab | ⬜ | |
| No backend logs triggered | ⬜ | |
| No database writes from UI components | ⬜ | |
| No Supabase RLS policy changes | ⬜ | |
| Existing features still work (upload, booking) | ⬜ | |

### Feature Flag Verification

| Flag | Test: `false` | Test: `true` | Status |
|------|---------------|--------------|--------|
| `NEXT_PUBLIC_ENABLE_ANIMATION` | Zero motion | Full animations | ⬜ |
| `NEXT_PUBLIC_ENABLE_TRUST_UI` | Badges hidden | Badges visible | ⬜ |
| `NEXT_PUBLIC_ENABLE_I18N` | BM only | BM/EN toggle | ⬜ |
| `NEXT_PUBLIC_ENABLE_PROGRESSIVE_DISCLOSURE` | All expanded | Collapsible | ⬜ |

### Animation System (Session 1)

| Check | Status |
|-------|--------|
| `useAnimationCapability` detects device tier | ⬜ |
| `useAnimationToggle` persists to localStorage | ⬜ |
| FPS monitor auto-degrades below 30fps | ⬜ |
| `prefers-reduced-motion` respected | ⬜ |
| Kill-switch disables all animations | ⬜ |

### Progressive Disclosure (Session 2)

| Check | Status |
|-------|--------|
| CollapsibleSection expand/collapse works | ⬜ |
| Content always in DOM (inspect Elements) | ⬜ |
| Accordion single/multi open modes | ⬜ |
| ReadMore truncation with "Baca Lagi" | ⬜ |
| StepCards timeline navigation | ⬜ |
| Keyboard navigation (Tab, Enter, Space) | ⬜ |

### Trust UI (Session 3)

| Check | Status |
|-------|--------|
| TrustStrip displays PDPA/SSL badges | ⬜ |
| InlineTrustIndicator near CTAs | ⬜ |
| PrivacyNoteCTA shows reassurance | ⬜ |
| ConsentIndicator is READ-ONLY | ⬜ |
| No consent state mutations | ⬜ |

### i18n Localization (Session 4)

| Check | Status |
|-------|--------|
| Language toggle BM ↔ EN | ⬜ |
| localStorage persistence works | ⬜ |
| No layout shift on language change | ⬜ |
| Text overflow handled (line-clamp) | ⬜ |
| All strings translated | ⬜ |

### Mobile-First Polish (Session 5)

| Check | Status |
|-------|--------|
| Touch targets 44px minimum | ⬜ |
| ScrollToTop appears on scroll | ⬜ |
| MobileStack stacks on mobile | ⬜ |
| MobileBottomBar sticky position | ⬜ |
| Safe area insets respected | ⬜ |
| 16px font size on inputs (no iOS zoom) | ⬜ |

### Cross-Browser Testing

| Browser | Status |
|---------|--------|
| Chrome (Desktop) | ⬜ |
| Chrome (Android) | ⬜ |
| Safari (Desktop) | ⬜ |
| Safari (iOS) | ⬜ |
| Firefox | ⬜ |

### Device Testing (Malaysia Market)

| Device | Status |
|--------|--------|
| Low-end Android (360×640) | ⬜ |
| Mid-range Android (412×915) | ⬜ |
| iPhone SE (375×667) | ⬜ |
| 4G connection (not WiFi) | ⬜ |

### Accessibility

| Check | Status |
|-------|--------|
| Keyboard navigation works | ⬜ |
| Focus states visible | ⬜ |
| Screen reader announces correctly | ⬜ |
| `prefers-reduced-motion` respected | ⬜ |
| Color contrast passes (WCAG AA) | ⬜ |

---

## 📁 Files Delivered

### Session 0: Guardrails
- [x] `.env.local` - Feature flags
- [x] `docs/UI-AMENDMENTS.md` - Scope documentation
- [x] `docs/UI-COMMENT-TEMPLATES.md` - Developer standards

### Session 1: Animation Foundation
- [x] `lib/hooks/use-animation.ts` - Animation hooks
- [x] `lib/animation-variants.ts` - Motion presets
- [x] `components/ui/animated-container.tsx` - React wrapper

### Session 2: Progressive Disclosure
- [x] `components/ui/collapsible-section.tsx`
- [x] `components/ui/accordion.tsx`
- [x] `components/ui/expandable-card.tsx`
- [x] `components/ui/read-more.tsx`
- [x] `components/ui/step-cards.tsx`
- [x] `docs/PROGRESSIVE-DISCLOSURE-GUIDE.md`

### Session 3: Trust UI
- [x] `components/trust/trust-strip.tsx`
- [x] `components/trust/inline-indicator.tsx`
- [x] `components/trust/privacy-note.tsx`
- [x] `components/trust/consent-indicator.tsx`
- [x] `components/trust/security-statement.tsx`

### Session 4: i18n Localization
- [x] `lib/i18n/translations.ts`
- [x] `lib/i18n/LanguageContext.tsx`
- [x] `lib/i18n/glossary.ts`
- [x] `components/LanguageToggle.tsx`

### Session 5: Mobile-First Polish
- [x] `tailwind.config.js` - Breakpoints, touch targets
- [x] `app/globals.css` - Mobile utilities
- [x] `components/mobile/scroll-to-top.tsx`
- [x] `components/mobile/touch-button.tsx`
- [x] `components/mobile/mobile-stack.tsx`
- [x] `components/mobile/viewport-debug.tsx`
- [x] `docs/MOBILE-FIRST-GUIDE.md`

### Session 6: QA
- [x] `docs/SESSION-6-QA-SIGNOFF.md` (this file)

---

## 🚀 Release Readiness

### Pre-Deploy Checklist

- [ ] All manual QA checks passed
- [ ] Feature flags set to production values
- [ ] No console errors in browser
- [ ] Performance budget met (FCP < 2s on 4G)
- [ ] Rollback procedure documented

### Production Feature Flag Settings

```env
NEXT_PUBLIC_ENABLE_ANIMATION=true
NEXT_PUBLIC_ENABLE_TRUST_UI=true
NEXT_PUBLIC_ENABLE_I18N=false          # Enable when translations complete
NEXT_PUBLIC_ENABLE_PROGRESSIVE_DISCLOSURE=true
```

---

## ✍️ Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Engineering Lead | | | |
| QA Lead | | | |
| Product Owner | | | |
| Compliance (if required) | | | |

---

## 🔄 Rollback Procedure

### Emergency Disable (No Deploy)
1. Set feature flag to `false` in `.env.local`
2. Restart server / trigger redeploy

### Full Rollback
1. Revert commits: `components/ui/`, `components/trust/`, `components/mobile/`, `lib/i18n/`, `lib/hooks/use-animation.ts`
2. Remove feature flags from `.env.local`
3. Redeploy

**Impact**: Zero backend changes. Database intact.

---

*Generated: Session 6 Integration QA*
