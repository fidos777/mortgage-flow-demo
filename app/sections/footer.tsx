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
