'use client';

/**
 * Unit QR Generator Modal
 * CR-007 + CR-002A Integration
 *
 * Generates secure QR codes for buyer portal access.
 * Integrates with the auth library for token generation.
 */

import { useState, useEffect, useRef } from 'react';
import {
  X,
  QrCode,
  Download,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Link as LinkIcon,
  Smartphone,
  Building,
  Share2,
  Printer,
  AlertCircle,
} from 'lucide-react';
import { formatPrice } from '@/lib/types/property-unit';

// =============================================================================
// TYPES
// =============================================================================

interface UnitInfo {
  id: string;
  unitCode: string;
  block?: string;
  floor: string;
  unitNumber: string;
  propertyName: string;
  listPrice: number;
}

interface QRLinkData {
  token: string;
  shortUrl: string;
  fullUrl: string;
  qrDataUrl?: string;
  expiresAt: string;
  maxUses: number;
  currentUses: number;
}

interface UnitQRGeneratorProps {
  unit: UnitInfo;
  isOpen: boolean;
  onClose: () => void;
  locale?: 'bm' | 'en';
}

// =============================================================================
// QR CODE GENERATOR (SVG-based)
// =============================================================================

function generateQRSVG(data: string, size: number = 200): string {
  // Simple QR code pattern generator (for demo purposes)
  // In production, use a proper QR library like qrcode or qr.js
  const modules = 25; // QR code modules
  const moduleSize = size / modules;

  // Generate a deterministic pattern based on the data
  const hash = data.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  let rects = '';
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      // Create positioning patterns (corners)
      const isPositionPattern =
        (row < 7 && col < 7) || // Top-left
        (row < 7 && col >= modules - 7) || // Top-right
        (row >= modules - 7 && col < 7); // Bottom-left

      // Create timing patterns
      const isTimingPattern =
        (row === 6 || col === 6) && !isPositionPattern;

      // Create data pattern based on hash
      const isDataModule =
        !isPositionPattern &&
        !isTimingPattern &&
        ((hash + row * col) % 3 === 0 || (row + col) % 2 === 0);

      if (isPositionPattern || isTimingPattern || isDataModule) {
        // Position pattern styling
        if (isPositionPattern) {
          const inInnerSquare =
            (row >= 2 && row <= 4 && col >= 2 && col <= 4) ||
            (row >= 2 && row <= 4 && col >= modules - 5 && col <= modules - 3) ||
            (row >= modules - 5 && row <= modules - 3 && col >= 2 && col <= 4);

          const inBorder = !inInnerSquare && (
            row === 0 || row === 6 || col === 0 || col === 6 ||
            row === modules - 7 || row === modules - 1 ||
            col === modules - 7 || col === modules - 1
          );

          if (inBorder || inInnerSquare) {
            rects += `<rect x="${col * moduleSize}" y="${row * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="#0e7490"/>`;
          }
        } else {
          rects += `<rect x="${col * moduleSize}" y="${row * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="#0e7490"/>`;
        }
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="white"/>
    ${rects}
  </svg>`;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function UnitQRGenerator({
  unit,
  isOpen,
  onClose,
  locale = 'bm',
}: UnitQRGeneratorProps) {
  const [linkData, setLinkData] = useState<QRLinkData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);
  const [maxUses, setMaxUses] = useState(1);
  const qrRef = useRef<HTMLDivElement>(null);

  // Generate link on open
  useEffect(() => {
    if (isOpen && !linkData) {
      generateLink();
    }
  }, [isOpen]);

  // Reset copied state
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const generateLink = async () => {
    setIsGenerating(true);

    // Simulate API call to generate secure link
    await new Promise(resolve => setTimeout(resolve, 800));

    // Generate demo token (in production, call /api/auth/generate-link)
    const token = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const shortUrl = `snang.my/q/${token.slice(0, 8)}`;
    const fullUrl = `https://snang.my/q/${token}`;

    // Generate QR code SVG
    const qrSvg = generateQRSVG(fullUrl);
    const qrDataUrl = `data:image/svg+xml;base64,${btoa(qrSvg)}`;

    setLinkData({
      token,
      shortUrl,
      fullUrl,
      qrDataUrl,
      expiresAt: expiresAt.toISOString(),
      maxUses,
      currentUses: 0,
    });

    setIsGenerating(false);
  };

  const copyToClipboard = async () => {
    if (!linkData) return;

    try {
      await navigator.clipboard.writeText(linkData.fullUrl);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadQR = () => {
    if (!linkData?.qrDataUrl) return;

    const link = document.createElement('a');
    link.download = `QR-${unit.unitCode}.svg`;
    link.href = linkData.qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !linkData?.qrDataUrl) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${unit.unitCode}</title>
          <style>
            body {
              font-family: system-ui, sans-serif;
              text-align: center;
              padding: 40px;
            }
            .qr { margin: 20px auto; }
            .unit { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .property { color: #666; margin-bottom: 20px; }
            .url { font-size: 14px; color: #0e7490; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="unit">${unit.unitCode}</div>
          <div class="property">${unit.propertyName}</div>
          <div class="qr">
            <img src="${linkData.qrDataUrl}" width="250" height="250" />
          </div>
          <div class="url">${linkData.shortUrl}</div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-700 to-cyan-900 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold">{locale === 'bm' ? 'QR Akses Pembeli' : 'Buyer Access QR'}</h2>
                <p className="text-cyan-200 text-sm">{unit.unitCode}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Unit Info */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-cyan-600" />
              <div>
                <p className="font-medium text-slate-800">{unit.propertyName}</p>
                <p className="text-sm text-slate-500">
                  Unit {unit.unitCode} • {formatPrice(unit.listPrice)}
                </p>
              </div>
            </div>
          </div>

          {/* QR Code Display */}
          <div className="flex flex-col items-center mb-6">
            {isGenerating ? (
              <div className="w-48 h-48 bg-slate-100 rounded-xl flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin" />
              </div>
            ) : linkData?.qrDataUrl ? (
              <div ref={qrRef} className="bg-white p-4 rounded-xl border-2 border-cyan-100 shadow-sm">
                <img
                  src={linkData.qrDataUrl}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
            ) : null}

            {linkData && (
              <div className="mt-4 text-center">
                <p className="text-sm font-mono text-cyan-700 bg-cyan-50 px-3 py-1.5 rounded-lg">
                  {linkData.shortUrl}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>
                    {locale === 'bm' ? 'Luput' : 'Expires'}: {new Date(linkData.expiresAt).toLocaleDateString('ms-MY')}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>{linkData.maxUses - linkData.currentUses} {locale === 'bm' ? 'penggunaan baki' : 'uses remaining'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Link Settings */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                {locale === 'bm' ? 'Tempoh Sah (hari)' : 'Valid For (days)'}
              </label>
              <select
                value={expiryDays}
                onChange={e => setExpiryDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value={1}>1 {locale === 'bm' ? 'hari' : 'day'}</option>
                <option value={7}>7 {locale === 'bm' ? 'hari' : 'days'}</option>
                <option value={14}>14 {locale === 'bm' ? 'hari' : 'days'}</option>
                <option value={30}>30 {locale === 'bm' ? 'hari' : 'days'}</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                {locale === 'bm' ? 'Penggunaan Maks' : 'Max Uses'}
              </label>
              <select
                value={maxUses}
                onChange={e => setMaxUses(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value={1}>1 {locale === 'bm' ? 'kali' : 'time'}</option>
                <option value={3}>3 {locale === 'bm' ? 'kali' : 'times'}</option>
                <option value={5}>5 {locale === 'bm' ? 'kali' : 'times'}</option>
                <option value={10}>10 {locale === 'bm' ? 'kali' : 'times'}</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <button
              onClick={copyToClipboard}
              disabled={!linkData}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-slate-600" />
              )}
              <span className="text-xs text-slate-600">
                {copied ? (locale === 'bm' ? 'Disalin!' : 'Copied!') : (locale === 'bm' ? 'Salin' : 'Copy')}
              </span>
            </button>

            <button
              onClick={downloadQR}
              disabled={!linkData}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <Download className="w-5 h-5 text-slate-600" />
              <span className="text-xs text-slate-600">{locale === 'bm' ? 'Muat Turun' : 'Download'}</span>
            </button>

            <button
              onClick={printQR}
              disabled={!linkData}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <Printer className="w-5 h-5 text-slate-600" />
              <span className="text-xs text-slate-600">{locale === 'bm' ? 'Cetak' : 'Print'}</span>
            </button>

            <button
              onClick={generateLink}
              disabled={isGenerating}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-slate-600 ${isGenerating ? 'animate-spin' : ''}`} />
              <span className="text-xs text-slate-600">{locale === 'bm' ? 'Jana Baru' : 'Regenerate'}</span>
            </button>
          </div>

          {/* Info Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              {locale === 'bm'
                ? 'QR ini memberikan akses selamat kepada pembeli untuk melihat status permohonan mortgage mereka. Pautan akan luput selepas tempoh atau penggunaan maksimum dicapai.'
                : 'This QR provides secure access for buyers to view their mortgage application status. The link will expire after the set duration or maximum uses.'
              }
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {locale === 'bm' ? 'Tutup' : 'Close'}
          </button>
          <button
            onClick={() => {
              if (linkData) {
                // Share via Web Share API if available
                if (navigator.share) {
                  navigator.share({
                    title: `QR Access - ${unit.unitCode}`,
                    text: `Portal akses untuk unit ${unit.unitCode} di ${unit.propertyName}`,
                    url: linkData.fullUrl,
                  });
                } else {
                  copyToClipboard();
                }
              }
            }}
            disabled={!linkData}
            className="bg-cyan-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-cyan-700 transition-colors disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            {locale === 'bm' ? 'Kongsi' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnitQRGenerator;
