# Snang Motion Guidelines v1

**Positioning:** Infrastructure-grade clarity. Not playful SaaS.

**Core principle:** Motion must signal state change, not decorate the brand. If motion does not communicate progress, confirmation, or system activity — it should not exist.

## Motion Philosophy

Snang is: LPPSA documentation pipeline, developer-facing, governance-aware, cashflow-sensitive.

Motion must feel: Calm, intentional, controlled, confident, subtle.

Avoid: Bounce, flash, repeated pulses, decorative loops, gimmick movement.

## Motion Hierarchy

### Tier 1 — Structural Motion (High Importance)

Used only when system state changes (case moves stage, QR link generated, document upload complete, status changes).

- Duration: 200–350ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- No overshoot, no elastic bounce

### Tier 2 — Narrative Motion (Landing Only)

Used in hero animation (chaos → clarity transitions, flow direction indicators, color sweep).

- Max 1 looping background animation
- Max 1 directional animation
- No simultaneous competing loops
- 12–14s total narrative cycle

### Tier 3 — Brand Motion (Very Rare)

Used only for first page load (Draw On) and major page transitions.

- Play once, never loop, never pulse continuously

## Logo Animation Rules

| Animation | Status | Usage |
|-----------|--------|-------|
| Draw On | Approved | First page load only, plays once |
| Static | Default | Navbar, dashboard, all other contexts |
| Flow Trace | Conditional | Dashboard pipeline visualization only (not logo) |
| Breathe | Rejected | Continuous peripheral motion = distraction |
| Glow Pulse | Rejected | Startup-y tone, wrong emotional register |
| Wave Morph | Rejected | Playful/consumer tone conflicts with fintech positioning |
| Stamp In | Rejected | Elastic overshoot too energetic for financial system |

**Rule:** The logo is a trust marker, not a loading spinner.

## Dashboard Motion Principles

Case movement: Subtle horizontal slide, 250ms ease, no bounce.
Status confirmation: Checkmark fade + slight scale 0.95 → 1, no glow, no fireworks.

## Color Sweep (Hero Only)

- Teal-based sweep, 270deg gradient, 14s slow animation
- No aggressive contrast shifts or sudden hue jumps
- Should feel like morning light changing — not nightclub lighting

## The Rule of Stillness

> If unsure: default to static. Stillness = confidence. Over-animation = insecurity.

## Litmus Test

Before adding any animation, ask: Does this motion explain progress, state, flow, or confirmation? If no → remove it.

## Emotional Calibration

Target: Notion-level calm, Stripe-level maturity, Linear-level precision.
Avoid: Duolingo, Revolut, Dribbble showcase.
