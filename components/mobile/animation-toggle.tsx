// components/mobile/animation-toggle.tsx
// Animation Toggle Component
// Allows users to enable/disable animations

'use client'

import { useAnimationToggle } from '@/lib/hooks/use-animation'
import { Play, Pause } from 'lucide-react'

export function AnimationToggle() {
  const { currentTier, toggle } = useAnimationToggle()
  const isOff = currentTier === 'none'

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 text-xs text-white/50 hover:text-white/70 transition-colors"
      aria-label={isOff ? 'Hidupkan animasi' : 'Matikan animasi'}
    >
      {isOff ? (
        <Play className="w-3 h-3" />
      ) : (
        <Pause className="w-3 h-3" />
      )}
      <span className="hidden sm:inline">
        Animasi: {isOff ? 'Mati' : 'Hidup'}
      </span>
    </button>
  )
}
