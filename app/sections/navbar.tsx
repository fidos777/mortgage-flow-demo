'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight, Globe } from 'lucide-react'
import { useLocale, type Locale } from '@/app/context/locale'
import { SnangLogo } from '@/components/snang-logo'

function LanguageToggle() {
  const { lang, setLang } = useLocale()
  return (
    <div className="inline-flex items-center gap-1 bg-neutral-100 rounded-full p-0.5">
      <button
        onClick={() => setLang('bm')}
        className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${lang === 'bm' ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
      >
        BM
      </button>
      <button
        onClick={() => setLang('en')}
        className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${lang === 'en' ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
      >
        EN
      </button>
    </div>
  )
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '#how', label: 'Cara Guna' },
    { href: '#trust', label: 'Keselamatan' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <SnangLogo size={28} animation="none" />
            <span className="font-display text-[18px] font-extrabold tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              <span className="text-primary">Snang</span>
              <span className="text-slate-400">.my</span>
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-neutral-600 hover:text-primary transition-colors">{link.label}</a>
            ))}
            
            {/* Language Toggle */}
            <LanguageToggle />
            
            {/* CTA Button */}
            <Link href="/listing" className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
              Lihat Demo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {/* Mobile: Language + Menu */}
          <div className="flex items-center gap-3 md:hidden">
            <LanguageToggle />
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-neutral-600 hover:text-primary" aria-label="Toggle menu">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-100 py-4">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-600 hover:text-primary transition-colors py-2">{link.label}</a>
              ))}
              <Link href="/listing" onClick={() => setIsMobileMenuOpen(false)} className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors">
                Lihat Demo <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
