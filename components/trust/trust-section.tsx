'use client';

/**
 * @scope VISUAL ONLY - Presentation Layer
 * Full trust section for landing page.
 *
 * ⚠️ BOUNDARIES:
 * - VISUAL ONLY
 * - Does NOT make API calls
 * - Does NOT mutate backend state
 *
 * @see /docs/UI-AMENDMENTS.md
 */

import React from 'react';
import { Shield, Lock, Eye, FileCheck, Users, Server } from 'lucide-react';
import { AnimatedContainer } from '@/components/ui/animated-container';

// =============================================================================
// TYPES
// =============================================================================

interface TrustSectionProps {
  locale?: 'ms' | 'en';
  variant?: 'compact' | 'full';
}

// =============================================================================
// CONTENT
// =============================================================================

const content = {
  ms: {
    title: 'Keselamatan Data Anda',
    subtitle: 'Kami mengutamakan privasi dan keselamatan maklumat anda',
    badges: [
      {
        icon: Shield,
        title: 'PDPA 2010',
        description: 'Mematuhi Akta Perlindungan Data Peribadi Malaysia',
      },
      {
        icon: Lock,
        title: 'Penyulitan SSL',
        description: 'Semua data dihantar melalui sambungan selamat',
      },
      {
        icon: Eye,
        title: 'Tiada Jualan Data',
        description: 'Data anda tidak akan dijual kepada pihak ketiga',
      },
      {
        icon: FileCheck,
        title: 'Jejak Audit',
        description: 'Setiap akses direkod untuk akauntabiliti',
      },
      {
        icon: Users,
        title: 'Akses Terhad',
        description: 'Hanya pihak berkenaan dapat melihat dokumen',
      },
      {
        icon: Server,
        title: 'Pelayan Tempatan',
        description: 'Data disimpan di Malaysia',
      },
    ],
  },
  en: {
    title: 'Your Data Security',
    subtitle: 'We prioritize your privacy and information security',
    badges: [
      {
        icon: Shield,
        title: 'PDPA 2010',
        description: 'Compliant with Malaysia Personal Data Protection Act',
      },
      {
        icon: Lock,
        title: 'SSL Encryption',
        description: 'All data transmitted via secure connection',
      },
      {
        icon: Eye,
        title: 'No Data Selling',
        description: 'Your data will never be sold to third parties',
      },
      {
        icon: FileCheck,
        title: 'Audit Trail',
        description: 'Every access is logged for accountability',
      },
      {
        icon: Users,
        title: 'Limited Access',
        description: 'Only authorized parties can view documents',
      },
      {
        icon: Server,
        title: 'Local Servers',
        description: 'Data stored in Malaysia',
      },
    ],
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function TrustSection({ locale = 'ms', variant = 'full' }: TrustSectionProps) {
  // Feature flag check
  if (process.env.NEXT_PUBLIC_ENABLE_TRUST_UI === 'false') {
    return null;
  }

  const t = content[locale];

  if (variant === 'compact') {
    return (
      <section className="py-8 bg-blue-50/50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {t.badges.slice(0, 3).map((badge, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm"
              >
                <badge.icon className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-neutral-700">{badge.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="trust" className="py-16 bg-gradient-to-b from-blue-50/30 to-white">
      <div className="max-w-5xl mx-auto px-4">
        <AnimatedContainer>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-800">{t.title}</h2>
            <p className="mt-2 text-neutral-600">{t.subtitle}</p>
          </div>
        </AnimatedContainer>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {t.badges.map((badge, index) => (
            <AnimatedContainer key={index}>
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-neutral-100 hover:shadow-md transition-shadow text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                  <badge.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-neutral-800">{badge.title}</h3>
                <p className="mt-1 text-sm text-neutral-600">{badge.description}</p>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TrustSection;
