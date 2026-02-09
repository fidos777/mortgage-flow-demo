# Progressive Disclosure Components Guide

**Session 2: Design Amendments v2.1**  
**Status:** Production-Ready  
**Feature Flag:** `NEXT_PUBLIC_ENABLE_PROGRESSIVE_DISCLOSURE`

---

## Overview

Progressive disclosure components are designed to reduce cognitive load by revealing information progressively as users interact with the interface. All components follow a strict principle: **content is ALWAYS in the DOM**, never conditionally rendered.

### Key Principles

- ✅ Content remains in DOM at all times (accessibility & compliance)
- ✅ Only CSS transforms control visibility/height
- ✅ No API calls on expand/collapse
- ✅ No analytics tracking
- ✅ Legal text remains visible for compliance
- ✅ SSR-friendly with hydration fixes

### Feature Flag

All components automatically respect `NEXT_PUBLIC_ENABLE_PROGRESSIVE_DISCLOSURE`:

```tsx
// If flag is false, components show all content expanded
if (!process.env.NEXT_PUBLIC_ENABLE_PROGRESSIVE_DISCLOSURE) {
  return <DefaultExpandedComponent />;
}
```

---

## Components

### 1. CollapsibleSection

A simple expand/collapse section with a header and content area.

**Usage:**

```tsx
import { CollapsibleSection } from '@/components/ui';

export function MyComponent() {
  return (
    <CollapsibleSection 
      title="Click to expand"
      defaultOpen={false}
      onToggle={(isOpen) => console.log('Toggled:', isOpen)}
    >
      <p>This content is always in the DOM</p>
      <p>Hidden with CSS, not conditionally rendered</p>
    </CollapsibleSection>
  );
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string \| ReactNode` | Required | Header text or element |
| `children` | `ReactNode` | Required | Content to show/hide |
| `defaultOpen` | `boolean` | `false` | Initial open state |
| `onToggle` | `(isOpen: boolean) => void` | - | Toggle callback |
| `className` | `string` | `''` | Custom CSS classes |
| `icon` | `ReactNode` | `<ChevronDown />` | Custom icon element |

**Features:**

- Smooth height/opacity animation (300ms)
- Chevron icon rotates on toggle
- Keyboard accessible (aria-expanded)
- SSR-safe

---

### 2. Accordion

Multiple collapsible items with optional single-open mode.

**Usage:**

```tsx
import { Accordion } from '@/components/ui';

export function FAQSection() {
  const items = [
    {
      id: 'q1',
      title: 'Question 1',
      content: <p>Answer 1</p>,
    },
    {
      id: 'q2',
      title: 'Question 2',
      content: <p>Answer 2</p>,
    },
  ];

  return (
    <Accordion
      items={items}
      allowMultiple={false}  // Only one open at a time
      defaultOpenIndex={0}   // First item open by default
      onOpenChange={(openIds) => console.log('Open:', openIds)}
      gap="md"
    />
  );
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `AccordionItem[]` | Required | Array of items |
| `allowMultiple` | `boolean` | `true` | Allow multiple open items |
| `defaultOpenIndex` | `number` | - | Initial open item index |
| `onOpenChange` | `(openItems: string[]) => void` | - | Change callback |
| `className` | `string` | `''` | Custom CSS classes |
| `gap` | `'sm' \| 'md' \| 'lg'` | `'md'` | Gap between items |

**AccordionItem:**

```tsx
interface AccordionItem {
  id: string;                      // Unique identifier
  title: string | ReactNode;       // Header text
  content: ReactNode;              // Content when expanded
  icon?: ReactNode;                // Optional custom icon
}
```

---

### 3. ExpandableCard

A card with preview and expandable full content. Commonly used for product cards, case summaries, etc.

**Usage:**

```tsx
import { ExpandableCard } from '@/components/ui';
import { Info } from 'lucide-react';

export function ProductCard() {
  return (
    <ExpandableCard
      title="Property Details"
      preview="2 bedroom, 800 sqft, RM450,000..."
      icon={<Info className="w-5 h-5 text-blue-600" />}
      expandLabel="Baca Lagi"
      collapseLabel="Tutup"
      defaultExpanded={false}
    >
      <p>Full property description and details...</p>
      <ul>
        <li>2 Bedrooms</li>
        <li>1 Bathroom</li>
        <li>Built-in Kitchen</li>
      </ul>
    </ExpandableCard>
  );
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string \| ReactNode` | Required | Card title |
| `preview` | `string \| ReactNode` | Required | Preview text when collapsed |
| `children` | `ReactNode` | Required | Full content when expanded |
| `icon` | `ReactNode` | - | Optional icon before title |
| `expandLabel` | `string` | `'Baca Lagi'` | "Read more" button text |
| `collapseLabel` | `string` | `'Tutup'` | "Close" button text |
| `defaultExpanded` | `boolean` | `false` | Initial expansion state |
| `onExpandChange` | `(isExpanded: boolean) => void` | - | Change callback |
| `className` | `string` | `''` | Custom CSS classes |

---

### 4. ReadMore

Inline text truncation with "Baca Lagi" / "Tutup" toggle.

**Usage:**

```tsx
import { ReadMore } from '@/components/ui';

export function BioSection() {
  const longText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit...`;

  return (
    <ReadMore
      text={longText}
      maxLength={150}
      expandLabel="Baca Lagi"
      collapseLabel="Tutup"
      className="mt-4"
      textClassName="text-sm text-slate-600"
    />
  );
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | Required | Full text content |
| `maxLength` | `number` | `150` | Max chars before truncation |
| `expandLabel` | `string` | `'Baca Lagi'` | Expand link text |
| `collapseLabel` | `string` | `'Tutup'` | Collapse link text |
| `defaultExpanded` | `boolean` | `false` | Initial state |
| `onExpandChange` | `(isExpanded: boolean) => void` | - | Change callback |
| `className` | `string` | `''` | Container CSS |
| `textClassName` | `string` | `''` | Text CSS |
| `linkClassName` | `string` | `''` | Link CSS |

**Features:**

- Truncates at word boundary (not mid-word)
- Smart space detection
- Full text always in DOM
- Inline toggle links

**Alternative: ReadMoreDisplay (Display-Only)**

For SSR scenarios where the toggle state is managed by the parent:

```tsx
import { ReadMoreDisplay } from '@/components/ui';

export function ParentComponent() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <ReadMoreDisplay
      text={longText}
      isExpanded={isExpanded}
      maxLength={150}
    />
  );
}
```

---

### 5. StepCards & StepProgress

Timeline/process step cards with expandable details.

**StepCards Usage:**

```tsx
import { StepCards, StepProgress } from '@/components/ui';
import { CheckCircle2 } from 'lucide-react';

export function LoanProcessFlow() {
  const steps = [
    {
      id: 'step1',
      title: 'Initial Assessment',
      description: 'Provide basic information',
      status: 'Completed',
      completed: true,
      details: (
        <div>
          <p>Step 1 details...</p>
        </div>
      ),
    },
    {
      id: 'step2',
      title: 'Document Verification',
      description: 'Upload required documents',
      status: 'In Progress',
      completed: false,
      details: (
        <div>
          <p>Step 2 details...</p>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Horizontal progress */}
      <StepProgress
        steps={steps}
        currentStep={1}
        onStepClick={(index, stepId) => console.log(`Step ${index} clicked`)}
        className="mb-8"
      />

      {/* Vertical step cards */}
      <StepCards
        steps={steps}
        currentStep={1}
        onStepClick={(index, stepId) => console.log(`Step ${index} clicked`)}
        allowMultiple={false}
        showStepNumbers={true}
        showTimeline={true}
      />
    </>
  );
}
```

**StepCards Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `steps` | `StepCardItem[]` | Required | Step array |
| `currentStep` | `number` | `0` | Active step index |
| `onStepClick` | `(index, id) => void` | - | Click callback |
| `allowMultiple` | `boolean` | `false` | Multiple expanded |
| `className` | `string` | `''` | Custom CSS |
| `showStepNumbers` | `boolean` | `true` | Show step numbers |
| `showTimeline` | `boolean` | `true` | Show timeline line |

**StepCardItem:**

```tsx
interface StepCardItem {
  id: string;                      // Unique identifier
  title: string | ReactNode;       // Step title
  description?: string | ReactNode;// Summary
  details?: ReactNode;             // Expanded details
  icon?: ReactNode;                // Optional custom icon
  completed?: boolean;             // Completion status
  status?: string;                 // Status badge text
}
```

**StepProgress Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `steps` | `StepCardItem[]` | Required | Step array |
| `currentStep` | `number` | `0` | Active step |
| `onStepClick` | `(index, id) => void` | - | Click callback |
| `className` | `string` | `''` | Custom CSS |

**Features:**

- Completed steps show green checkmark
- Active step has blue highlight
- Expandable details always in DOM
- Timeline connector between steps
- Progress indicator shows step number
- Both vertical (cards) and horizontal (progress) displays

---

## Styling & Customization

All components use **Tailwind CSS** with a consistent design system:

### Color Palette

- **Primary:** Blue (actions, active state)
- **Success:** Green (completed, done)
- **Neutral:** Slate (borders, text, backgrounds)
- **Hover States:** Lighter shade on hover

### Responsive Behavior

Components are responsive by default:

```tsx
// Works on all screen sizes
<CollapsibleSection title="..." />

// Custom responsive classes
<Accordion 
  items={items}
  className="grid grid-cols-1 md:grid-cols-2 gap-4"
/>
```

### Custom Styling

```tsx
import { CollapsibleSection } from '@/components/ui';

export function StyledSection() {
  return (
    <CollapsibleSection
      title="Custom Styled"
      className="border-2 border-blue-500 rounded-xl"
    >
      <p className="text-lg font-semibold">Custom content styles</p>
    </CollapsibleSection>
  );
}
```

---

## Accessibility

All components follow WCAG 2.1 AA standards:

### Keyboard Navigation

- `Enter` / `Space` - Toggle expand/collapse
- `Tab` - Navigate between items
- Focus visible on all interactive elements

### Screen Reader Support

- `aria-expanded` attribute on all toggles
- Semantic HTML (buttons, divs)
- Proper heading hierarchy

### Motion

Components use standard CSS transitions (not animation):

```tsx
// ~300ms ease-out for expand/collapse
transition-all duration-300 ease-out
```

Users with `prefers-reduced-motion` should have transitions removed via custom CSS:

```css
@media (prefers-reduced-motion: reduce) {
  .transition-all {
    transition: none;
  }
}
```

---

## Performance

### Content Always in DOM

Content is never conditionally rendered to prevent:

- Layout shift on expand/collapse
- Screen reader confusion
- Legal text being "hidden"
- Accessibility violations

Instead, we use CSS:

```tsx
// ✅ Good - content in DOM, hidden with CSS
<div style={{ maxHeight: isOpen ? '1000px' : '0px' }}>
  {children}
</div>

// ❌ Bad - content not in DOM
{isOpen && <div>{children}</div>}
```

### Animation Performance

- Uses `max-height` + `opacity` for smooth animations
- Runs on GPU-accelerated properties
- No expensive reflows during animation
- Minimal JavaScript (state management only)

### SSR Compatibility

All components handle hydration correctly:

```tsx
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return <ServerSideRender />;
}

return <ClientSideRender />;
```

---

## Feature Flag Integration

### Default Behavior

When `NEXT_PUBLIC_ENABLE_PROGRESSIVE_DISCLOSURE=true`:

```tsx
// Components work normally
<CollapsibleSection defaultOpen={false}>
  Hidden by default
</CollapsibleSection>
```

### Fallback Behavior

When `NEXT_PUBLIC_ENABLE_PROGRESSIVE_DISCLOSURE=false`:

```tsx
// Components show all content expanded
// (implement in parent or wrapper component)
const isProgressiveDisclosureEnabled = 
  process.env.NEXT_PUBLIC_ENABLE_PROGRESSIVE_DISCLOSURE === 'true';

<CollapsibleSection 
  defaultOpen={!isProgressiveDisclosureEnabled}
>
  Always visible
</CollapsibleSection>
```

---

## Common Patterns

### FAQ Section

```tsx
import { Accordion } from '@/components/ui';

export function FAQPage() {
  const faqs = [
    {
      id: 'faq-1',
      title: 'How does the process work?',
      content: <p>Step-by-step process...</p>,
    },
    // More items...
  ];

  return (
    <Accordion
      items={faqs}
      allowMultiple={false}
      gap="lg"
    />
  );
}
```

### Product Showcase

```tsx
import { ExpandableCard } from '@/components/ui';

export function ProductGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {products.map(product => (
        <ExpandableCard
          key={product.id}
          title={product.name}
          preview={`RM ${product.price}`}
          expandLabel="View Details"
          collapseLabel="Collapse"
        >
          <ProductDetails product={product} />
        </ExpandableCard>
      ))}
    </div>
  );
}
```

### Application Wizard

```tsx
import { StepCards, StepProgress } from '@/components/ui';

export function ApplicationWizard() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Enter your details',
      details: <PersonalForm />,
      completed: currentStep > 0,
    },
    {
      id: 'employment',
      title: 'Employment',
      description: 'Verify employment',
      details: <EmploymentForm />,
      completed: currentStep > 1,
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Final check',
      details: <ReviewForm />,
      completed: false,
    },
  ];

  return (
    <>
      <StepProgress steps={steps} currentStep={currentStep} />
      <StepCards
        steps={steps}
        currentStep={currentStep}
        onStepClick={(index) => setCurrentStep(index)}
      />
    </>
  );
}
```

---

## Compliance Notes

### Legal Text & Disclosures

All components are designed to keep legal text visible:

```tsx
// Legal text in accordion - always in DOM
<Accordion
  items={[
    {
      id: 'terms',
      title: 'Terms & Conditions',
      content: <LegalText />, // Always in DOM, never removed
    },
  ]}
/>
```

### Data Privacy

- No data is sent on expand/collapse
- No analytics events on interactions
- No user behavior tracking
- Content changes visible only client-side

---

## Troubleshooting

### Component Not Expanding

**Issue:** Collapsible section doesn't expand

**Solutions:**

1. Check that the component is mounted (`useEffect`)
2. Verify CSS classes are not overridden
3. Check console for errors
4. Ensure `maxHeight` is set high enough for content

```tsx
// If content is very tall, increase maxHeight
style={{ maxHeight: isOpen ? '3000px' : '0px' }}
```

### Animation Jerky

**Issue:** Expansion animation is not smooth

**Solutions:**

1. Remove conflicting CSS transitions
2. Reduce `maxHeight` value (lower = smoother)
3. Increase duration slightly

```tsx
style={{ maxHeight: isOpen ? '1500px' : '0px' }}
className="transition-all duration-400" // Increase from 300ms
```

### Content Flash on Load

**Issue:** Content flashes before collapsing on mount

**Solutions:**

1. Always use hydration fix (`useEffect` + `mounted`)
2. Provide SSR render during hydration phase
3. Don't set `defaultOpen={true}` on first render

---

## Changelog

### v1.0.0 (Current)

- Initial release
- 5 component types
- Full TypeScript support
- SSR-ready with hydration fixes
- WCAG 2.1 AA compliant
- Tailwind CSS styling

---

## References

- [Progressive Disclosure Pattern](https://en.wikipedia.org/wiki/Progressive_disclosure)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
