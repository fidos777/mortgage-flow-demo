// app/layout.tsx
// Root Layout with Poppins font and global integrations
// Integrates: Poppins font, TrustStrip foundation, Animation provider

import type { Metadata, Viewport } from 'next'
import { Poppins, Plus_Jakarta_Sans, Inter } from 'next/font/google'
import './globals.css'

// ==========================================
// Font Configuration
// ==========================================

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

// ==========================================
// Metadata
// ==========================================

export const metadata: Metadata = {
  title: {
    default: 'Snang.my — Semak Kelayakan Rumah, Tanpa Leceh',
    template: '%s | Snang.my',
  },
  description: 'Platform kesediaan pinjaman LPPSA untuk pembeli rumah, pemaju, dan ejen hartanah Malaysia.',
  keywords: ['LPPSA', 'pinjaman rumah', 'kelayakan', 'pembiayaan', 'hartanah', 'Malaysia'],
  authors: [{ name: 'SME Cloud Sdn Bhd' }],
  creator: 'SME Cloud Sdn Bhd',
  publisher: 'SME Cloud Sdn Bhd',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://snang.my'),
  openGraph: {
    type: 'website',
    locale: 'ms_MY',
    url: 'https://snang.my',
    siteName: 'Snang.my',
    title: 'Snang.my — Semak Kelayakan Rumah, Tanpa Leceh',
    description: 'Platform kesediaan pinjaman LPPSA untuk pembeli rumah, pemaju, dan ejen hartanah Malaysia.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Snang.my — Semak Kelayakan Rumah, Tanpa Leceh',
    description: 'Platform kesediaan pinjaman LPPSA untuk pembeli rumah, pemaju, dan ejen hartanah Malaysia.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#1e40af',
}

// ==========================================
// Root Layout
// ==========================================

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="ms" 
      className={`${poppins.variable} ${jakarta.variable} ${inter.variable}`}
      // Animation tier will be set by client-side hook
      data-animation-tier="full"
    >
      <head>
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`
        font-sans antialiased
        bg-neutral-50 text-neutral-700
        min-h-screen
      `}>
        {/* Skip to main content (accessibility) */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg"
        >
          Langkau ke kandungan utama
        </a>

        {/* Main content wrapper */}
        <div id="main-content">
          {children}
        </div>

        {/* Portal root for modals */}
        <div id="modal-root" />
      </body>
    </html>
  )
}
