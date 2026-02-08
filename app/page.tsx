// app/page.tsx
// BM-WIRE: snang.my marketing landing page
// Replaces current role-switcher landing. Demo moves to /demo route.
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Snang.my — Semak Kelayakan Rumah, Tanpa Leceh',
  description:
    'Platform kesediaan pinjaman LPPSA untuk pembeli rumah, pemaju, dan ejen hartanah. Semak kelayakan dalam 5 minit.',
  openGraph: {
    title: 'Snang.my — Semak Kelayakan Rumah, Tanpa Leceh',
    description: 'Platform kesediaan pinjaman LPPSA. AI bantu, bukan ganti.',
    url: 'https://snang.my',
    type: 'website',
  },
};

/* ─── PAIN POINT DATA ─── */
const pains = [
  {
    icon: '📋',
    title: 'Dokumen Tak Lengkap',
    desc: 'Punca utama permohonan LPPSA ditolak — dokumen missing atau format salah.',
  },
  {
    icon: '🔄',
    title: 'Ulang-Alik Tanpa Henti',
    desc: 'Ejen WhatsApp pembeli 5-6 kali untuk satu dokumen. Pembeli confuse dengan keperluan.',
  },
  {
    icon: '🔒',
    title: 'Tiada Visibility',
    desc: 'Pemaju tak tahu berapa pembeli sebenarnya ready. Pipeline jadi guessing game.',
  },
];

/* ─── PERSONA DATA ─── */
const personas = [
  {
    step: 1,
    role: 'Pemaju',
    color: 'teal-600',
    title: 'Pantau Pipeline Projek',
    desc: 'Lihat berapa pembeli di setiap stage — tanpa akses data individu. Privacy by design.',
    features: [
      'Dashboard agregat dengan conversion rates',
      'Generate link invitation untuk pembeli baru',
      'Proof events log untuk audit trail',
      'Tiada akses data individu (PRD 9.2)',
    ],
  },
  {
    step: 2,
    role: 'Pembeli',
    color: 'teal-500',
    title: 'Semak Kelayakan Sendiri',
    desc: 'Isi maklumat dalam 7 langkah. Dapat keputusan DSR serta-merta. Tahu status kesediaan.',
    features: [
      'PreScan 7 langkah dengan validasi real-time',
      'Pengiraan DSR automatik (isyarat kesediaan)',
      'Persetujuan PDPA direkod sebagai proof event',
      'Tiada login — akses melalui link unik',
    ],
  },
  {
    step: 3,
    role: 'Ejen',
    color: 'amber-500',
    title: 'Urus Kes Dengan Mudah',
    desc: 'Terima kes yang sudah ready. Copy data ke portal rasmi. Declare submission secara manual.',
    features: [
      'Dashboard kes dengan filter status',
      'Portal Submission Kit (4 langkah)',
      'TAC Attestation dengan timer 180s',
      'Ejen submit manual — AI bantu, bukan ganti',
    ],
  },
];

/* ─── TRUST DATA ─── */
const trustItems = [
  {
    icon: '🔐',
    title: 'PDPA Compliant',
    desc: 'Consent gate wajib sebelum mula. 4 jenis persetujuan direkod. Bilingual (BM/EN).',
  },
  {
    icon: '📜',
    title: 'Audit Trail',
    desc: 'Setiap tindakan direkod sebagai proof event dengan timestamp. Tiada action hilang.',
  },
  {
    icon: '👁️',
    title: 'Privacy by Design',
    desc: 'Pemaju hanya nampak agregat. Ejen hanya nampak julat. Data dilindungi mengikut peranan.',
  },
  {
    icon: '🤝',
    title: 'AI Bantu, Bukan Ganti',
    desc: 'Tiada auto-submit. Tiada keputusan automatik. Manusia decide, sistem bantu prepare.',
  },
];

/* ─── STEPS DATA ─── */
const steps = [
  {
    num: 1,
    title: 'Pemaju Cipta Link Invitation',
    desc: 'Pemaju generate link unik untuk projek mereka. Link ini dihantar kepada pembeli melalui WhatsApp, QR code, atau galeri jualan.',
    time: '2 minit',
  },
  {
    num: 2,
    title: 'Pembeli Semak Kelayakan',
    desc: 'Pembeli klik link, beri persetujuan PDPA, dan isi PreScan 7 langkah. Sistem kira DSR secara automatik.',
    time: '5 minit',
  },
  {
    num: 3,
    title: 'Ejen Proses Penghantaran',
    desc: 'Ejen terima kes ready-to-go. Guna Portal Submission Kit untuk review, draft, copy data ke portal LPPSA rasmi.',
    time: '8 minit',
  },
];

/* ═══════════════════════════════════════════ */
/* PAGE COMPONENT                              */
/* ═══════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/92 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-baseline font-semibold text-[22px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <span className="text-teal-600">Snang</span>
            <span className="text-amber-500">.</span>
            <span className="text-teal-600">my</span>
          </Link>
          <div className="flex items-center gap-8">
            <a href="#personas" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">
              Untuk Siapa
            </a>
            <a href="#how" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">
              Cara Guna
            </a>
            <a href="#trust" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">
              Keselamatan
            </a>
            <Link
              href="/buyer"
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all hover:-translate-y-0.5"
            >
              Cuba Demo →
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="pt-36 pb-24 px-6 bg-gradient-to-b from-teal-50 via-white to-amber-50/30 relative overflow-hidden">
        <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(13,148,136,0.06)_0%,transparent_70%)] pointer-events-none" />
        <div className="max-w-[800px] mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-teal-100 border border-teal-300 text-teal-700 px-4 py-1.5 rounded-full text-[13px] font-semibold mb-7">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            Platform Kesediaan LPPSA
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold leading-[1.15] text-teal-900 mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Semak{' '}
            <span className="bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
              Kelayakan Rumah
            </span>
            ,<br />
            Tanpa Leceh
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-[580px] mx-auto mb-9">
            Kami jadikan proses pinjaman rumah anda lebih senang — dari semakan pertama hingga penghantaran terakhir. Untuk pembeli, pemaju, dan ejen.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/buyer"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-base font-semibold px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(13,148,136,0.3)]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              Cuba Demo
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 text-teal-700 font-semibold text-base px-7 py-3.5 rounded-xl border-2 border-teal-300 hover:bg-teal-50 hover:border-teal-500 transition-all"
            >
              Lihat Cara Guna
            </a>
          </div>
          <p className="mt-6 text-[13px] text-slate-400">
            Percuma. Tiada pendaftaran diperlukan. Demo 5 minit.
          </p>
        </div>
      </section>

      {/* ─── PROOF BAR ─── */}
      <div className="bg-slate-50 border-y border-slate-200 py-6 px-6">
        <div className="max-w-[900px] mx-auto flex justify-center items-center gap-12 flex-wrap">
          {[
            { value: '80.5%', label: 'Kadar Kelulusan' },
            { value: '~400', label: 'Kes Sebulan' },
            { value: '5 min', label: 'Semakan DSR' },
            { value: '7', label: 'Jenis Pinjaman LPPSA' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-[28px] font-extrabold text-teal-600" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {s.value}
              </div>
              <div className="text-[13px] text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── PROBLEM ─── */}
      <section className="py-20 px-6">
        <div className="max-w-[900px] mx-auto">
          <p className="text-[13px] font-bold text-teal-600 uppercase tracking-[1.5px] mb-3">Masalah</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-teal-900 leading-tight mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Kenapa proses pinjaman rumah<br />masih leceh?
          </h2>
          <p className="text-[17px] text-slate-600 leading-relaxed max-w-[640px] mb-12">
            Pembeli keliru dengan borang. Ejen kejar dokumen. Pemaju tak nampak status. Semua ini boleh diselesaikan dengan aliran kerja yang tersusun.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {pains.map((p, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-6 hover:-translate-y-0.5 hover:shadow-md transition-all">
                <div className="text-[28px] mb-3">{p.icon}</div>
                <h4 className="font-semibold text-slate-800 mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PERSONAS ─── */}
      <section id="personas" className="py-20 px-6 bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-[1040px] mx-auto">
          <p className="text-[13px] font-bold text-teal-600 uppercase tracking-[1.5px] mb-3">Untuk Siapa</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-teal-900 leading-tight mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Satu platform, tiga peranan
          </h2>
          <p className="text-[17px] text-slate-600 leading-relaxed max-w-[640px] mb-12">
            Setiap stakeholder nampak apa yang relevan — dan hanya apa yang dibenarkan.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {personas.map((p) => (
              <div
                key={p.step}
                className="bg-white rounded-2xl border border-slate-200 p-8 relative overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all"
              >
                {/* Top accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  p.step === 1 ? 'bg-teal-600' : p.step === 2 ? 'bg-teal-500' : 'bg-amber-500'
                }`} />
                {/* Step number */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mb-4 ${
                  p.step === 1 ? 'bg-teal-600' : p.step === 2 ? 'bg-teal-500' : 'bg-amber-500'
                }`}>
                  {p.step}
                </div>
                <p className={`text-xs font-semibold uppercase tracking-[1px] mb-2 ${
                  p.step === 1 ? 'text-teal-600' : p.step === 2 ? 'text-teal-500' : 'text-amber-600'
                }`}>
                  {p.role}
                </p>
                <h3 className="text-[22px] font-bold text-teal-900 mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {p.title}
                </h3>
                <p className="text-[15px] text-slate-600 leading-relaxed mb-5">{p.desc}</p>
                <ul className="space-y-2.5">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 leading-snug">
                      <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] mt-0.5 ${
                        p.step === 3 ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'
                      }`}>
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how" className="py-20 px-6">
        <div className="max-w-[900px] mx-auto">
          <p className="text-[13px] font-bold text-teal-600 uppercase tracking-[1.5px] mb-3">Cara Guna</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-teal-900 leading-tight mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Tiga langkah. Satu aliran.
          </h2>
          <p className="text-[17px] text-slate-600 leading-relaxed max-w-[640px] mb-12">
            Aliran mengikut kausaliti data — pemaju cipta projek, pembeli semak kelayakan, ejen proses penghantaran.
          </p>
          <div className="relative pl-16">
            {/* Vertical line */}
            <div className="absolute left-6 top-12 bottom-12 w-0.5 bg-gradient-to-b from-teal-300 to-amber-300" />
            {steps.map((s) => (
              <div key={s.num} className="relative pb-12 last:pb-0">
                {/* Step circle */}
                <div className={`absolute -left-10 w-[50px] h-[50px] rounded-full flex items-center justify-center text-white text-xl font-extrabold z-10 ${
                  s.num === 1 ? 'bg-teal-600' : s.num === 2 ? 'bg-teal-500' : 'bg-amber-500'
                }`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {s.num}
                </div>
                <div className="ml-4">
                  <h4 className="text-xl font-bold text-teal-900 mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {s.title}
                  </h4>
                  <p className="text-[15px] text-slate-600 leading-relaxed">{s.desc}</p>
                  <span className="inline-block bg-slate-100 text-slate-500 text-xs font-semibold px-3 py-1 rounded-full mt-3">
                    ⏱ {s.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUST ─── */}
      <section id="trust" className="py-20 px-6 bg-teal-900 text-white">
        <div className="max-w-[900px] mx-auto text-center">
          <p className="text-[13px] font-bold text-teal-400 uppercase tracking-[1.5px] mb-3">Keselamatan & Pematuhan</p>
          <h2 className="text-3xl sm:text-4xl font-bold leading-tight mb-12" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Dibina dengan pematuhan dari hari pertama
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustItems.map((t, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-7">
                <div className="text-[32px] mb-4">{t.icon}</div>
                <h4 className="font-semibold text-teal-300 mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {t.title}
                </h4>
                <p className="text-[13px] text-slate-400 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-teal-50 text-center">
        <div className="max-w-[600px] mx-auto">
          <p className="text-[13px] font-bold text-teal-600 uppercase tracking-[1.5px] mb-3">Mula Sekarang</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-teal-900 leading-tight mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Lihat sendiri bagaimana ia berfungsi
          </h2>
          <p className="text-[17px] text-slate-600 leading-relaxed mb-9">
            Cuba demo interaktif kami — tiada pendaftaran, tiada komitmen. Lihat aliran penuh dari Pemaju hingga Ejen dalam 5 minit.
          </p>
          <Link
            href="/buyer"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold px-10 py-4 rounded-xl transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(13,148,136,0.3)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            Cuba Demo Sekarang
          </Link>
          <p className="mt-5 text-xs text-slate-400 leading-relaxed">
            Isyarat kesediaan sahaja — bukan kelulusan pinjaman.<br />
            Sistem ini untuk rujukan sahaja. Tiada penghantaran atau kelulusan dilakukan oleh sistem.
          </p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-slate-900 py-12 px-6 text-slate-400">
        <div className="max-w-[900px] mx-auto">
          <div className="flex flex-col sm:flex-row justify-between gap-8 mb-8">
            <div className="max-w-[300px]">
              <div className="font-semibold text-xl mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <span className="text-teal-500">Snang</span>
                <span className="text-amber-500">.</span>
                <span className="text-teal-500">my</span>
              </div>
              <p className="text-[13px] leading-relaxed">
                Platform kesediaan pinjaman LPPSA untuk pembeli rumah, pemaju, dan ejen hartanah Malaysia.
              </p>
            </div>
            <div className="flex gap-16 flex-wrap">
              <div>
                <h5 className="text-[13px] font-semibold text-slate-300 uppercase tracking-[0.5px] mb-3">Platform</h5>
                <div className="space-y-2">
                  <Link href="/buyer" className="block text-[13px] hover:text-teal-400 transition-colors">Cuba Demo</Link>
                  <a href="#personas" className="block text-[13px] hover:text-teal-400 transition-colors">Untuk Siapa</a>
                  <a href="#how" className="block text-[13px] hover:text-teal-400 transition-colors">Cara Guna</a>
                </div>
              </div>
              <div>
                <h5 className="text-[13px] font-semibold text-slate-300 uppercase tracking-[0.5px] mb-3">Syarikat</h5>
                <div className="space-y-2">
                  <a href="https://qontrek.com" className="block text-[13px] hover:text-teal-400 transition-colors">Qontrek.com</a>
                  <a href="#" className="block text-[13px] hover:text-teal-400 transition-colors">Dasar Privasi</a>
                  <a href="#" className="block text-[13px] hover:text-teal-400 transition-colors">Hubungi Kami</a>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.08] pt-6 flex flex-col sm:flex-row justify-between gap-3">
            <p className="text-[11px] text-slate-600">© 2026 SME Cloud Sdn Bhd. Hak cipta terpelihara. Isyarat kesediaan sahaja — bukan kelulusan pinjaman.</p>
            <p className="text-[11px] text-slate-600">
              Powered by <span className="text-teal-500">Qontrek Authority Engine</span> · PRD v3.6.1
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
