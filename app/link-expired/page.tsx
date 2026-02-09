'use client';

/**
 * CR-002A: Link Expired/Invalid Error Page
 *
 * /link-expired?reason=expired|revoked|invalid|exhausted
 *
 * Displays user-friendly error message in Bahasa Malaysia
 * with appropriate guidance based on denial reason.
 */

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { AlertCircle, Clock, Ban, XCircle, RefreshCw, Phone } from 'lucide-react';

type DenialReason = 'invalid' | 'expired' | 'revoked' | 'exhausted' | 'error';

interface ErrorContent {
  icon: React.ReactNode;
  title: string;
  titleEN: string;
  message: string;
  messageEN: string;
  action: string;
  actionEN: string;
}

const errorContent: Record<DenialReason, ErrorContent> = {
  invalid: {
    icon: <XCircle className="w-16 h-16 text-red-500" />,
    title: 'Pautan Tidak Sah',
    titleEN: 'Invalid Link',
    message: 'Pautan yang anda gunakan tidak sah atau tidak wujud dalam sistem kami.',
    messageEN: 'The link you used is invalid or does not exist in our system.',
    action: 'Sila hubungi ejen anda untuk mendapatkan pautan baharu.',
    actionEN: 'Please contact your agent to get a new link.',
  },
  expired: {
    icon: <Clock className="w-16 h-16 text-amber-500" />,
    title: 'Pautan Telah Tamat Tempoh',
    titleEN: 'Link Expired',
    message: 'Pautan ini telah tamat tempoh dan tidak boleh digunakan lagi.',
    messageEN: 'This link has expired and can no longer be used.',
    action: 'Sila minta pautan baharu daripada pemaju atau ejen anda.',
    actionEN: 'Please request a new link from your developer or agent.',
  },
  revoked: {
    icon: <Ban className="w-16 h-16 text-red-600" />,
    title: 'Pautan Telah Dibatalkan',
    titleEN: 'Link Revoked',
    message: 'Pautan ini telah dibatalkan oleh pemaju atau pentadbir.',
    messageEN: 'This link has been revoked by the developer or administrator.',
    action: 'Sila hubungi pemaju untuk maklumat lanjut.',
    actionEN: 'Please contact the developer for more information.',
  },
  exhausted: {
    icon: <RefreshCw className="w-16 h-16 text-orange-500" />,
    title: 'Had Penggunaan Dicapai',
    titleEN: 'Usage Limit Reached',
    message: 'Pautan ini telah mencapai had penggunaan maksimum yang dibenarkan.',
    messageEN: 'This link has reached its maximum allowed usage.',
    action: 'Sila minta pautan baharu jika anda perlu akses semula.',
    actionEN: 'Please request a new link if you need access again.',
  },
  error: {
    icon: <AlertCircle className="w-16 h-16 text-gray-500" />,
    title: 'Ralat Sistem',
    titleEN: 'System Error',
    message: 'Terdapat masalah teknikal semasa memproses permintaan anda.',
    messageEN: 'There was a technical issue processing your request.',
    action: 'Sila cuba sebentar lagi atau hubungi sokongan.',
    actionEN: 'Please try again later or contact support.',
  },
};

function LinkExpiredContent() {
  const searchParams = useSearchParams();
  const reason = (searchParams.get('reason') as DenialReason) || 'invalid';
  const content = errorContent[reason] || errorContent.invalid;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">{content.icon}</div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {content.title}
        </h1>
        <p className="text-sm text-slate-500 mb-6">{content.titleEN}</p>

        {/* Message */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <p className="text-slate-700 mb-2">{content.message}</p>
          <p className="text-sm text-slate-500">{content.messageEN}</p>
        </div>

        {/* Action */}
        <div className="bg-blue-50 rounded-lg p-4 mb-8 border border-blue-100">
          <p className="text-blue-800 font-medium mb-1">{content.action}</p>
          <p className="text-sm text-blue-600">{content.actionEN}</p>
        </div>

        {/* Contact Support */}
        <div className="space-y-3">
          <a
            href="https://wa.me/60123456789?text=Saya%20perlukan%20bantuan%20dengan%20pautan%20Snang.my"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <Phone className="w-5 h-5" />
            <span>Hubungi Kami via WhatsApp</span>
          </a>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <span>Kembali ke Laman Utama</span>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-400 mt-8">
          Snang.my - Platform Pembiayaan Perumahan Digital
        </p>
      </div>
    </div>
  );
}

export default function LinkExpiredPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-pulse text-slate-400">Memuatkan...</div>
        </div>
      }
    >
      <LinkExpiredContent />
    </Suspense>
  );
}

export function generateMetadata() {
  return {
    title: 'Pautan Tidak Sah | Snang.my',
    description: 'Pautan yang anda gunakan tidak sah atau telah tamat tempoh.',
  };
}
