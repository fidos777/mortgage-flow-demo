// app/sections/stats.tsx
// Stats Section with Count-Up Animation
// Integrates: useAnimationCapability, AnimatedContainer

'use client'

import { useEffect, useState, useRef } from 'react'
import { AnimatedContainer } from '@/components/ui/animated-container'
import { useAnimationCapability } from '@/lib/hooks/use-animation'

// ==========================================
// Count-Up Hook
// ==========================================

function useCountUp(
  target: number, 
  duration: number = 2000,
  startOnView: boolean = true
) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const animationTier = useAnimationCapability()

  useEffect(() => {
    if (!startOnView || animationTier === 'none') {
      setCount(target)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [startOnView, hasStarted, target, animationTier])

  useEffect(() => {
    if (!hasStarted) return

    const actualDuration = animationTier === 'reduced' ? duration / 2 : duration
    const steps = 60
    const stepValue = target / steps
    let current = 0

    const interval = setInterval(() => {
      current += stepValue
      if (current >= target) {
        setCount(target)
        clearInterval(interval)
      } else {
        setCount(Math.floor(current * 10) / 10)
      }
    }, actualDuration / steps)

    return () => clearInterval(interval)
  }, [hasStarted, target, duration, animationTier])

  return { count, ref }
}

// ==========================================
// Stat Card Component
// ==========================================

interface StatCardProps {
  value: number
  suffix?: string
  prefix?: string
  label: string
  delay?: number
}

function StatCard({ value, suffix = '', prefix = '', label, delay = 0 }: StatCardProps) {
  const { count, ref } = useCountUp(value, 2000)
  
  const formattedValue = Number.isInteger(value) 
    ? Math.floor(count) 
    : count.toFixed(1)

  return (
    <AnimatedContainer>
      <div 
        ref={ref}
        className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-sm border border-neutral-100 text-center min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink hover:shadow-md transition-shadow"
      >
        <div className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">
          {prefix}{formattedValue}{suffix}
        </div>
        <div className="text-sm text-neutral-600 mt-1">{label}</div>
      </div>
    </AnimatedContainer>
  )
}

// ==========================================
// Stats Section
// ==========================================

export function StatsSection() {
  const stats = [
    { value: 80.5, suffix: '%', label: 'Kadar Kelulusan', delay: 0 },
    { value: 5, suffix: ' min', label: 'Semakan DSR', delay: 100 },
    { value: 7, label: 'Jenis Pinjaman', delay: 200 },
  ]

  return (
    <section className="py-8 sm:py-12 bg-gradient-to-b from-blue-50/30 to-white">
      <div className="max-w-4xl mx-auto px-4">
        {/* Mobile: Horizontal scroll */}
        <div className="flex sm:hidden gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
          {stats.map((stat) => (
            <div key={stat.label} className="snap-start">
              <StatCard {...stat} />
            </div>
          ))}
        </div>
        
        {/* Desktop: Grid */}
        <div className="hidden sm:grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  )
}
