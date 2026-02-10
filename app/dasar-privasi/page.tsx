// app/dasar-privasi/page.tsx
// Privacy Policy Page (Dasar Privasi)

import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield, Lock, Eye, FileText, Server, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dasar Privasi — Snang.my',
  description: 'Dasar privasi dan perlindungan data peribadi untuk platform Snang.my',
}

export default function DasarPrivasiPage() {
  const sections = [
    {
      icon: <FileText className="w-5 h-5" />,
      title: 'Pengumpulan Data',
      content: `Kami mengumpul maklumat yang anda berikan secara sukarela semasa menggunakan platform Snang.my, termasuk:

• Maklumat peribadi (nama, nombor telefon, emel)
• Maklumat kewangan untuk pengiraan DSR (pendapatan, komitmen)
• Maklumat hartanah (projek, unit, harga)

Semua data dikumpul dengan persetujuan eksplisit anda melalui proses kebenaran PDPA.`
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: 'Penyulitan & Keselamatan',
      content: `Data anda dilindungi dengan:

• Penyulitan SSL 256-bit untuk semua penghantaran data
• Penyimpanan data yang disulitkan (encryption at rest)
• Kawalan akses berasaskan peranan (RBAC)
• Audit log untuk setiap akses data`
    },
    {
      icon: <Eye className="w-5 h-5" />,
      title: 'Penggunaan Data',
      content: `Data anda digunakan hanya untuk:

• Mengira kelayakan pinjaman LPPSA anda
• Memproses permohonan mortgage
• Berkomunikasi tentang status permohonan anda
• Memperbaiki perkhidmatan platform

Kami TIDAK menjual data anda kepada pihak ketiga.`
    },
    {
      icon: <Server className="w-5 h-5" />,
      title: 'Penyimpanan Data',
      content: `• Data disimpan di pelayan tempatan Malaysia
• Tempoh penyimpanan: Selama permohonan aktif + 7 tahun (mengikut keperluan LPPSA)
• Data boleh dipadam atas permintaan selepas permohonan selesai`
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: 'Hak Anda (PDPA 2010)',
      content: `Di bawah Akta Perlindungan Data Peribadi 2010, anda berhak:

• Mengakses data peribadi anda
• Membetulkan data yang tidak tepat
• Menarik balik persetujuan
• Meminta penghapusan data
• Mendapat salinan data anda

Untuk melaksanakan hak ini, hubungi kami di privacy@snang.my`
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: 'Kemaskini Dasar',
      content: `Dasar privasi ini mungkin dikemaskini dari semasa ke semasa. Perubahan ketara akan dimaklumkan melalui:

• Notifikasi dalam platform
• Emel kepada pengguna berdaftar

Tarikh kemaskini terakhir: 10 Februari 2026`
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Dasar Privasi</h1>
          <p className="text-white/80">
            Komitmen kami terhadap perlindungan data peribadi anda
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* PDPA Badge */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 flex items-center gap-3">
          <Shield className="w-8 h-8 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">Pematuhan PDPA 2010</p>
            <p className="text-sm text-green-700">
              Platform ini mematuhi Akta Perlindungan Data Peribadi 2010 Malaysia
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <div key={index} className="bg-white rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  {section.icon}
                </div>
                <h2 className="text-xl font-semibold text-neutral-900">{section.title}</h2>
              </div>
              <div className="text-neutral-600 whitespace-pre-line leading-relaxed">
                {section.content}
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 bg-primary/5 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-neutral-900 mb-2">Ada Soalan?</h3>
          <p className="text-neutral-600 mb-4">
            Jika anda mempunyai soalan tentang dasar privasi kami, sila hubungi:
          </p>
          <a
            href="mailto:privacy@snang.my"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            privacy@snang.my
          </a>
        </div>
      </div>
    </div>
  )
}
