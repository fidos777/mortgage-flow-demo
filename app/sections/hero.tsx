// app/sections/hero.tsx
// Hero Section V7 — Framer Motion + Lucide + Glassmorphism
// Modern App Router architecture: data layer separated, motion-driven, GPU-accelerated
// 4-Act NarrativeEngine™: parties → chaos → transition → clarity (17s cycle)

'use client'

import { useState, useEffect, useRef, useCallback, useId } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, User, Users, Package, BarChart3, FileText,
  HelpCircle, Phone, MessageSquare, TrendingUp, Printer,
  Shield, CheckCircle2, LayoutGrid, ArrowRight, Info, Check,
  Lock, Clock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useLocale } from '@/app/context/locale'
import {
  COPY, SWEEPS, SCENES, DURATIONS, ACTOR_POS, NODE_SIZES, CHAOS_ROTATIONS,
  T, S, A,
  type SceneType, type SubtitleCfg, type IconName, type ChaosCard,
  type TransitionCard, type ClarityBeat, type LocaleCopy,
} from '@/app/components/hero/hero-data'

/* ─── ICON RESOLVER ─── */
const ICON_MAP: Record<IconName, LucideIcon> = {
  Package, BarChart3, FileText, HelpCircle, Phone,
  MessageSquare, TrendingUp, Users, Printer, Shield, CheckCircle2,
}

/* ─── ACTOR ICONS (Lucide) ─── */
const ACTOR_ICONS: LucideIcon[] = [Building2, User, Users]

/* ─── REDUCED MOTION HOOK ─── */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

/* ─── MOTION VARIANTS ─── */
const fadeIn = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}

/* Reserved for future scene variants */

/* ═══════════════════════════════════════════
   ARTIFACT CARD (Chaos layer cards)
   ═══════════════════════════════════════════ */
function ArtifactCard({ icon, label, sub, chaosActive }: {
  icon: IconName; label: string; sub: string; chaosActive?: boolean
}) {
  const Icon = ICON_MAP[icon]
  return (
    <div
      className="flex items-center gap-2 rounded-[10px] bg-white px-3 py-2 whitespace-nowrap"
      style={{
        border: chaosActive ? '1.5px solid rgba(245,158,11,0.4)' : `1px solid ${S[200]}`,
        boxShadow: chaosActive
          ? '0 4px 16px rgba(245,158,11,0.08)'
          : '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      <Icon size={16} className="shrink-0 text-slate-500" strokeWidth={1.8} />
      <div className="min-w-0">
        <div className="font-display text-[11px] font-semibold text-slate-800">{label}</div>
        <div className="font-body text-[9.5px] text-slate-400 overflow-hidden text-ellipsis max-w-[150px]">{sub}</div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   ACTOR NODE — Fixed position, scene-driven motion
   ═══════════════════════════════════════════ */
function ActorNode({ idx, label, desc, scene, chipText, reduced }: {
  idx: number; label: string; desc: string
  scene: SceneType; chipText?: string | null; reduced: boolean
}) {
  const Icon = ACTOR_ICONS[idx]
  const pos = ACTOR_POS[idx]
  const ns = NODE_SIZES[scene][idx]
  const isDev = idx === 0
  const isChaos = scene === 'chaos'
  const isClarity = scene === 'clarity'
  const isTransition = scene === 'transition'
  const isParties = scene === 'parties'
  const sweep = SWEEPS[scene]

  return (
    <motion.div
      className="absolute flex flex-col items-center z-[15]"
      style={{ left: pos.x, top: pos.y }}
      animate={{
        scale: isDev && isTransition ? 1.05 : 1,
        x: '-50%', y: '-50%',
      }}
      transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Pulse ring — clarity scene */}
      {isClarity && !reduced && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: ns.s + 14, height: ns.s + 14,
            border: `2px solid ${sweep.accent}${isDev ? '60' : '30'}`,
          }}
          animate={{ scale: [1, 1.6], opacity: [0.35, 0] }}
          transition={{
            duration: 2.5, repeat: Infinity, ease: 'easeOut',
            delay: isDev ? 1 : 1.5 + idx * 0.3,
          }}
        />
      )}

      {/* Developer glow — clarity/transition */}
      {isDev && (isClarity || isTransition) && !reduced && (
        <div
          className="absolute rounded-full"
          style={{
            width: ns.s + 24, height: ns.s + 24,
            background: `radial-gradient(circle, ${T[500]}12 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Node circle */}
      <motion.div
        className="flex items-center justify-center rounded-full"
        style={{
          width: ns.s, height: ns.s,
          background: `linear-gradient(145deg, ${T[50]}, white)`,
          border: `2px solid ${isDev ? T[500] : T[400]}`,
        }}
        animate={{
          boxShadow: isDev
            ? `0 8px 30px ${T[500]}20`
            : isClarity
              ? `0 6px 20px ${sweep.accentSoft}`
              : '0 4px 12px rgba(0,0,0,0.04)',
          rotate: isChaos && !isDev && !reduced ? [0, -2, 2, -1.5, 0.5, 0] : 0,
        }}
        transition={
          isChaos && !isDev
            ? { rotate: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.4 } }
            : { duration: 0.6 }
        }
      >
        <Icon size={ns.i} strokeWidth={1.8} className="text-teal-600" />
      </motion.div>

      {/* Label */}
      <motion.span
        className="font-display text-center max-w-[120px] mt-1.5"
        style={{ fontSize: `${ns.f}px` }}
        animate={{
          fontWeight: isDev ? 800 : isParties ? 700 : 600,
          color: isDev ? T[700] : isParties ? S[800] : T[700],
        }}
        transition={{ duration: 0.5 }}
      >
        {label}
      </motion.span>

      {/* Description */}
      <span
        className="font-body text-center max-w-[130px] leading-snug"
        style={{
          fontSize: isDev ? '11px' : '10.5px',
          color: isParties ? S[600] : S[700],
          fontWeight: isParties ? 600 : 500,
        }}
      >
        {desc}
      </span>

      {/* Dashboard chip — developer clarity */}
      {isDev && isClarity && chipText && (
        <motion.div
          className="mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
          style={{
            background: `linear-gradient(135deg, ${T[50]}, white)`,
            border: `1.5px solid ${T[300]}`,
            boxShadow: `0 2px 8px ${T[500]}15`,
          }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.4 }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-teal-500" style={{ boxShadow: `0 0 0 2px ${T[500]}25` }} />
          <span className="font-display text-[9.5px] font-semibold text-teal-700">{chipText}</span>
        </motion.div>
      )}
    </motion.div>
  )
}

/* ─── CONNECTION LINES (SVG — kept as native SVG animate for GPU perf) ─── */
function ConnectionLines({ scene, reduced, ns, sweep }: {
  scene: SceneType; reduced: boolean; ns: string; sweep: typeof SWEEPS.parties
}) {
  const ly = '64%'
  return (
    <svg className="absolute inset-0 w-full h-full z-[3] pointer-events-none">
      <defs>
        <linearGradient id={`${ns}-line`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sweep.lineStops[0]} stopOpacity={0.2} />
          <stop offset="50%" stopColor={sweep.lineStops[1]} stopOpacity={0.7} />
          <stop offset="100%" stopColor={sweep.lineStops[2]} stopOpacity={0.2} />
        </linearGradient>
        <linearGradient id={`${ns}-muted`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sweep.accentMuted} stopOpacity={0} />
          <stop offset="50%" stopColor={sweep.accentMuted} stopOpacity={0.35} />
          <stop offset="100%" stopColor={sweep.accentMuted} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Parties — arc connections */}
      {scene === 'parties' && <>
        <path d={`M 15% ${ly} Q 32.5% 44%, 50% ${ly}`} fill="none" stroke={`url(#${ns}-line)`} strokeWidth="2" strokeLinecap="round">
          {!reduced && <>
            <animate attributeName="stroke-dasharray" from="0 300" to="300 0" dur="0.8s" begin="0.4s" fill="freeze" />
            <animate attributeName="opacity" values="0.5;0.8;0.5" dur="4s" begin="1.2s" repeatCount="indefinite" />
          </>}
        </path>
        <path d={`M 50% ${ly} Q 67.5% 44%, 85% ${ly}`} fill="none" stroke={`url(#${ns}-line)`} strokeWidth="2" strokeLinecap="round">
          {!reduced && <>
            <animate attributeName="stroke-dasharray" from="0 300" to="300 0" dur="0.8s" begin="0.6s" fill="freeze" />
            <animate attributeName="opacity" values="0.5;0.8;0.5" dur="4s" begin="1.4s" repeatCount="indefinite" />
          </>}
        </path>
      </>}

      {/* Chaos — fragmented dashed lines */}
      {scene === 'chaos' && <>
        <line x1="17%" y1={ly} x2="48%" y2={ly} stroke={`url(#${ns}-muted)`} strokeWidth="1.3" strokeDasharray="6 4" opacity="0.4">
          {!reduced && <animate attributeName="stroke-dashoffset" from="0" to="20" dur="2s" repeatCount="indefinite" />}
        </line>
        <line x1="52%" y1={ly} x2="83%" y2={ly} stroke={`url(#${ns}-muted)`} strokeWidth="1.3" strokeDasharray="6 4" opacity="0.4">
          {!reduced && <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1.8s" repeatCount="indefinite" />}
        </line>
      </>}

      {/* Transition — flowing dashed */}
      {scene === 'transition' && <>
        <line x1="19%" y1={ly} x2="46%" y2={ly} stroke={`url(#${ns}-line)`} strokeWidth="2" strokeLinecap="round" strokeDasharray="8 4" opacity="0.7">
          {!reduced && <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.5s" repeatCount="indefinite" />}
        </line>
        <line x1="54%" y1={ly} x2="81%" y2={ly} stroke={`url(#${ns}-line)`} strokeWidth="2" strokeLinecap="round" strokeDasharray="8 4" opacity="0.7">
          {!reduced && <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.5s" repeatCount="indefinite" />}
        </line>
      </>}

      {/* Clarity — solid flow line + moving dots */}
      {scene === 'clarity' && <>
        <line x1="17%" y1={ly} x2="83%" y2={ly} stroke={`url(#${ns}-line)`} strokeWidth="3" strokeLinecap="round">
          {!reduced && <animate attributeName="stroke-dasharray" from="0 800" to="800 0" dur="1s" begin="0.2s" fill="freeze" />}
        </line>
        {!reduced && [0, 1, 2].map(i => (
          <circle key={i} r="4.5" fill={sweep.accent} opacity={0}>
            <animate attributeName="cx" values="17%;83%" dur={`${4.5 + i * 0.6}s`} begin={`${1.2 + i * 0.9}s`} repeatCount="indefinite" />
            <animate attributeName="cy" values={`${ly};${ly}`} dur={`${4.5 + i * 0.6}s`} begin={`${1.2 + i * 0.9}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.7;0.7;0" dur={`${4.5 + i * 0.6}s`} begin={`${1.2 + i * 0.9}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </>}
    </svg>
  )
}

/* ═══ CHAOS OVERLAY — Flex grid, motion-driven float ═══ */
function ChaosOverlay({ active, reduced, cards }: {
  active: boolean; reduced: boolean; cards: ChaosCard[]
}) {
  return (
    <motion.div
      className="absolute top-0 left-0 right-0 h-[44%] z-10 pointer-events-none flex flex-wrap justify-center content-center gap-1.5 px-3 py-2 overflow-hidden"
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence>
        {active && cards.map((card, i) => {
          const rot = CHAOS_ROTATIONS[i] || 0
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
              animate={{
                opacity: 1, scale: 1, rotate: rot,
                y: reduced ? 0 : [0, -(7 + (i % 3) * 3), 0],
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{
                opacity: { duration: 0.4, delay: i * 0.06 },
                scale: { duration: 0.5, delay: i * 0.06 },
                rotate: { duration: 0.5, delay: i * 0.06 },
                y: { duration: 3 + (i % 3), repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 },
              }}
              className="shrink-0"
            >
              <ArtifactCard {...card} chaosActive />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </motion.div>
  )
}

/* ═══ ARROW CONNECTOR — Visible line + animated dot from card to actor ═══ */
function ArrowConnector({ height, delay, color, reduced, active }: {
  height?: number; delay: number; color: string; reduced: boolean; active: boolean
}) {
  return (
    <div
      className="flex flex-col items-center relative"
      style={{
        height: height ?? undefined,
        flex: height == null ? 1 : undefined,
        minHeight: height == null ? 20 : undefined,
        opacity: active ? 1 : 0,
        transition: `opacity 0.4s ease ${delay}s`,
      }}
    >
      {/* Vertical line */}
      <div className="w-px h-full" style={{ background: `linear-gradient(to bottom, ${color}50, ${color}20)` }} />

      {/* Arrow head at bottom */}
      <svg width="10" height="7" viewBox="0 0 10 7" className="absolute -bottom-[3px]" style={{ fill: color, opacity: 0.5 }}>
        <polygon points="5,7 0,0 10,0" />
      </svg>

      {/* Animated flowing dots */}
      {!reduced && [0, 1, 2].map(d => (
        <motion.div
          key={d}
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{ background: color, width: 5, height: 5 }}
          animate={{ top: ['0%', '100%'], opacity: [0, 0.7, 0.7, 0] }}
          transition={{
            duration: 1.6 + d * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: delay + d * 0.5,
          }}
        />
      ))}
    </div>
  )
}

/* ═══ TRANSITION OVERLAY — Cards aligned above actors with arrow connectors ═══ */
function TransitionOverlay({ active, reduced, cards }: {
  active: boolean; reduced: boolean; cards: TransitionCard[]
}) {
  const cardX = ['15%', '50%', '85%']
  const CARD_TOP = '14%'
  // Wrapper stretches from CARD_TOP to just above each actor's circle top.
  // Actor center at 64%. Dev flex col ~118px centered → circle top ≈ 50%.
  // Buyer flex col ~100px → top ≈ 52%. Agent flex col ~85px → top ≈ 54%.
  // bottom = 100% - circleTop%
  const WRAPPER_BOTTOMS = ['50%', '47%', '45%'] // [developer, buyer, agent]

  return (
    <motion.div
      className="absolute inset-0 z-10 pointer-events-none"
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.4 }}
    >
      {cards.map((card, i) => (
        <motion.div
          key={i}
          className="absolute flex flex-col"
          style={{
            left: cardX[card.actorIdx],
            top: CARD_TOP,
            bottom: WRAPPER_BOTTOMS[card.actorIdx],
          }}
          initial={{ opacity: 0, x: '-50%' }}
          animate={{ opacity: active ? 1 : 0, x: '-50%' }}
          transition={{ duration: 0.45, delay: 0.15 + i * 0.12 }}
        >
          {/* Card */}
          <div
            className="shrink-0 flex items-center gap-2 rounded-[10px] bg-white/90 backdrop-blur-sm px-3 py-2"
            style={{
              width: 190,
              border: `1.5px solid ${T[400]}`,
              boxShadow: `0 4px 16px ${T[500]}10`,
            }}
          >
            <div
              className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0"
              style={{ background: T[600] }}
            >
              <Check size={11} strokeWidth={2.5} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-[10.5px] font-semibold text-slate-800 truncate">{card.label}</div>
              <div className="font-body text-[9px] text-teal-500 truncate">{card.sub}</div>
            </div>
          </div>

          {/* Arrow connector — flex:1 fills gap to actor */}
          <ArrowConnector
            delay={0.4 + i * 0.15}
            color={T[500]}
            reduced={reduced}
            active={active}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}

/* ═══ CLARITY OVERLAY — Snang badge + 3 outcome cards aligned to actors ═══ */
function ClarityOverlay({ active, reduced, sweep, beats, badgeText }: {
  active: boolean; reduced: boolean; sweep: typeof SWEEPS.parties
  beats: ClarityBeat[]; badgeText: string
}) {
  const cardX = ['15%', '50%', '85%']
  const CARD_TOP = '14%'
  // Dev has chip → taller flex col ~136px → circle top ≈ 48%. bottom = 52%.
  // Buyer flex col ~102px → top ≈ 52%. bottom = 48%. Agent ~87px → top ≈ 54%. bottom = 46%.
  const WRAPPER_BOTTOMS = ['52%', '47%', '45%'] // [developer, buyer, agent]

  return (
    <motion.div
      className="absolute inset-0 z-10 pointer-events-none"
      animate={{ opacity: active ? 1 : 0, filter: active ? 'blur(0px)' : 'blur(1px)' }}
      transition={{ duration: 0.5 }}
    >
      {/* Snang badge — top center */}
      <motion.div
        className="absolute top-[3%] left-1/2 z-[5]"
        initial={{ opacity: 0, x: '-50%', y: -8 }}
        animate={{ opacity: active ? 1 : 0, x: '-50%', y: active ? 0 : -8 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div
          className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${T[600]}, ${T[700]})`,
            boxShadow: `0 4px 20px ${sweep.accent}25`,
          }}
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <span className="font-display text-[10px] font-extrabold text-white">S</span>
          </div>
          <span className="font-display text-white font-semibold text-xs">Snang.my</span>
          <div className="w-px h-4 bg-white/20" />
          <Check size={13} strokeWidth={2.5} className="text-white" />
          <span className="font-display text-white font-semibold text-xs">{badgeText}</span>
        </div>
      </motion.div>

      {/* 3 outcome cards — aligned above actors */}
      {beats.map((beat, i) => {
        const isDev = beat.actorIdx === 0
        const BeatIcon = ICON_MAP[beat.icon]
        return (
          <motion.div
            key={i}
            className="absolute flex flex-col"
            style={{
              left: cardX[beat.actorIdx],
              top: CARD_TOP,
              bottom: WRAPPER_BOTTOMS[beat.actorIdx],
            }}
            initial={{ opacity: 0, x: '-50%' }}
            animate={{ opacity: active ? 1 : 0, x: '-50%' }}
            transition={{ duration: 0.45, delay: 0.25 + i * 0.12 }}
          >
            <div
              className="shrink-0 flex items-center gap-2 rounded-[10px]"
              style={{
                background: isDev ? `linear-gradient(145deg, ${T[50]}, white)` : 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(8px)',
                border: `1.5px solid ${isDev ? T[500] : T[300]}`,
                boxShadow: isDev ? `0 6px 24px ${sweep.accent}18` : `0 4px 16px ${sweep.accent}08`,
                width: isDev ? 210 : 185,
                padding: '8px 12px',
                height: 48,
              }}
            >
              <div
                className="rounded-full flex items-center justify-center shrink-0"
                style={{
                  width: isDev ? 22 : 18, height: isDev ? 22 : 18,
                  background: T[600],
                }}
              >
                <BeatIcon size={isDev ? 11 : 9} strokeWidth={2.5} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="font-display font-semibold text-teal-800" style={{ fontSize: isDev ? '10.5px' : '10px' }}>{beat.label}</div>
                <div className="font-body text-teal-500" style={{ fontSize: isDev ? '8.5px' : '8px' }}>{beat.sub}</div>
              </div>
            </div>

            {/* Arrow connector — flex:1 fills gap to actor */}
            <ArrowConnector
              delay={0.5 + i * 0.15}
              color={sweep.accent}
              reduced={reduced}
              active={active}
            />
          </motion.div>
        )
      })}
    </motion.div>
  )
}

/* ─── STEP INDICATOR (4 steps, bottom of stage) ─── */
function StepIndicator({ scene, steps, onClick }: {
  scene: SceneType; steps: { label: string }[]; onClick: (s: SceneType) => void
}) {
  const activeIdx = SCENES.indexOf(scene)
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-full px-4 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      {SCENES.map((s, i) => {
        const isActive = s === scene
        const isPast = i < activeIdx
        return (
          <button
            key={s}
            onClick={() => onClick(s)}
            className="flex items-center gap-2 border-none cursor-pointer rounded-full transition-all duration-300"
            style={{
              padding: isActive ? '5px 16px 5px 8px' : '5px',
              background: isActive ? T[600] : 'transparent',
            }}
          >
            <motion.div
              className="rounded-full"
              style={{ width: 10, height: 10 }}
              animate={{
                background: isActive ? '#fff' : isPast ? T[500] : S[300],
                boxShadow: isPast ? `0 0 0 2.5px ${T[500]}30` : '0 0 0 0px transparent',
              }}
              transition={{ duration: 0.3 }}
            />
            {isActive && (
              <motion.span
                className="font-display text-[12px] font-semibold text-white whitespace-nowrap"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                transition={{ duration: 0.25 }}
              >
                {steps[i].label}
              </motion.span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════
   ANIMATED STAGE — The client-side scene engine
   ═══════════════════════════════════════════ */
function AnimatedStage({ copy, reduced, scene, onSceneChange }: { copy: LocaleCopy; reduced: boolean; scene: SceneType; onSceneChange: (s: SceneType) => void }) {
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ns = useId().replace(/:/g, '')
  const sweep = SWEEPS[scene]

  const startCycleFrom = useCallback((startScene: SceneType) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    let idx = SCENES.indexOf(startScene)
    const next = () => {
      idx = (idx + 1) % 4
      onSceneChange(SCENES[idx])
      timerRef.current = setTimeout(next, DURATIONS[SCENES[idx]])
    }
    timerRef.current = setTimeout(next, DURATIONS[startScene])
  }, [onSceneChange])

  useEffect(() => {
    if (!paused) startCycleFrom(scene)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused])

  const handleStepClick = (s: SceneType) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setPaused(true)
    onSceneChange(s)
  }

  useEffect(() => {
    if (!paused) return
    const t = setTimeout(() => setPaused(false), 8000)
    return () => clearTimeout(t)
  }, [paused, scene])

  return (
    <motion.div
      className="hero-stage relative w-full max-w-[800px] h-[420px] mx-auto mt-7 rounded-3xl"
      style={{
        background: `linear-gradient(270deg, ${sweep.bg[0]}, ${sweep.bg[1]}, ${sweep.bg[2]})`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        backdropFilter: 'blur(2px)',
      }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7, ease: 'easeInOut' }}
    >
      {/* Inner gradient vignette — depth layer */}
      <div
        className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, transparent 50%, rgba(0,0,0,0.03) 100%)',
        }}
      />

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-3xl opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />

      {/* Subtle dot grid (reduced in clarity) — clipped to stage */}
      <motion.div
        className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl"
        style={{
          backgroundImage: `radial-gradient(${S[300]}18 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
        animate={{ opacity: scene === 'clarity' ? 0.15 : 0.3 }}
        transition={{ duration: 0.6 }}
      />

      {/* Connection lines */}
      <ConnectionLines scene={scene} reduced={reduced} ns={ns} sweep={sweep} />

      {/* Scene overlays */}
      <ChaosOverlay active={scene === 'chaos'} reduced={reduced} cards={copy.chaosCards} />

      {/* Parties title badge */}
      <AnimatePresence>
        {scene === 'parties' && (
          <motion.div
            className="absolute top-[10%] left-0 right-0 z-[12] flex justify-center"
            {...fadeIn}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div
              className="font-display text-[13px] font-bold text-white px-5 py-2 rounded-[10px] whitespace-nowrap"
              style={{
                background: T[600],
                boxShadow: `0 4px 16px ${T[600]}25`,
              }}
            >
              {copy.partiesTitle}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TransitionOverlay active={scene === 'transition'} reduced={reduced} cards={copy.transitionCards} />
      <ClarityOverlay active={scene === 'clarity'} reduced={reduced} sweep={sweep}
        beats={copy.clarityBeats} badgeText={copy.clarityBadge} />

      {/* Actor nodes — always visible, scene-driven appearance */}
      {ACTOR_ICONS.map((_, i) => (
        <ActorNode
          key={i} idx={i}
          label={copy.actors[i].label}
          desc={copy.actors[i].desc}
          scene={scene}
          reduced={reduced}
          chipText={i === 0 ? copy.dashboardChip : null}
        />
      ))}

      <StepIndicator scene={scene} steps={copy.steps} onClick={handleStepClick} />
    </motion.div>
  )
}

/* ═══════════════════════════════════════════
   PIPELINE PREVIEW — Below-fold data table
   ═══════════════════════════════════════════ */
/* ─── METRIC ICON RESOLVER ─── */
const METRIC_ICONS: Record<string, LucideIcon> = {
  Users, CheckCircle2, Clock, BarChart3,
}

function PipelinePreview({ copy }: { copy: LocaleCopy }) {
  const totalCases = copy.pipelineStatusDist.reduce((s, d) => s + d.count, 0)

  return (
    <section className="py-20 px-6 sm:px-8 bg-white" style={{ borderTop: `1px solid ${S[200]}` }}>
      <div className="max-w-[760px] mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 mb-4"
            style={{ background: T[50], border: `1.5px solid ${T[200]}` }}
          >
            <LayoutGrid size={14} strokeWidth={2} className="text-teal-600" />
            <span className="font-display text-xs font-semibold text-teal-700">Pipeline Dashboard</span>
          </div>
          <h2
            className="font-display font-extrabold tracking-tight mb-3"
            style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', color: S[900], letterSpacing: '-0.02em' }}
          >
            {copy.pipelineTitle}
          </h2>
          <p className="font-body text-[15px] text-slate-500 max-w-[520px] mx-auto leading-relaxed">
            {copy.pipelineSub}
          </p>
        </div>

        {/* Dashboard card */}
        <motion.div
          className="rounded-2xl overflow-hidden"
          style={{
            background: S[50],
            border: `1px solid ${S[200]}`,
            boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Project header — dark card */}
          <div
            className="p-5 sm:p-6 text-white"
            style={{ background: 'linear-gradient(135deg, #1E293B, #334155)' }}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-body text-[10px] uppercase tracking-widest mb-1" style={{ color: S[400] }}>Projek</div>
                <div className="font-display text-lg font-bold">{copy.pipelineProject.name}</div>
                <div className="font-body text-xs mt-0.5" style={{ color: S[400] }}>{copy.pipelineProject.location}</div>
              </div>
              <div className="text-right">
                <div className="font-body text-[10px] uppercase tracking-widest" style={{ color: S[400] }}>Jumlah Unit</div>
                <div className="font-display text-[28px] font-extrabold">{copy.pipelineProject.units}</div>
              </div>
            </div>
            {/* Summary row */}
            <div className="flex gap-8 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              {copy.pipelineSummary.map((s, i) => (
                <div key={i}>
                  <div className="font-body text-[10px]" style={{ color: S[400] }}>{s.label}</div>
                  <div className="font-display text-[22px] font-extrabold" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Metric cards row */}
          <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 1, background: S[200] }}>
            {copy.pipelineMetrics.map((m, i) => {
              const Icon = METRIC_ICONS[m.icon] || LayoutGrid
              return (
                <div key={i} className="bg-white p-4 text-center">
                  <div className="flex justify-between items-center mb-2">
                    <Icon size={16} strokeWidth={1.8} className="text-slate-400" />
                    <span className="font-body text-[10px]" style={{ color: S[400] }}>{m.sub}</span>
                  </div>
                  <div className="font-display text-2xl font-extrabold" style={{ color: S[900] }}>{m.value}</div>
                  <div className="font-body text-[11px] mt-0.5" style={{ color: S[500] }}>{m.label}</div>
                </div>
              )
            })}
          </div>

          {/* Status distribution + Performance metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 1, background: S[200] }}>
            {/* Status distribution */}
            <div className="bg-white p-5">
              <div className="font-display text-[13px] font-bold mb-3.5" style={{ color: S[800] }}>
                Taburan Status
              </div>
              {/* Stacked bar */}
              <div className="flex h-[18px] rounded-md overflow-hidden mb-3">
                {copy.pipelineStatusDist.filter(d => d.count > 0).map((d, i) => (
                  <motion.div
                    key={i}
                    style={{ flex: d.count, background: d.color, minWidth: d.count > 0 ? 20 : 0 }}
                    initial={{ flex: 0 }}
                    whileInView={{ flex: d.count }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 * i }}
                  />
                ))}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-x-3.5 gap-y-1.5">
                {copy.pipelineStatusDist.map((d, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm" style={{ background: d.color }} />
                    <span className="font-body text-[10px]" style={{ color: S[500] }}>{d.label}</span>
                    <span className="font-display text-[10px] font-bold" style={{ color: S[700] }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance metrics */}
            <div className="bg-white p-5">
              <div className="font-display text-[13px] font-bold mb-3.5" style={{ color: S[800] }}>
                Metrik Prestasi
              </div>
              <div className="flex flex-col gap-3">
                {copy.pipelinePerformance.map((p, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="font-body text-[11px]" style={{ color: S[600] }}>{p.label}</span>
                      <span className="font-display text-[11px] font-bold" style={{ color: S[800] }}>
                        {p.value}{p.unit === '%' ? '%' : ` ${p.unit}`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: S[200] }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: p.color }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(p.value / p.max) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.1 * i }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Privacy notice — matches real dashboard PRD 9.2 banner */}
          <div
            className="flex items-center gap-2.5 px-5 py-3"
            style={{ background: A[50], borderTop: `1px solid ${A[100]}` }}
          >
            <Lock size={14} strokeWidth={2} style={{ color: A[500], flexShrink: 0 }} />
            <span className="font-body text-[11px] font-medium leading-snug" style={{ color: A[500] }}>
              {copy.pipelinePrivacy}
            </span>
          </div>
        </motion.div>

        {/* Footer CTA */}
        <div className="text-center mt-8">
          <p className="font-body text-sm text-slate-500 italic mb-5">{copy.pipelineFooter}</p>
          <Link
            href="/listing"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-display text-[15px] font-semibold text-white no-underline transition-all duration-200 hover:brightness-110"
            style={{
              background: T[600],
              boxShadow: `0 4px 20px ${T[600]}30`,
            }}
          >
            <LayoutGrid size={16} strokeWidth={2} />
            {copy.pipelineCta}
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN HERO SECTION (V7: Motion + Lucide + Glass + 4-Act)
   ═══════════════════════════════════════════════════════════ */
export function HeroSection() {
  const { lang } = useLocale()
  const reduced = usePrefersReducedMotion()
  const copy = COPY[lang]
  const [scene, setScene] = useState<SceneType>('parties')

  return (
    <div className="font-body bg-slate-50 flex flex-col">
      {/* HERO */}
      <main className="flex flex-col items-center">
        {/* Pill badge */}
        <motion.div
          className="mt-9 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
          style={{
            background: T[50],
            border: `1.5px solid ${T[300]}`,
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-[7px] h-[7px] rounded-full bg-teal-500" style={{ boxShadow: `0 0 0 3px ${T[500]}25` }} />
          <span className="font-display text-[13px] font-semibold text-teal-700">{copy.pill}</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          key={`h-${lang}`}
          className="font-display font-extrabold text-center leading-[1.1] tracking-tighter mt-6"
          style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', color: S[900] }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {copy.headline1}<br />
          <span style={{ color: A[500] }}>{copy.headline2}</span>
        </motion.h1>

        {/* Subtitle — driven by AnimatedStage scene via shared state */}
        <SubtitleRenderer copy={copy} reduced={reduced} scene={scene} />

        {/* ANIMATED STAGE */}
        <AnimatedStage copy={copy} reduced={reduced} scene={scene} onSceneChange={setScene} />

        {/* CTA row */}
        <motion.div
          className="flex items-center gap-3.5 mt-7"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Link
            href="/listing"
            className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-display text-[15px] font-semibold text-white no-underline transition-all duration-200 hover:brightness-110 hover:shadow-lg"
            style={{
              background: T[600],
              boxShadow: `0 4px 20px ${T[600]}30`,
            }}
          >
            <LayoutGrid size={16} strokeWidth={2} />
            {copy.ctaPrimary}
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
          <Link
            href={lang === 'bm' ? '#bagaimana' : '#how-it-works'}
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-display text-sm font-medium text-slate-600 no-underline hover:text-slate-800 transition-colors"
          >
            <Info size={16} strokeWidth={2} />
            {copy.ctaSecondary}
          </Link>
        </motion.div>

        {/* Micro-copy */}
        <p className="font-body text-xs text-slate-400 mt-3.5 text-center max-w-[420px]">
          {copy.ctaMicro}
        </p>

        {/* Disclaimer */}
        <p className="font-body text-[10px] text-slate-300 mt-6 mb-0 text-center max-w-[400px]">
          {copy.disclaimer}
        </p>
      </main>

      {/* Below-fold Pipeline Preview */}
      <PipelinePreview copy={copy} />
    </div>
  )
}

/* ─── SUBTITLE (syncs with stage scene via lifted state) ─── */
const SUBTITLE_MAP: Record<SceneType, keyof Pick<LocaleCopy, 'subtitleParties' | 'subtitleChaos' | 'subtitleTransition' | 'subtitleClarity'>> = {
  parties: 'subtitleParties',
  chaos: 'subtitleChaos',
  transition: 'subtitleTransition',
  clarity: 'subtitleClarity',
}

const SUBTITLE_ACCENT: Record<SceneType, string> = {
  parties: T[600],
  chaos: A[500],       // amber/orange for chaos emphasis
  transition: T[600],
  clarity: T[600],
}

function SubtitleRenderer({ copy, reduced, scene }: { copy: LocaleCopy; reduced: boolean; scene: SceneType }) {
  return (
    <div className="mt-3.5 max-w-[520px] px-4" style={{ display: 'grid' }}>
      {/* All 4 subtitles occupy the same grid cell — container sizes to the tallest */}
      {SCENES.map(s => {
        const cfg = copy[SUBTITLE_MAP[s]]
        const isActive = s === scene
        return (
          <motion.p
            key={s}
            className="font-body text-[14px] sm:text-base text-slate-500 text-center leading-relaxed"
            style={{
              gridRow: 1,
              gridColumn: 1,
              visibility: isActive ? 'visible' : 'hidden',
              pointerEvents: isActive ? 'auto' : 'none',
            }}
            initial={false}
            animate={{
              opacity: isActive ? 1 : 0,
              y: isActive ? 0 : 4,
            }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            aria-hidden={!isActive}
          >
            {cfg.before || cfg.plain}
            <span className="font-semibold" style={{ color: SUBTITLE_ACCENT[s] }}>{cfg.accent}</span>
            {cfg.after}
          </motion.p>
        )
      })}
    </div>
  )
}
