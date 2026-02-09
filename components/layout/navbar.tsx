// components/layout/navbar.tsx
// Responsive Navbar Component
// Integrates: TouchButton, LanguageToggle (when enabled)

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight } from 'lucide-react'
import { TouchButton } from '@/components/mobile'

// ==========================================
// Navigation Links
// ==========================================

const navLinks = [
  { label: 'Untuk Siapa', href: '/#personas' },
  { label: 'Cara Guna', href: '/#how' },
  { label: 'Keselamatan', href: '/#trust' },
]

// ==========================================
// Navbar Component
// ==========================================

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">Snang.my</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-neutral-600 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language toggle placeholder - enable when i18n is ready */}
            {/* <LanguageToggle currentLocale="ms" /> */}
            
            <Link href="/buyer">
              <TouchButton variant="primary" size="sm">
                Cuba Demo
                <ArrowRight className="w-4 h-4" />
              </TouchButton>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 -mr-2 text-neutral-600 hover:text-neutral-900"
            aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="md:hidden py-4 border-t border-neutral-100">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 text-neutral-600 hover:text-primary hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              
              <div className="mt-4 px-4">
                <Link href="/buyer" onClick={() => setIsOpen(false)}>
                  <TouchButton variant="primary" size="md" className="w-full justify-center">
                    Cuba Demo
                    <ArrowRight className="w-4 h-4" />
                  </TouchButton>
                </Link>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
