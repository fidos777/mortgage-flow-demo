#!/bin/bash
# Move language toggle from footer to navbar
# Run from mortgage-flow-demo directory

echo "🌐 Moving language toggle to navbar..."

# 1. NAVBAR with Language Toggle
cat > app/sections/navbar.tsx << 'ENDNAVBAR'
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight, Globe } from 'lucide-react'

function LanguageToggle() {
  const [lang, setLang] = useState<'bm' | 'en'>('bm')
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
    { href: '#personas', label: 'Untuk Siapa' },
    { href: '#how', label: 'Cara Guna' },
    { href: '#trust', label: 'Keselamatan' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-primary">Snang.my</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-neutral-600 hover:text-primary transition-colors">{link.label}</a>
            ))}
            
            {/* Language Toggle */}
            <LanguageToggle />
            
            {/* CTA Button */}
            <Link href="/buyer" className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
              Cuba Demo <ArrowRight className="w-4 h-4" />
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
              <Link href="/buyer" onClick={() => setIsMobileMenuOpen(false)} className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors">
                Cuba Demo <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
ENDNAVBAR
echo "✅ navbar.tsx (with language toggle)"

# 2. FOOTER without language toggle (cleaner)
cat > app/sections/footer.tsx << 'ENDFOOTER'
'use client'

import Link from 'next/link'
import { Shield, Globe } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()
  return (
    <footer className="bg-neutral-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block"><span className="text-2xl font-bold text-primary">Snang.my</span></Link>
            <p className="mt-3 text-neutral-400 text-sm leading-relaxed max-w-sm">Platform kesediaan pinjaman LPPSA untuk pembeli rumah, pemaju, dan ejen hartanah Malaysia.</p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-neutral-500 text-xs"><Shield className="w-4 h-4" /><span>SSL Secured</span></div>
              <div className="flex items-center gap-1.5 text-neutral-500 text-xs"><Globe className="w-4 h-4" /><span>PDPA Compliant</span></div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-neutral-300">Platform</h4>
            <ul className="space-y-2">
              <li><Link href="/buyer" className="text-neutral-400 hover:text-white text-sm transition-colors">Cuba Demo</Link></li>
              <li><Link href="/#personas" className="text-neutral-400 hover:text-white text-sm transition-colors">Untuk Siapa</Link></li>
              <li><Link href="/#how" className="text-neutral-400 hover:text-white text-sm transition-colors">Cara Guna</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-neutral-300">Syarikat</h4>
            <ul className="space-y-2">
              <li><a href="https://qontrek.com" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white text-sm transition-colors">Qontrek.com</a></li>
              <li><Link href="/dasar-privasi" className="text-neutral-400 hover:text-white text-sm transition-colors">Dasar Privasi</Link></li>
              <li><Link href="/hubungi-kami" className="text-neutral-400 hover:text-white text-sm transition-colors">Hubungi Kami</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <p className="text-neutral-500 text-xs text-center">© {currentYear} SME Cloud Sdn Bhd. Hak cipta terpelihara.</p>
        </div>
      </div>
    </footer>
  )
}
ENDFOOTER
echo "✅ footer.tsx (clean, no toggle)"

echo ""
echo "🎉 Language toggle moved to navbar!"
echo ""
echo "Now run: npm run build"
