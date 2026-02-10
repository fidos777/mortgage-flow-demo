import { Metadata } from 'next'
import Link from 'next/link'
import { 
  Shield, 
  Upload, 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock,
  Home,
  User,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Portal Pembeli | Snang.my',
  description: 'Semak kelayakan pinjaman LPPSA anda',
}

// Dummy data for demo
const propertyData = {
  name: 'Residensi Harmoni',
  developer: 'Global Fiz Resources Sdn Bhd',
  location: 'Seksyen 15, Shah Alam',
  unitType: 'Unit A-12-03',
  price: 'RM 385,000'
}

const consentData = {
  status: 'Diberikan',
  date: '1 Februari 2026',
  types: [
    'Pengumpulan data peribadi',
    'Pemprosesan untuk tujuan pinjaman',
    'Perkongsian dengan pihak berkaitan',
    'Penyimpanan rekod'
  ]
}

export default function BuyerPortalPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-primary">
              Snang.my
            </Link>
            <span className="text-sm text-neutral-500">Portal Pembeli</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 mb-6">
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">
            Selamat datang ke Portal Pembeli
          </h1>
          <p className="text-neutral-600">
            Semak kelayakan dan status permohonan pinjaman LPPSA anda.
          </p>
        </div>

        {/* Property Info Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Home className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-neutral-800">{propertyData.name}</h2>
              <p className="text-sm text-neutral-500">{propertyData.developer}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs bg-neutral-100 px-2 py-1 rounded-full">
                  {propertyData.location}
                </span>
                <span className="text-xs bg-neutral-100 px-2 py-1 rounded-full">
                  {propertyData.unitType}
                </span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                  {propertyData.price}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PDPA Consent Status - Shows date */}
        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-emerald-800">Persetujuan PDPA</h3>
                <span className="text-xs bg-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full">
                  {consentData.status}
                </span>
              </div>
              <p className="text-sm text-emerald-700">
                Diberikan pada: <strong>{consentData.date}</strong>
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {consentData.types.map((type, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {type}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Journey Options */}
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Pilihan Perjalanan</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Upload Documents */}
          <Link 
            href="/buyer/upload"
            className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 hover:shadow-md hover:border-primary/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold text-neutral-800 mb-1">Upload Dokumen</h4>
            <p className="text-sm text-neutral-500 mb-3">Mula hantar dokumen untuk permohonan</p>
            <span className="text-sm text-primary font-medium flex items-center gap-1">
              Mula Sini <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          {/* Readiness Scan */}
          <Link 
            href="/buyer/prescan"
            className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 hover:shadow-md hover:border-primary/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4 group-hover:bg-amber-100 transition-colors">
              <Search className="w-6 h-6 text-amber-600" />
            </div>
            <h4 className="font-semibold text-neutral-800 mb-1">Imbasan Kesediaan</h4>
            <p className="text-sm text-neutral-500 mb-3">Pre-check kelayakan (optional)</p>
            <span className="text-sm text-amber-600 font-medium flex items-center gap-1">
              Cuba Sekarang <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          {/* Full Application */}
          <Link 
            href="/buyer/journey"
            className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 hover:shadow-md hover:border-primary/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-neutral-800 mb-1">Permohonan Penuh</h4>
            <p className="text-sm text-neutral-500 mb-3">Document upload & TAC scheduling</p>
            <span className="text-sm text-blue-600 font-medium flex items-center gap-1">
              Teruskan <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          {/* KJ Confirmation */}
          <Link 
            href="/buyer/kj-confirm"
            className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-100 hover:shadow-md hover:border-primary/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center mb-4 group-hover:bg-violet-100 transition-colors">
              <CheckCircle2 className="w-6 h-6 text-violet-600" />
            </div>
            <h4 className="font-semibold text-neutral-800 mb-1">Pengesahan KJ</h4>
            <p className="text-sm text-neutral-500 mb-3">Kelulusan Jenis verification</p>
            <span className="text-sm text-violet-600 font-medium flex items-center gap-1">
              Sahkan <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {/* Privacy Disclosure */}
        <div className="bg-neutral-100 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Apa yang anda boleh lihat
          </h3>
          <ul className="space-y-2 mb-6">
            {[
              'Status permohonan semasa',
              'Dokumen yang telah diupload',
              'Timeline progress',
              'Langkah seterusnya'
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-neutral-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>

          <h3 className="font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <EyeOff className="w-5 h-5" />
            Apa yang tidak ditunjukkan
          </h3>
          <ul className="space-y-2">
            {[
              'Skor kredit penuh / breakdown',
              'Risk flag dalaman',
              'Keputusan bank sebelum rasmi',
              'Data pembeli lain'
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-neutral-500">
                <span className="w-4 h-4 rounded-full bg-neutral-300 flex items-center justify-center text-xs text-white">✕</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Demo Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-sm text-amber-700">
            <strong>Demo Mode:</strong> Data contoh sahaja. Tiada penghantaran sebenar dilakukan.
          </p>
        </div>
      </main>
    </div>
  )
}
