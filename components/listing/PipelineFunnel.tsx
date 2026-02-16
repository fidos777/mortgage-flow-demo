'use client'

import { useState } from 'react'

// ─── Types ───
export interface FunnelStage {
  id: string
  label: string
  count: number
  color: string      // hex color for the bar fill
  textColor: string  // hex color for text inside bar
}

// ─── Brand-aligned default stages ───
// Teal gradient = LPPSA progression (light → deep)
// Amber = completed / converted (CTA color per brand guidelines)
export const DEFAULT_STAGES: FunnelStage[] = [
  { id: 'screening',  label: 'Screening',  count: 0, color: '#99F6E4', textColor: '#115E59' },
  { id: 'documents',  label: 'Documents',  count: 0, color: '#5EEAD4', textColor: '#115E59' },
  { id: 'tac',        label: 'TAC',        count: 0, color: '#2DD4BF', textColor: '#FFFFFF' },
  { id: 'lokj',       label: 'LO / KJ',    count: 0, color: '#0D9488', textColor: '#FFFFFF' },
  { id: 'submitted',  label: 'Submitted',  count: 0, color: '#0F766E', textColor: '#FFFFFF' },
  { id: 'completed',  label: 'Completed',  count: 0, color: '#F59E0B', textColor: '#FFFFFF' },
]

interface PipelineFunnelProps {
  stages?: FunnelStage[]
  showFooter?: boolean
}

export function PipelineFunnel({ stages = DEFAULT_STAGES, showFooter = true }: PipelineFunnelProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const total = stages.reduce((s, st) => s + st.count, 0)

  return (
    <div>
      {/* Funnel bars */}
      <div className="space-y-1.5">
        {stages.map((stage, i) => {
          const funnelWidth = 100 - (i * 12) // 100%, 88%, 76%, 64%, 52%, 40%
          const isActive = stage.count > 0
          const isHover = hovered === stage.id
          const isCompleted = stage.id === 'completed'

          return (
            <div
              key={stage.id}
              className="relative flex items-center"
              onMouseEnter={() => setHovered(stage.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Stage label (left side) */}
              <div className="w-24 flex-shrink-0 text-right pr-3">
                <span className={`text-xs font-medium transition-colors ${
                  isHover ? 'text-teal-700' : 'text-slate-500'
                }`}>
                  {stage.label}
                </span>
              </div>

              {/* Funnel bar */}
              <div className="flex-1 flex justify-center">
                <div
                  className={`relative h-10 rounded-lg transition-all duration-300 cursor-pointer overflow-hidden ${
                    isHover ? 'shadow-md scale-[1.02]' : ''
                  }`}
                  style={{
                    width: `${funnelWidth}%`,
                    opacity: isActive ? 1 : 0.35,
                  }}
                >
                  {/* Gradient fill */}
                  <div
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: isCompleted
                        ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                        : `linear-gradient(135deg, ${stage.color}, ${stage.color}cc)`,
                    }}
                  />

                  {/* Subtle shimmer on active */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg opacity-20"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                      }}
                    />
                  )}

                  {/* Count + label inside bar */}
                  <div className="relative h-full flex items-center justify-center gap-2 px-3">
                    <span className="text-lg font-bold" style={{ color: stage.textColor }}>
                      {stage.count}
                    </span>
                    {isHover && stage.count > 0 && (
                      <span className="text-xs font-medium" style={{ color: stage.textColor + 'cc' }}>
                        {Math.round((stage.count / Math.max(total, 1)) * 100)}% of pipeline
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Connector arrow between stages */}
              {i < stages.length - 1 && (
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 z-10">
                  <svg width="8" height="6" viewBox="0 0 8 6" className="text-slate-200">
                    <path d="M4 6L0 0h8z" fill="currentColor" />
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer: conversion metrics + stage legend */}
      {showFooter && (
        <>
          <div className="border-t border-slate-100 mt-3 pt-4">
            {/* Conversion metrics */}
            <div className="flex items-center gap-4 mb-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Drop-off</p>
                <p className="text-sm font-semibold text-slate-700">
                  {total > 0 ? `${stages[0].count} → ${stages[stages.length - 1].count}` : '—'}
                </p>
              </div>
              <div className="w-px h-8 bg-slate-100" />
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Completion</p>
                <p className="text-sm font-semibold text-teal-600">
                  {total > 0
                    ? `${Math.round((stages[stages.length - 1].count / total) * 100)}%`
                    : '—'}
                </p>
              </div>
              <div className="w-px h-8 bg-slate-100" />
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Heaviest</p>
                <p className="text-sm font-semibold text-slate-700">
                  {(() => {
                    const max = stages.reduce((a, b) => a.count > b.count ? a : b)
                    return max.count > 0 ? max.label : '—'
                  })()}
                </p>
              </div>
            </div>

            {/* Stage dots legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {stages.map(s => (
                <div
                  key={s.id}
                  className={`flex items-center gap-1.5 transition-opacity ${
                    hovered && hovered !== s.id ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-xs text-slate-500">{s.label}</span>
                  <span className={`text-xs font-semibold ${
                    s.count > 0 ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
