// components/InvitationModal.tsx
'use client';

import { useState, useRef } from 'react';
import { X, Upload, Link as LinkIcon, Copy, Check, Building2, Image } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectLocation: string;
}

export function InvitationModal({ isOpen, onClose, projectName, projectLocation }: InvitationModalProps) {
  const { t, lang } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logo, setLogo] = useState<string | null>(null);
  const [logoName, setLogoName] = useState<string>('');
  const [developerName, setDeveloperName] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(lang === 'bm' ? 'Sila pilih fail imej' : 'Please select an image file');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert(lang === 'bm' ? 'Saiz fail maksimum 2MB' : 'Maximum file size is 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setLogo(base64);
        setLogoName(file.name);
        // Store in localStorage for persistence
        localStorage.setItem('developerLogo', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateLink = () => {
    if (!developerName.trim()) {
      alert(lang === 'bm' ? 'Sila masukkan nama pemaju' : 'Please enter developer name');
      return;
    }

    // Generate unique invitation code
    const inviteCode = `INV-${Date.now().toString(36).toUpperCase()}`;

    // Build URL with params
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams({
      dev: developerName,
      project: projectName,
      code: inviteCode,
      ...(logo ? { logo: 'stored' } : {}) // Flag that logo exists in localStorage
    });

    const link = `${baseUrl}/buyer/prescan?${params.toString()}`;
    setGeneratedLink(link);

    // Store invitation details
    const invitation = {
      code: inviteCode,
      developerName,
      projectName,
      projectLocation,
      logo,
      createdAt: new Date().toISOString()
    };

    // Save to localStorage (in real app, would save to backend)
    const invitations = JSON.parse(localStorage.getItem('invitations') || '[]');
    invitations.push(invitation);
    localStorage.setItem('invitations', JSON.stringify(invitations));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
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

  const resetForm = () => {
    setLogo(null);
    setLogoName('');
    setDeveloperName('');
    setGeneratedLink('');
    setCopied(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-snang-teal-100 rounded-xl flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-snang-teal-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">
                {lang === 'bm' ? 'Cipta Pautan Jemputan' : 'Create Invitation Link'}
              </h2>
              <p className="text-xs text-slate-500">{projectName}</p>
            </div>
          </div>
          <button
            onClick={() => { onClose(); resetForm(); }}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {lang === 'bm' ? 'Logo Pemaju' : 'Developer Logo'}
              <span className="text-slate-400 font-normal ml-1">
                ({lang === 'bm' ? 'Pilihan' : 'Optional'})
              </span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />

            {!logo ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-snang-teal-300 hover:bg-snang-teal-50 transition-all"
              >
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">
                  {lang === 'bm' ? 'Klik untuk muat naik logo' : 'Click to upload logo'}
                </p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG (max 2MB)</p>
              </button>
            ) : (
              <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                    <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-700">{logoName}</p>
                    <button
                      onClick={() => { setLogo(null); setLogoName(''); localStorage.removeItem('developerLogo'); }}
                      className="text-xs text-red-500 hover:text-red-600 mt-1"
                    >
                      {lang === 'bm' ? 'Buang logo' : 'Remove logo'}
                    </button>
                  </div>
                  <Check className="w-5 h-5 text-green-500" />
                </div>
              </div>
            )}
          </div>

          {/* Developer Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {lang === 'bm' ? 'Nama Pemaju / Syarikat' : 'Developer / Company Name'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={developerName}
              onChange={(e) => setDeveloperName(e.target.value)}
              placeholder={lang === 'bm' ? 'Contoh: ABC Development Sdn Bhd' : 'e.g., ABC Development Sdn Bhd'}
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-snang-teal-500 focus:outline-none"
            />
          </div>

          {/* Project Info (read-only) */}
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-700">{projectName}</p>
                <p className="text-xs text-slate-500">{projectLocation}</p>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          {!generatedLink && (
            <button
              onClick={generateLink}
              disabled={!developerName.trim()}
              className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                developerName.trim()
                  ? 'bg-gradient-to-r from-snang-teal-600 to-snang-teal-700 text-white shadow-lg shadow-snang-teal-500/30 hover:shadow-xl'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <LinkIcon className="w-5 h-5" />
              {lang === 'bm' ? 'Jana Pautan' : 'Generate Link'}
            </button>
          )}

          {/* Generated Link */}
          {generatedLink && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs text-green-600 font-medium mb-2">
                {lang === 'bm' ? '✅ Pautan berjaya dijana!' : '✅ Link generated successfully!'}
              </p>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <p className="text-xs text-slate-600 break-all font-mono">{generatedLink}</p>
              </div>
              <button
                onClick={copyLink}
                className={`w-full mt-3 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    {lang === 'bm' ? 'Disalin!' : 'Copied!'}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    {lang === 'bm' ? 'Salin Pautan' : 'Copy Link'}
                  </>
                )}
              </button>

              {/* Preview info */}
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-xs text-green-700">
                  {lang === 'bm'
                    ? '💡 Pembeli akan melihat logo dan nama pemaju anda dalam pautan ini.'
                    : '💡 Buyers will see your logo and developer name in this link.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <p className="text-xs text-slate-500 text-center">
            {lang === 'bm'
              ? 'Pautan ini akan membawa pembeli ke halaman imbasan kesediaan.'
              : 'This link will direct buyers to the readiness scan page.'}
          </p>
        </div>
      </div>
    </div>
  );
}
