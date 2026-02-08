// components/SnangLogo.tsx
// BM-2: Snang.my Logo Component
// Spec: DM Sans 600, "Snang.my" with teal text + amber dot
// Source: Confirmed logo selection (Option #12 variant, DM Sans 600)
'use client';

interface SnangLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'text-lg',    // 18px — footer, compact
  md: 'text-xl',    // 20px — navbar (default)
  lg: 'text-3xl',   // 30px — hero, splash
};

export function SnangLogo({ size = 'md', className = '' }: SnangLogoProps) {
  return (
    <span
      className={`font-logo font-semibold tracking-tight inline-flex items-baseline ${SIZES[size]} ${className}`}
    >
      <span className="text-snang-teal-600">Snang</span>
      <span className="text-snang-amber-500">.</span>
      <span className="text-snang-teal-600">my</span>
    </span>
  );
}

export default SnangLogo;
