// app/hubungi-kami/page.tsx
// Contact Us Page (Hubungi Kami)

import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin, Clock, MessageCircle, Building2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Hubungi Kami — Snang.my',
  description: 'Hubungi pasukan Snang.my untuk pertanyaan, sokongan, atau permohonan kerjasama',
}

export default function HubungiKamiPage() {
  const contactMethods = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Emel',
      value: 'hello@snang.my',
      href: 'mailto:hello@snang.my',
      description: 'Untuk pertanyaan umum',
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: 'WhatsApp',
      value: '+60 17-887 7788',
      href: 'https://wa.me/60178877788',
      description: 'Respons pantas dalam waktu kerja',
    },
    {
      icon: <Building2 className="w-6 h-6" />,
      title: 'Rakan Beta',
      value: 'beta@snang.my',
      href: 'mailto:beta@snang.my',
      description: 'Untuk pemaju berminat menjadi rakan beta',
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-primary text-white py-16">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Laman Utama
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Hubungi Kami</h1>
          <p className="text-white/80">
            Kami sedia membantu anda
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Contact Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {contactMethods.map((method, index) => (
            <a
              key={index}
              href={method.href}
              target={method.href.startsWith('http') ? '_blank' : undefined}
              rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-md hover:border-primary/30 transition-all group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                {method.icon}
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1">{method.title}</h3>
              <p className="text-primary font-medium mb-2">{method.value}</p>
              <p className="text-sm text-neutral-500">{method.description}</p>
            </a>
          ))}
        </div>

        {/* Company Info */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">Maklumat Syarikat</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">SME Cloud Sdn Bhd</p>
                <p className="text-sm text-neutral-500">No. Pendaftaran: 201301013530 (1043368-V)</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-600">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">Alamat Berdaftar</p>
                <p className="text-sm text-neutral-500">
                  Suite 09-10, Kenwingston Business Centre,<br />
                  Persiaran Bestari,<br />
                  63000 Cyberjaya, Selangor
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">Waktu Operasi</p>
                <p className="text-sm text-neutral-500">
                  Isnin - Jumaat: 9:00 pagi - 6:00 petang<br />
                  Sabtu, Ahad & Cuti Umum: Tutup
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Beta Partner CTA */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-8 text-white text-center">
          <h3 className="text-xl font-bold mb-3">Berminat Menjadi Rakan Beta?</h3>
          <p className="text-white/80 mb-6 max-w-md mx-auto">
            Kami sedang mencari pemaju hartanah untuk menyertai program Rakan Beta. Dapatkan akses awal dan harga istimewa.
          </p>
          <a
            href="mailto:beta@snang.my?subject=Permohonan%20Rakan%20Beta%20Snang.my"
            className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors"
          >
            <Mail className="w-5 h-5" />
            Mohon Sekarang
          </a>
        </div>

        {/* FAQ Link */}
        <div className="mt-8 text-center">
          <p className="text-neutral-600">
            Mempunyai soalan umum?{' '}
            <Link href="/#how" className="text-primary font-medium hover:underline">
              Lihat cara guna platform
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
