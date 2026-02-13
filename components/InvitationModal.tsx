'use client';

import { useState, useRef } from 'react';
import { LinkIcon, X, Upload, Copy, Check, Download, QrCode } from 'lucide-react';

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectLocation: string;
}

export function InvitationModal({ isOpen, onClose, projectName, projectLocation }: InvitationModalProps) {
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo mesti kurang daripada 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Sila muat naik fail imej (PNG, JPG)');
      return;
    }

    setLogo(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generateLink = () => {
    if (!companyName.trim()) {
      alert('Sila masukkan nama pemaju / syarikat');
      return;
    }

    const code = `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const params = new URLSearchParams({
      dev: companyName.trim(),
      project: projectName,
      code: code,
      logo: logo ? 'stored' : 'none',
    });

    const link = `https://snang.my/buyer/prescan?${params.toString()}`;
    setGeneratedLink(link);
    setQrLoaded(false);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = generatedLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    if (!generatedLink) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(generatedLink)}`;
    const safeName = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `qr-${safeName}.png`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleClose = () => {
    setGeneratedLink(null);
    setCopied(false);
    setQrLoaded(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        {/* Sticky Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Cipta Pautan Jemputan</h2>
              <p className="text-xs text-slate-500">{projectName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Logo Pemaju{' '}
              <span className="text-slate-400 font-normal ml-1">(Pilihan)</span>
            </label>

            {!logoPreview ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="w-full border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-teal-300 hover:bg-teal-50 transition-all cursor-pointer block"
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">
                    Klik untuk muat naik logo
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG (max 2MB)</p>
                </label>
              </>
            ) : (
              <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-16 h-16 object-contain rounded-lg bg-white border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-700 truncate">
                      {logo?.name}
                    </p>
                    <button
                      onClick={handleRemoveLogo}
                      className="text-xs text-red-500 hover:text-red-700 mt-1"
                    >
                      Buang logo
                    </button>
                  </div>
                  <Check className="w-5 h-5 text-green-500 shrink-0" />
                </div>
              </div>
            )}
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nama Pemaju / Syarikat <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="cth: Seven Sky Development Sdn Bhd"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Property Info */}
          <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
            <Building2Icon className="w-5 h-5 text-slate-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-700">{projectName}</p>
              <p className="text-xs text-slate-500">{projectLocation}</p>
            </div>
          </div>

          {/* Generate Button */}
          {!generatedLink && (
            <button
              onClick={generateLink}
              disabled={!companyName.trim()}
              className="w-full py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed text-sm"
            >
              Jana Pautan
            </button>
          )}

          {/* Generated Link + QR Code */}
          {generatedLink && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-green-700">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Pautan berjaya dijana!</span>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="relative">
                  {!qrLoaded && (
                    <div className="w-40 h-40 bg-slate-100 rounded-xl animate-pulse flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-slate-300" />
                    </div>
                  )}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(generatedLink)}`}
                    alt="QR Code"
                    className={`rounded-xl ${qrLoaded ? 'block' : 'hidden'}`}
                    onLoad={() => setQrLoaded(true)}
                    width={160}
                    height={160}
                  />
                </div>
              </div>

              {/* Link Display */}
              <div className="bg-white border border-green-300 rounded-lg p-3">
                <p className="text-xs text-slate-600 break-all font-mono">{generatedLink}</p>
              </div>

              {/* Action Buttons - Side by Side */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-900 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Disalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Salin Pautan
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadQR}
                  className="flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Muat Turun QR
                </button>
              </div>

              <p className="text-xs text-green-600 text-center">
                💡 Pembeli akan melihat logo dan nama pemaju anda dalam pautan ini.
              </p>
            </div>
          )}

          {/* Footer Note */}
          <p className="text-xs text-slate-400 text-center">
            Pautan ini akan membawa pembeli ke halaman imbasan kesediaan.
          </p>
        </div>
      </div>
    </div>
  );
}

// Simple Building icon (avoiding import collision with lucide Building2)
function Building2Icon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}
