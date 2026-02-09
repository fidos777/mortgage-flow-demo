# Mobile-First Implementation Guide
## Session 5: snang.my Pilot - Malaysia Market Optimization

> **Target**: RM500 Android phones on 4G connections
> **Primary Breakpoint**: 640px (sm)

---

## 📱 Breakpoint System

| Breakpoint | Width | Target Device |
|------------|-------|---------------|
| `xs` | 375px | iPhone SE, small Android |
| `sm` | 640px | **Primary mobile** |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Ultra-wide |

### Usage Pattern (Mobile-First)

```tsx
// ✅ Correct: Mobile-first
<div className="flex flex-col sm:flex-row">

// ❌ Wrong: Desktop-first
<div className="flex flex-row sm:flex-col">
```

---

## 👆 Touch Targets

WCAG 2.1 AA requires minimum 44×44px touch targets.

### Tailwind Classes

```tsx
// Minimum (44px)
<button className="min-h-touch min-w-touch">

// Comfortable (48px)
<button className="min-h-touch-lg min-w-touch-lg">

// Utility class
<button className="touch-target">
<button className="touch-target-lg">
```

### TouchButton Component

```tsx
import { TouchButton } from '@/components/mobile';

<TouchButton variant="primary" size="md">
  Teruskan
</TouchButton>

<TouchButton variant="outline" loading loadingText="Memproses...">
  Hantar
</TouchButton>
```

---

## 📐 Layout Components

### MobileStack

Stacks vertically on mobile, horizontal on desktop.

```tsx
import { MobileStack } from '@/components/mobile';

<MobileStack gap="md">
  <Card>Left/Top</Card>
  <Card>Right/Bottom</Card>
</MobileStack>

// Reverse order on mobile
<MobileStack reverseOnMobile>
  <MainContent />
  <Sidebar />
</MobileStack>
```

### MobileGrid

Grid that collapses to single column on mobile.

```tsx
import { MobileGrid } from '@/components/mobile';

<MobileGrid cols={3} gap="md">
  <Card>1</Card>
  <Card>2</Card>
  <Card>3</Card>
</MobileGrid>
```

### MobileContainer

Responsive padding container.

```tsx
import { MobileContainer } from '@/components/mobile';

<MobileContainer maxWidth="lg" padding="md">
  <Content />
</MobileContainer>
```

### MobileBottomBar + Spacer

Sticky action bar for mobile CTAs.

```tsx
import { MobileBottomBar, MobileBottomSpacer } from '@/components/mobile';

<main>
  <Content />
  <MobileBottomSpacer />
</main>

<MobileBottomBar>
  <TouchButton fullWidth>Teruskan</TouchButton>
</MobileBottomBar>
```

---

## ⬆️ ScrollToTop

Floating scroll-to-top button for long pages.

```tsx
import { ScrollToTop } from '@/components/mobile';

// In layout or page
<ScrollToTop threshold={400} bottomOffset={80} />
```

---

## 🔧 CSS Utilities

### Visibility

```html
<!-- Mobile only (hidden on sm+) -->
<div class="mobile-only">Mobile menu</div>

<!-- Desktop only (hidden below sm) -->
<div class="desktop-only">Desktop sidebar</div>
```

### Text Truncation

```html
<p class="line-clamp-2">Long text that will truncate after 2 lines...</p>
```

### Safe Areas (iPhone notch, Android gesture bar)

```html
<div class="safe-container">Respects device safe areas</div>
<div class="safe-top safe-bottom">Manual safe area padding</div>
```

### Mobile Card

```html
<div class="mobile-card">
  Optimized card with responsive padding
</div>
```

---

## 📏 Form Input Guidelines

Mobile inputs automatically:
- Use 16px font size (prevents iOS zoom)
- Have 44px minimum height
- Support touch-friendly tap areas

```tsx
<input
  type="text"
  className="w-full min-h-touch rounded-lg border p-3"
  placeholder="Nama penuh"
/>
```

---

## 🧪 Testing Tools

### ViewportDebug

Shows current breakpoint during development.

```tsx
import { ViewportDebug } from '@/components/mobile';

// In layout.tsx (dev only)
<ViewportDebug position="bottom-right" />
```

### DeviceSimulator

Test specific device sizes.

```tsx
import { DeviceSimulator } from '@/components/mobile';

// Wrap page content
<DeviceSimulator device="android-small">
  <BuyerDashboard />
</DeviceSimulator>
```

Available devices:
- `iphone-se` (375×667)
- `iphone-14` (390×844)
- `android-small` (360×640) ← Malaysia default
- `android-mid` (412×915)
- `tablet` (768×1024)

---

## ✅ Testing Checklist

### Real Device Testing (Required)

- [ ] Low-end Android (Redmi, Realme, Oppo A-series)
- [ ] 4G connection (not WiFi)
- [ ] Chrome Android
- [ ] Screen size 360-412px

### Emulator Testing

- [ ] Chrome DevTools (360×640)
- [ ] Chrome DevTools (375×667)
- [ ] Safari Responsive Mode

### Accessibility

- [ ] Touch targets 44px minimum
- [ ] Focus states visible
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] `prefers-reduced-motion` respected

### Performance

- [ ] First Contentful Paint < 2s on 4G
- [ ] No layout shift on scroll
- [ ] Images lazy loaded
- [ ] Fonts don't block render

---

## 🚫 Anti-Patterns

### Don't Do This

```tsx
// ❌ Fixed widths on mobile
<div className="w-[400px]">

// ❌ Horizontal scroll on mobile
<div className="overflow-x-auto">

// ❌ Small touch targets
<button className="p-1 text-xs">

// ❌ Hover-only interactions
<div className="opacity-0 hover:opacity-100">
```

### Do This Instead

```tsx
// ✅ Responsive widths
<div className="w-full max-w-md">

// ✅ Stack on mobile
<div className="flex flex-col sm:flex-row">

// ✅ Touch-friendly
<button className="min-h-touch p-3">

// ✅ Always visible on mobile
<div className="opacity-100 sm:opacity-0 sm:hover:opacity-100">
```

---

## 📁 File Structure

```
components/mobile/
├── index.ts              # Barrel export
├── scroll-to-top.tsx     # Floating scroll button
├── touch-button.tsx      # Touch-optimized button
├── mobile-stack.tsx      # Layout components
└── viewport-debug.tsx    # Dev tools
```

---

*Last updated: Session 5 - Mobile-First Polish*
