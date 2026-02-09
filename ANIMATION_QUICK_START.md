# Animation Foundation - Quick Start Guide

## Installation & Setup

All files are already in place. No additional dependencies needed.

### File Locations

```
lib/
  hooks/
    use-animation.ts          # 5 custom hooks
    index.ts                  # Exports animation hooks
  animation-variants.ts       # 3 animation tiers

components/
  ui/
    animated-container.tsx    # 8 React components
    index.ts                  # Exports UI components
```

### Feature Flag

Already enabled in `.env.local`:
```bash
NEXT_PUBLIC_ENABLE_ANIMATION=true
```

## Quick Examples

### 1. Animate a Single Element

```tsx
import { AnimatedContainer } from '@/components/ui';

export function WelcomeCard() {
  return (
    <AnimatedContainer variant="slideUp">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1>Welcome to snang.my</h1>
        <p>Your mortgage journey starts here</p>
      </div>
    </AnimatedContainer>
  );
}
```

### 2. Animate a List

```tsx
import { StaggerContainer } from '@/components/ui';

export function PropertyList({ properties }) {
  return (
    <StaggerContainer childVariant="fadeIn" staggerDelay={100}>
      {properties.map(property => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </StaggerContainer>
  );
}
```

### 3. Animate on Scroll

```tsx
import { useAnimateOnScroll } from '@/lib/hooks';
import { AnimatedContainer } from '@/components/ui';

export function ScrollSection() {
  const { ref, isVisible } = useAnimateOnScroll();

  return (
    <AnimatedContainer ref={ref} animate={isVisible} variant="scaleIn">
      <div>This animates when scrolled into view</div>
    </AnimatedContainer>
  );
}
```

### 4. Check Device Capability

```tsx
import { useAnimationCapability } from '@/lib/hooks';

export function AnimationStatus() {
  const capability = useAnimationCapability();
  
  return (
    <div>
      {capability === 'full' && <p>Full animations enabled</p>}
      {capability === 'reduced' && <p>Reduced animations</p>}
      {capability === 'none' && <p>No animations</p>}
    </div>
  );
}
```

### 5. Conditional Animation

```tsx
import { ConditionalAnimation } from '@/components/ui';

export function DataDisplay({ isLoaded, data }) {
  return (
    <ConditionalAnimation when={isLoaded} variant="fadeIn">
      <div className="data-content">
        {/* Content only animates in when isLoaded = true */}
        {data && <p>{data.message}</p>}
      </div>
    </ConditionalAnimation>
  );
}
```

## Animation Variants

### Available Animations

```tsx
// Fade in (opacity change)
<AnimatedContainer variant="fadeIn">

// Slide up (vertical + fade)
<AnimatedContainer variant="slideUp">

// Slide left (horizontal + fade, moving from right)
<AnimatedContainer variant="slideLeft">

// Slide right (horizontal + fade, moving from left)
<AnimatedContainer variant="slideRight">

// Scale in (zoom + fade)
<AnimatedContainer variant="scaleIn">
```

### Timing

**Full Tier:**
- fadeIn: 300ms
- slideUp: 400ms
- slideLeft: 400ms
- slideRight: 400ms
- scaleIn: 300ms

**Reduced Tier:**
- fadeIn: 150ms
- slideUp: 200ms
- slideLeft: 200ms
- slideRight: 200ms
- scaleIn: 150ms

**None Tier:**
- All: 0ms (instant)

## Advanced Usage

### Custom Delay

```tsx
<AnimatedContainer 
  variant="slideUp" 
  delay={200}  // Wait 200ms before animating
>
  <Content />
</AnimatedContainer>
```

### Custom Initial State

```tsx
<AnimatedContainer 
  variant="slideUp"
  initial={{ opacity: 0.5, transform: 'translateY(20px)' }}
>
  <Content />
</AnimatedContainer>
```

### Custom Timing with Styles

```tsx
<AnimatedContainer 
  variant="slideUp"
  style={{ 
    perspective: '1000px',
    transformStyle: 'preserve-3d'
  }}
  className="custom-class"
>
  <Content />
</AnimatedContainer>
```

### Debug Mode

```tsx
<AnimatedContainer 
  variant="fadeIn" 
  debug={true}  // Logs animation state to console
>
  <Content />
</AnimatedContainer>
```

### Custom HTML Element

```tsx
<AnimatedContainer 
  as="section"  // Renders as <section> instead of <div>
  variant="slideUp"
>
  <Content />
</AnimatedContainer>
```

## Preset Components

### FadeInContainer

```tsx
import { FadeInContainer } from '@/components/ui';

<FadeInContainer>
  <Content />
</FadeInContainer>
```

### SlideUpContainer

```tsx
import { SlideUpContainer } from '@/components/ui';

<SlideUpContainer>
  <Card />
</SlideUpContainer>
```

### SlideLeftContainer

```tsx
import { SlideLeftContainer } from '@/components/ui';

<SlideLeftContainer>
  <Panel />
</SlideLeftContainer>
```

### SlideRightContainer

```tsx
import { SlideRightContainer } from '@/components/ui';

<SlideRightContainer>
  <Menu />
</SlideRightContainer>
```

### ScaleInContainer

```tsx
import { ScaleInContainer } from '@/components/ui';

<ScaleInContainer>
  <Modal />
</ScaleInContainer>
```

### StaggerContainer

```tsx
import { StaggerContainer } from '@/components/ui';

<StaggerContainer 
  childVariant="fadeIn"      // Animation for each child
  staggerDelay={75}          // Delay between items (ms)
>
  <Item />
  <Item />
  <Item />
</StaggerContainer>
```

### ConditionalAnimation

```tsx
import { ConditionalAnimation } from '@/components/ui';

<ConditionalAnimation 
  when={isReady}
  variant="slideUp"
>
  <Content />
</ConditionalAnimation>
```

## Hook API Reference

### useAnimationCapability()

```tsx
const capability = useAnimationCapability();
// Returns: 'full' | 'reduced' | 'none'

// Detects based on:
// - Device memory (< 4GB = reduced)
// - CPU cores (< 2 = reduced)
// - Connection (2G/3G = reduced)
// - prefers-reduced-motion (= none)
```

### useAnimationToggle()

```tsx
const { enabled, setEnabled, toggle } = useAnimationToggle();

// enabled: boolean - user preference
// setEnabled: (value: boolean) => void - set preference
// toggle: () => void - flip preference

// Stored in localStorage as 'snang-animations-enabled'
```

### useFPSMonitor(options)

```tsx
const { current, average, isDegraded } = useFPSMonitor({
  threshold: 30,        // FPS threshold (default: 30)
  sampleSize: 60,       // Frames to sample (default: 60)
  onDegraded: (fps) => {
    console.log(`FPS dropped to ${fps}`);
  }
});

// current: number - current frame rate
// average: number - average frame rate
// isDegraded: boolean - below threshold?
```

### useAnimateOnScroll(options)

```tsx
const { ref, isVisible } = useAnimateOnScroll({
  threshold: 0.1,       // When 10% visible (default: 0.1)
  rootMargin: '0px'     // Margin around viewport (default: '0px')
});

return (
  <div ref={ref}>
    {isVisible && <AnimatedContent />}
  </div>
);
```

### useAnimationState(enableFPSMonitoring)

```tsx
const {
  capability,      // 'full' | 'reduced' | 'none'
  userEnabled,     // boolean
  fpsData,         // { current, average, isDegraded }
  isAnimationSafe, // boolean - OK to animate?
  setUserEnabled,  // (value: boolean) => void
  toggleAnimation  // () => void
} = useAnimationState(false);  // true = monitor FPS
```

## Disabling Animations

### Globally

In `.env.local`:
```bash
NEXT_PUBLIC_ENABLE_ANIMATION=false
```

### Per Component

```tsx
<AnimatedContainer animate={false}>
  <Content />  {/* Won't animate */}
</AnimatedContainer>
```

### User Preference

```tsx
const { toggle } = useAnimationToggle();

<button onClick={toggle}>
  Toggle Animations
</button>
```

## Testing

### Test with Feature Flag Disabled

```bash
# Temporarily set in .env.local
NEXT_PUBLIC_ENABLE_ANIMATION=false
npm run dev
```

### Test with Reduced Motions

In browser DevTools:
```javascript
// Simulate prefers-reduced-motion
window.matchMedia = (query) => {
  if (query === '(prefers-reduced-motion: reduce)') {
    return { matches: true };
  }
  return { matches: false };
};
```

### Test with Debug Mode

```tsx
<AnimatedContainer debug={true} variant="slideUp">
  <Content />
</AnimatedContainer>

// Check browser console for logs
```

## Common Patterns

### Fade in on load

```tsx
<FadeInContainer>
  <PageContent />
</FadeInContainer>
```

### Slide up on scroll

```tsx
const { ref, isVisible } = useAnimateOnScroll();
<SlideUpContainer ref={ref} animate={isVisible}>
  <Card />
</SlideUpContainer>
```

### Stagger list items

```tsx
<StaggerContainer childVariant="slideUp">
  {items.map(item => <Item key={item.id} {...item} />)}
</StaggerContainer>
```

### Animate modal entrance

```tsx
<ScaleInContainer>
  <Modal />
</ScaleInContainer>
```

### Conditional form state

```tsx
<ConditionalAnimation when={submitted} variant="fadeIn">
  <SuccessMessage />
</ConditionalAnimation>
```

## Troubleshooting

### Animations not working

Check:
1. `NEXT_PUBLIC_ENABLE_ANIMATION=true` in .env.local
2. Component wrapped in AnimatedContainer
3. Variant name is valid
4. Browser supports CSS animations

### Animations stuttering

Check:
1. Use debug mode to check FPS
2. Reduce number of simultaneous animations
3. Use reduced tier (`useAnimationCapability` returns 'reduced')
4. Check useFPSMonitor output

### Animations not respecting prefers-reduced-motion

Check:
1. OS accessibility settings enabled
2. Browser supports media queries
3. useAnimationCapability returns 'none'

## Performance Tips

1. Use StaggerContainer instead of multiple Animate containers
2. Limit number of simultaneous animations
3. Use smaller stagger delays (50-100ms)
4. Test on low-end devices
5. Enable FPS monitoring in production

## Browser DevTools

### Inspect Animation

```html
<!-- Will have data attributes -->
<div data-animation="slideUp" data-capability="full">
  Content
</div>
```

### Console Logs (Debug Mode)

```tsx
<AnimatedContainer debug={true} variant="slideUp">
  // Check console for: [AnimatedContainer] slideUp - animating (capability: full)
</AnimatedContainer>
```

## Resources

- **Main Docs:** `ANIMATION_FOUNDATION.md`
- **Full Deliverables:** `SESSION_1_DELIVERABLES.md`
- **Code:** See `lib/hooks/use-animation.ts`, `lib/animation-variants.ts`, `components/ui/animated-container.tsx`

