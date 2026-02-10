// app/sections/footer.tsx
// Footer Component
// Integrates: SSLBadge, LanguageToggle

'use client'

import Link from 'next/link'
import { Shield } from 'lucide-react'

// ==========================================
// Footer Links
// ==========================================

const footerLinks = {
  platform: [
    { label: 'Cuba Demo', href: '/buyer' },
    { label: 'Untuk Siapa', href: '/#personas' },
    { label: 'Cara Guna', href: '/#how' },
  ],
  company: [
    { label: 'Qontrek.com', href: 'https://qontrek.com', external: true },
    { label: 'Dasar Privasi', href: '/dasar-privasi' },
    { label: 'Hubungi Kami', href: '/hubungi-kami' },
  ],
}

// ==========================================
// Footer Component
// ==========================================

export function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="text-2xl font-bold">
              Snang.my
            </Link>
            <p className="text-white/70 mt-3 max-w-sm text-sm leading-relaxed">
              Platform kesediaan pinjaman LPPSA untuk pembeli rumah, 
              pemaju, dan ejen hartanah Malaysia.
            </p>
            <div className="flex items-center gap-1.5 mt-4 text-white/80">
              <Shield className="w-4 h-4" />
              <span className="text-sm">SSL Secured</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-white/70 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-4">Syarikat</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a 
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link 
                      href={link.href}
                      className="text-white/70 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-white/50">
            © 2026 SME Cloud Sdn Bhd. Hak cipta terpelihara.
          </div>

          <div className="flex items-center gap-4">
            {/* Powered by */}
            <span className="text-xs text-white/40">
              Powered by Qontrek Authority Engine
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
