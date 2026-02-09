# UI Component Comment Templates
## Standard Headers for Visual-Only Components

Use these comment blocks at the top of each UI amendment component.

---

## Animation Components

```tsx
/**
 * @component useAnimationCapability
 * @scope VISUAL ONLY - Presentation Layer
 *
 * Detects device animation capability tier.
 *
 * ⚠️ BOUNDARIES:
 * - Does NOT make API calls
 * - Does NOT send telemetry
 * - Does NOT persist to server
 * - Client-side detection only
 *
 * @returns {'full' | 'reduced' | 'none'} Animation tier
 */
```

```tsx
/**
 * @component useAnimationToggle
 * @scope VISUAL ONLY - Presentation Layer
 *
 * User preference for animation on/off.
 *
 * ⚠️ BOUNDARIES:
 * - Persists to localStorage ONLY
 * - Does NOT sync to server
 * - Does NOT affect backend state
 *
 * @returns {boolean} Animation enabled state
 */
```

---

## Progressive Disclosure Components

```tsx
/**
 * @component CollapsibleSection
 * @scope VISUAL ONLY - Presentation Layer
 *
 * Expandable content section for mobile-first disclosure.
 *
 * ⚠️ BOUNDARIES:
 * - Content ALWAYS in DOM (not conditionally rendered)
 * - No API calls on expand/collapse
 * - No analytics tracking
 *
 * ⚠️ COMPLIANCE:
 * - Legal text must remain visible in DOM
 * - Do not use for gating mandatory disclosures
 */
```

---

## Trust UI Components

```tsx
/**
 * @component TrustStrip
 * @scope VISUAL ONLY - Presentation Layer
 *
 * Displays PDPA/SSL/Security badges.
 *
 * ⚠️ BOUNDARIES:
 * - VISUAL INDICATOR ONLY
 * - Does NOT read consent state from server
 * - Does NOT write consent state to server
 * - Does NOT gate user progression
 * - Does NOT make API calls
 *
 * This component shows trust badges for UX reassurance.
 * Actual consent logic is handled separately in the backend.
 */
```

```tsx
/**
 * @component ConsentIndicator
 * @scope VISUAL ONLY - Presentation Layer
 *
 * Shows visual status of user consent (checkbox style).
 *
 * ⚠️ CRITICAL BOUNDARIES:
 * - READ-ONLY visual component
 * - Does NOT mutate consent state
 * - Does NOT write to database
 * - Does NOT call consent APIs
 * - Does NOT gate form submission
 *
 * If you need to MODIFY consent, use the backend consent service.
 * This component is for DISPLAY ONLY.
 */
```

---

## i18n Components

```tsx
/**
 * @component useTranslation
 * @scope VISUAL ONLY - Presentation Layer
 *
 * Client-side translation hook for BM/EN.
 *
 * ⚠️ BOUNDARIES:
 * - Dictionary lookup only
 * - No server-side rendering
 * - Language preference in localStorage only
 * - Does NOT sync language to user profile
 */
```

```tsx
/**
 * @component LanguageProvider
 * @scope VISUAL ONLY - Presentation Layer
 *
 * Context provider for language state.
 *
 * ⚠️ BOUNDARIES:
 * - Client-side context only
 * - Persists to localStorage
 * - Does NOT sync to server
 * - Does NOT affect backend locale handling
 */
```

---

## Generic Template

For any new UI-only component:

```tsx
/**
 * @component [ComponentName]
 * @scope VISUAL ONLY - Presentation Layer
 *
 * [Brief description]
 *
 * ⚠️ BOUNDARIES:
 * - Does NOT make API calls
 * - Does NOT mutate backend state
 * - Does NOT persist to server
 * - [Additional constraints]
 *
 * @see /docs/UI-AMENDMENTS.md for full scope
 */
```

---

## ESLint Rule (Optional)

Consider adding a custom ESLint rule to enforce these comments:

```js
// .eslintrc.js
module.exports = {
  rules: {
    'require-visual-only-comment': {
      // Enforce @scope VISUAL ONLY comment for components in:
      // - components/ui/
      // - components/trust/
      // - lib/hooks/use-animation*.ts
      // - lib/i18n/
    }
  }
}
```

---

*Use these templates consistently across all UI amendment components.*
