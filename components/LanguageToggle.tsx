// components/LanguageToggle.tsx
'use client';

import { useLanguage } from '@/lib/i18n';

interface LanguageToggleProps {
  variant?: 'default' | 'compact' | 'pill';
  className?: string;
}

export function LanguageToggle({ variant = 'default', className = '' }: LanguageToggleProps) {
  const { lang, setLang } = useLanguage();

  if (variant === 'pill') {
    return (
      <div className={`flex items-center bg-slate-700/50 rounded-full p-0.5 ${className}`}>
        <button
          onClick={() => setLang('bm')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            lang === 'bm'
              ? 'bg-orange-500 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          BM
        </button>
        <button
          onClick={() => setLang('en')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            lang === 'en'
              ? 'bg-orange-500 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          EN
        </button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={() => setLang(lang === 'bm' ? 'en' : 'bm')}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-300 hover:text-white transition-colors ${className}`}
      >
        <span className={lang === 'bm' ? 'text-orange-400' : 'text-slate-500'}>BM</span>
        <span className="text-slate-600">/</span>
        <span className={lang === 'en' ? 'text-orange-400' : 'text-slate-500'}>EN</span>
      </button>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={() => setLang('bm')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
          lang === 'bm'
            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <span>🇲🇾</span>
        <span>BM</span>
      </button>
      <button
        onClick={() => setLang('en')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
          lang === 'en'
            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <span>🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
}

export default LanguageToggle;
