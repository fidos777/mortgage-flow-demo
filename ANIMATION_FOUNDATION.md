# Session 1: Animation Foundation

## Implementation Summary

Created a complete animation capability detection and component system for the snang.my pilot.

### Files Created

#### 1. `lib/hooks/use-animation.ts` (360 lines)

Core animation hooks with performance-aware detection:

- **`useAnimationCapability()`** - Detects device animation capability tier
  - Returns: 'full' | 'reduced' | 'none'
  - Factors: device memory, CPU cores, connection speed, prefers-reduced-motion
  
- **`useAnimationToggle()`** - User preference management
  - Stores preference in localStorage
  - Respects NEXT_PUBLIC_ENABLE_ANIMATION flag
  - Methods: enabled, setEnabled, toggle
  
- **`useFPSMonitor(options)`** - Real-time frame rate monitoring
  - Auto-degrades animations if FPS < threshold (default: 30fps)
  - Configurable sample size and callback
  - Returns: current FPS, average FPS, isDegraded flag
  
- **`useAnimateOnScroll(options)`** - Scroll-triggered animations
  - Uses IntersectionObserver API
  - Returns: ref for attaching to elements, isVisible state
  - Configurable threshold and rootMargin
  
- **`useAnimationState(enableFPSMonitoring)`** - Combined animation state
  - Aggregates all hooks into single hook
  - Provides isAnimationSafe boolean
  - Useful for components needing complete control

**Boundaries (clearly documented):**
- Does NOT make API calls
- Does NOT send telemetry
- Does NOT persist to server
- Client-side detection only

#### 2. `lib/animation-variants.ts` (343 lines)

Three-tiered animation presets for CSS-based animations:

**Three Tiers:**

1. **Full Tier** - Standard animations, longer durations (300-600ms)
   - Best for: Desktop, modern browsers, good connectivity
   - Examples: fadeIn (300ms), slideUp (400ms), scaleIn (300ms)

2. **Reduced Tier** - Minimal animations, shorter durations (150-300ms)
   - Best for: Low-end devices, slow connections, accessibility
   - Examples: fadeIn (150ms), slideUp (200ms), scaleIn (150ms)

3. **None Tier** - Instant transitions (0ms)
   - Best for: prefers-reduced-motion, very low-end devices
   - No animation applied

**Animations Included:**
- fadeIn - Opacity transition
- slideUp - Vertical movement with fade
- slideLeft - Horizontal movement (right direction) with fade
- slideRight - Horizontal movement (left direction) with fade
- scaleIn - Zoom effect with fade
- staggerContainer - For batch animations
- staggerItem - Individual items in batch

**Utilities:**
- `getAnimationVariants(tier)` - Get all variants for a tier
- `getAnimationVariant(tier, variant)` - Get specific variant
- `TAILWIND_CONFIG_SNIPPET` - Ready-to-use Tailwind config with keyframes

#### 3. `components/ui/animated-container.tsx` (370 lines)

Production-ready animated wrapper component:

**Main Component:**
- `<AnimatedContainer>` - Flexible wrapper with full TypeScript support
  - Props: variant, className, style, children, animate, initial, delay, staggerIndex, debug, as
  - Automatically selects tier based on device capability
  - Respects NEXT_PUBLIC_ENABLE_ANIMATION flag
  - Graceful fallback when animations disabled

**Preset Components (convenience exports):**
- `<FadeInContainer>` - Pre-configured fade animation
- `<SlideUpContainer>` - Pre-configured slide up animation
- `<SlideLeftContainer>` - Pre-configured slide left animation
- `<SlideRightContainer>` - Pre-configured slide right animation
- `<ScaleInContainer>` - Pre-configured scale animation

**Advanced Components:**
- `<StaggerContainer>` - Automatically staggers children
  - Props: childVariant, staggerDelay, and all AnimatedContainerProps
  - Perfect for animating lists
  
- `<ConditionalAnimation>` - Conditional animation wrapper
  - Props: when (boolean condition) and all other AnimatedContainerProps
  - Animation plays only when condition is true

**Features:**
- ✓ Client-side rendered ('use client')
- ✓ Performance-aware (respects device capability)
- ✓ Accessibility-first (prefers-reduced-motion support)
- ✓ Debug mode for development
- ✓ React.forwardRef support for all components
- ✓ Proper TypeScript types
- ✓ CSS variable support for stagger delays
- ✓ Extensible for custom animations

#### 4. `components/ui/index.ts` (23 lines)

Barrel export for UI components:

```typescript
export {
  AnimatedContainer,
  FadeInContainer,
  SlideUpContainer,
  SlideLeftContainer,
  SlideRightContainer,
  ScaleInContainer,
  StaggerContainer,
  ConditionalAnimation,
  type AnimatedContainerProps,
} from './animated-container';
```

#### 5. `lib/hooks/index.ts` (40 lines)

Updated to export all animation hooks:

```typescript
export {
  useAnimationCapability,
  useAnimationToggle,
  useFPSMonitor,
  useAnimateOnScroll,
  useAnimationState,
  type AnimationCapability,
} from './use-animation';
```

### Feature Flag Integration

All components respect the `NEXT_PUBLIC_ENABLE_ANIMATION` environment variable:

```bash
# In .env.local
NEXT_PUBLIC_ENABLE_ANIMATION=true  # Enable animations (default)
NEXT_PUBLIC_ENABLE_ANIMATION=false # Disable all animations globally
```

### Usage Examples

#### Basic Animation
```tsx
import { AnimatedContainer } from '@/components/ui';

export function Welcome() {
  return (
    <AnimatedContainer variant="slideUp">
      <h1>Welcome to snang.my</h1>
    </AnimatedContainer>
  );
}
```

#### Animated List
```tsx
import { StaggerContainer } from '@/components/ui';

export function CardList({ items }) {
  return (
    <StaggerContainer childVariant="fadeIn" staggerDelay={100}>
      {items.map(item => (
        <Card key={item.id} {...item} />
      ))}
    </StaggerContainer>
  );
}
```

#### Conditional Animation
```tsx
import { ConditionalAnimation } from '@/components/ui';

export function LoadingContent({ isLoaded, data }) {
  return (
    <ConditionalAnimation when={isLoaded} variant="scaleIn">
      <DataDisplay data={data} />
    </ConditionalAnimation>
  );
}
```

#### Using Hooks Directly
```tsx
import { useAnimationCapability, useAnimationToggle } from '@/lib/hooks';

export function AnimationSettings() {
  const capability = useAnimationCapability();
  const { enabled, toggle } = useAnimationToggle();

  return (
    <div>
      <p>Device capability: {capability}</p>
      <button onClick={toggle}>
        {enabled ? 'Disable' : 'Enable'} Animations
      </button>
    </div>
  );
}
```

### Technical Details

**Framework:** React 18.3.1 + Next.js 16.1.6 + TypeScript 5.5.3

**No Dependencies Added:** Uses only React built-ins:
- useState, useEffect, useCallback, useRef for hooks
- React.forwardRef for component refs
- IntersectionObserver API (native browser)
- requestAnimationFrame API (native browser)

**CSS Implementation:** Works with:
- Inline styles (via style prop)
- Tailwind CSS (with provided config snippet)
- CSS Modules (compatible)
- Any CSS-in-JS solution

### Performance Considerations

- **Hydration Safe:** All components check `mounted` state before using browser APIs
- **SSR Compatible:** No window/navigator access until client-side
- **Memory Efficient:** FPS monitor uses refs to avoid unnecessary re-renders
- **Responsive:** Detects changes in device capability and prefers-reduced-motion

### Accessibility

- ✓ Respects `prefers-reduced-motion` media query
- ✓ Automatic fallback to 'none' tier for reduced-motion preference
- ✓ No animations block content or interaction
- ✓ All animations are optional enhancements

### Browser Support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- IntersectionObserver API: IE 11+ (with polyfill)
- requestAnimationFrame: IE 10+
- CSS animations: All modern browsers

### Next Steps

To use these animations in your components:

1. Import the components or hooks
2. Wrap content with `<AnimatedContainer>`
3. Add Tailwind config snippet if using Tailwind
4. Test with animation toggle and different device capabilities
5. Customize timing and transitions as needed

For more examples and integration guides, see `/docs/UI-AMENDMENTS.md`
