'use client'

import { Sparkles, X } from 'lucide-react'
import { useState } from 'react'

export function AnimationToggle() {
  const [isOff, setIsOff] = useState(false)

  return (
    <button
      onClick={() => setIsOff(!isOff)}
      className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-300 transition-colors"
      aria-label={isOff ? 'Hidupkan animasi' : 'Matikan animasi'}
    >
      {isOff ? (
        <>
          <X className="w-3.5 h-3.5" />
          <span>Animasi: Mati</span>
        </>
      ) : (
        <>
          <Sparkles className="w-3.5 h-3.5" />
          <span>Animasi: Hidup</span>
        </>
      )}
    </button>
  )
}
