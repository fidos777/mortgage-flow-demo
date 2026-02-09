/**
 * @scope VISUAL ONLY - Presentation Layer
 * i18n localization system - Language toggle button.
 *
 * ⚠️ BOUNDARIES:
 * - Client-side dictionary lookup only
 * - Persists to localStorage only
 * - Does NOT sync to server
 * - Does NOT affect backend locale
 *
 * @see /docs/UI-AMENDMENTS.md
 */
'use client';

import { useLanguage } from '@/lib/i18n';

interface LanguageToggleProps {
  variant?: 'default' | 'compact' | 'pill';
  className?: string;
}

export function LanguageToggle({ variant = 'default', className = '' }: LanguageToggleProps) {
  const { lang, setLang } = useLanguage();

  // Feature flag: if i18n is disabled, don't show the toggle
  if (!process.env.NEXT_PUBLIC_ENABLE_I18N) {
    return null;
  }

  if (variant === 'pill') {
    return (
      <div className={`flex items-center bg-slate-700/50 rounded-full p-0.5 ${className}`}>
        <button
          onClick={() => setLang('bm')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            lang === 'bm'
              ? 'bg-snang-teal-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          BM
        </button>
        <button
          onClick={() => setLang('en')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            lang === 'en'
              ? 'bg-snang-teal-600 text-white'
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
        <span className={lang === 'bm' ? 'text-snang-teal-500' : 'text-slate-500'}>BM</span>
        <span className="text-slate-600">/</span>
        <span className={lang === 'en' ? 'text-snang-teal-500' : 'text-slate-500'}>EN</span>
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
            ? 'bg-snang-teal-600/20 text-snang-teal-500 border border-snang-teal-500/30'
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
            ? 'bg-snang-teal-600/20 text-snang-teal-500 border border-snang-teal-500/30'
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
