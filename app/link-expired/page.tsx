import Link from 'next/link'
import { Clock, Home, AlertTriangle, RefreshCw, Mail } from 'lucide-react'

export function generateMetadata() {
  return {
    title: 'Pautan Tidak Sah | Snang.my',
    description: 'Pautan yang anda gunakan tidak sah atau telah tamat tempoh.',
  }
}

const errorReasons = {
  expired: { icon: Clock, title: 'Pautan Telah Tamat Tempoh', message: 'Pautan yang anda gunakan telah tamat tempoh. Sila hubungi pemaju atau ejen anda untuk mendapatkan pautan baharu.', code: 'LINK_EXPIRED' },
  invalid: { icon: AlertTriangle, title: 'Pautan Tidak Sah', message: 'Pautan yang anda gunakan tidak sah. Sila pastikan anda menggunakan pautan yang betul.', code: 'LINK_INVALID' },
  revoked: { icon: AlertTriangle, title: 'Pautan Telah Dibatalkan', message: 'Pautan ini telah dibatalkan oleh pemaju.', code: 'LINK_REVOKED' },
  error: { icon: AlertTriangle, title: 'Ralat Sistem', message: 'Terdapat ralat semasa memproses pautan anda.', code: 'SYSTEM_ERROR' },
}

export default function LinkExpiredPage({ searchParams }: { searchParams: { reason?: string } }) {
  const reason = (searchParams.reason as keyof typeof errorReasons) || 'invalid'
  const errorInfo = errorReasons[reason] || errorReasons.invalid
  const Icon = errorInfo.icon

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-800 mb-3">{errorInfo.title}</h1>
        <p className="text-neutral-600 mb-8">{errorInfo.message}</p>
        <Link href="/" className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
          <Home className="w-5 h-5" />
          Kembali ke Laman Utama
        </Link>
        <p className="text-xs text-neutral-400 mt-8">Kod rujukan: {errorInfo.code}</p>
      </div>
    </div>
  )
}
