'use client';

/**
 * DemoFlowBar — v3.7.2 Demo Flow Navigation
 *
 * End-to-end walkthrough path for investor/partner demos.
 * Shows the complete flow: Booking → Pipeline → Action → Checklist
 * with clickable steps that navigate to the relevant page.
 *
 * Only visible in demo builds. Hidden in production.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Play, X } from 'lucide-react';

interface DemoStep {
  id: string;
  label: string;
  href: string;
  role: 'developer' | 'buyer' | 'agent';
  description: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: 'generate',
    label: 'Generate Link',
    href: '/listing',
    role: 'developer',
    description: 'Developer creates a shareable link for a project',
  },
  {
    id: 'consent',
    label: 'PDPA Consent',
    href: '/buyer/start',
    role: 'buyer',
    description: 'Buyer consents to data collection (mandatory)',
  },
  {
    id: 'selfcheck',
    label: 'Self-Check',
    href: '/buyer/self-check',
    role: 'buyer',
    description: 'Buyer runs DSR calculator for readiness signal',
  },
  {
    id: 'apply',
    label: 'Apply',
    href: '/buyer/apply',
    role: 'buyer',
    description: 'Buyer fills LPPSA application form (5 sections)',
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    href: '/listing',
    role: 'developer',
    description: 'Developer monitors aggregate pipeline status',
  },
  {
    id: 'agent',
    label: 'Agent Action',
    href: '/agent',
    role: 'agent',
    description: 'Agent manages case, schedules TAC, verifies docs',
  },
  {
    id: 'checklist',
    label: 'Checklist',
    href: '/buyer/journey',
    role: 'buyer',
    description: 'Document checklist per loan type — 15 doc types',
  },
];

const ROLE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  developer: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
  buyer: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  agent: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
};

export function DemoFlowBar() {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  if (dismissed) return null;

  // Determine which step is currently active based on pathname
  const activeIdx = DEMO_STEPS.findIndex(s => pathname?.startsWith(s.href) && s.href !== '/');

  if (!expanded) {
    return (
      <div className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-between">
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-2 text-xs text-slate-300 hover:text-white transition"
          >
            <Play className="w-3 h-3" />
            <span className="font-medium">Demo Flow</span>
            <span className="text-slate-500">— Click to see the end-to-end walkthrough</span>
          </button>
          <button onClick={() => setDismissed(true)} className="text-slate-500 hover:text-slate-300 transition">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border-b border-slate-700">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Play className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wide">Demo Walkthrough</span>
            <span className="text-xs text-slate-400">Booking → Pipeline → Action → Checklist</span>
          </div>
          <button onClick={() => setExpanded(false)} className="text-slate-400 hover:text-white text-xs transition">
            Collapse ↑
          </button>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {DEMO_STEPS.map((step, i) => {
            const colors = ROLE_COLORS[step.role];
            const isActive = i === activeIdx;
            return (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <Link
                  href={step.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    isActive
                      ? 'bg-teal-600 text-white border-teal-500 shadow-sm shadow-teal-500/20'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                  title={step.description}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : colors.dot}`} />
                    {step.label}
                  </div>
                </Link>
                {i < DEMO_STEPS.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-slate-600 mx-0.5 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Role legend */}
        <div className="flex items-center gap-4 mt-2">
          {Object.entries(ROLE_COLORS).map(([role, colors]) => (
            <div key={role} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
              <span className="text-xs text-slate-500 capitalize">{role === 'developer' ? 'Pemaju' : role === 'buyer' ? 'Pembeli' : 'Ejen'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
