// components/developer/UnitQRGenerator.tsx
// Day 3: Wired to real /api/auth/generate-link API

'use client';

import { useState, useCallback } from 'react';
import { QrCode, Download, RefreshCw, Copy, Check, AlertTriangle, Globe } from 'lucide-react';

interface UnitQRGeneratorProps {
  propertyId: string;
  propertyName: string;
  unitId?: string;
  unitNo?: string;
  developerId: string;
  caseId?: string;
}

interface GeneratedLink {
  linkId: string;
  token: string;
  url: string;
  qrUrl: string | null;
  expiresAt: string;
  source: 'server' | 'local';
}

export function UnitQRGenerator({
  propertyId,
  propertyName,
  unitId,
  unitNo,
  developerId,
  caseId,
}: UnitQRGeneratorProps) {
  const [link, setLink] = useState<GeneratedLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateQR = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: caseId || null,
          propertyId,
          unitId: unitId || null,
          createdBy: developerId,
          accessType: 'buyer',
          scope: 'full',
          expiryDays: 7,
          maxUses: 50,
          generateQR: true,
        }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        setLink({
          linkId: json.data.linkId,
          token: json.data.token,
          url: json.data.url,
          qrUrl: json.data.qrUrl,
          expiresAt: json.data.expiresAt,
          source: 'server',
        });
      } else {
        console.warn('[QR] API failed, using local fallback:', json.error);
        const fallbackToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
        const fallbackUrl = `${window.location.origin}/q/${fallbackToken}`;
        const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fallbackUrl)}&format=svg`;

        setLink({
          linkId: 'local-' + Date.now(),
          token: fallbackToken,
          url: fallbackUrl,
          qrUrl: fallbackQrUrl,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          source: 'local',
        });
        setError('Dijana secara lokal — token ini tidak disimpan dalam pangkalan data.');
      }
    } catch (err) {
      console.error('[QR] Error:', err);
      setError('Gagal menjana kod QR. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  }, [caseId, propertyId, unitId, developerId]);

  const copyLink = useCallback(() => {
    if (!link) return;
    navigator.clipboard.writeText(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [link]);

  const downloadQR = useCallback(() => {
    if (!link?.qrUrl) return;
    const a = document.createElement('a');
    a.href = link.qrUrl;
    a.download = `qr-${propertyName.replace(/\s+/g, '-').toLowerCase()}${unitNo ? `-${unitNo}` : ''}.svg`;
    a.click();
  }, [link, propertyName, unitNo]);

  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center gap-2 mb-4">
        <QrCode className="w-5 h-5 text-teal-600" />
        <h3 className="font-semibold text-gray-900">Pautan QR Pembeli</h3>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
        <p className="font-medium text-gray-900">{propertyName}</p>
        {unitNo && <p className="text-gray-500">Unit {unitNo}</p>}
      </div>

      {!link ? (
        <button
          onClick={generateQR}
          disabled={loading}
          className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Menjana...
            </>
          ) : (
            <>
              <QrCode className="w-4 h-4" />
              Jana Kod QR
            </>
          )}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              link.source === 'server'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              <Globe className="w-3 h-3" />
              {link.source === 'server' ? 'Token Pelayan' : 'Token Lokal'}
            </span>
          </div>

          {link.qrUrl && (
            <div className="flex justify-center">
              <div className="bg-white border-2 border-gray-100 rounded-xl p-3">
                <img
                  src={link.qrUrl}
                  alt={`QR Code untuk ${propertyName}`}
                  className="w-48 h-48"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Pautan Akses</p>
            <div className="flex items-center gap-2">
              <code className="text-xs text-gray-700 truncate flex-1">
                {link.url}
              </code>
              <button
                onClick={copyLink}
                className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                title="Salin pautan"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Tamat tempoh: {new Date(link.expiresAt).toLocaleDateString('ms-MY', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
          </p>

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-700">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={downloadQR}
              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Muat Turun
            </button>
            <button
              onClick={() => { setLink(null); setError(null); }}
              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              Jana Semula
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
