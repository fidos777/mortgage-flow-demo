// app/layout.tsx
// BM-WIRE: Minimal root layout — provides html/body for all pages
// Landing page has its own navbar/footer, demo pages use (demo)/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Snang.my — Semak Kelayakan Rumah, Tanpa Leceh',
  description: 'Platform kesediaan pinjaman LPPSA untuk pembeli rumah, pemaju, dan ejen hartanah Malaysia.',
  openGraph: {
    title: 'Snang.my — Semak Kelayakan Rumah, Tanpa Leceh',
    description: 'Platform kesediaan pinjaman LPPSA. AI bantu, bukan ganti.',
    url: 'https://snang.my',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ms">
      <head>
        {/* BM-WIRE: Google Fonts for snang.my brand */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white font-body antialiased">
        {children}
      </body>
    </html>
  );
}
