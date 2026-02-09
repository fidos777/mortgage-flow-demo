/**
 * @scope VISUAL ONLY - Presentation Layer
 * i18n language context provider.
 *
 * ⚠️ BOUNDARIES:
 * - Client-side only (localStorage persistence)
 * - Hydration-safe with mounted state
 * - No backend sync
 *
 * @see /docs/UI-AMENDMENTS.md
 */
'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { translations, Language, defaultLanguage } from './translations';

type Vars = Record<string, string | number>;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, vars?: Vars) => string;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'qontrek_language';

/**
 * Feature flag check: determine if i18n is enabled
 * If disabled, always use BM (default language)
 */
function isI18nEnabled(): boolean {
  if (typeof window === 'undefined') return true; // SSR safety
  return process.env.NEXT_PUBLIC_ENABLE_I18N !== 'false';
}

/**
 * Get nested value from object using dot notation
 * e.g., getNested(obj, 'branding.sentBy') => obj.branding.sentBy
 */
function getNested(obj: Record<string, string>, path: string): string | undefined {
  // For flat key structure, just return directly
  return obj[path];
}

/**
 * Replace {placeholder} with values from vars object
 * e.g., interpolate("Hello {name}!", { name: "John" }) => "Hello John!"
 */
function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const val = vars[key];
    // If var not provided, keep placeholder visible for debugging
    return val === undefined || val === null ? match : String(val);
  });
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(defaultLanguage);
  const [mounted, setMounted] = useState(false);

  // Load saved language preference on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        // If i18n is disabled, always use BM
        if (!isI18nEnabled()) {
          setLangState('bm');
          return;
        }

        const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
        if (saved && (saved === 'bm' || saved === 'en')) {
          setLangState(saved);
        }
      } catch (e) {
        // localStorage not available
      }
    }
  }, []);

  const setLang = useCallback((newLang: Language) => {
    // If i18n is disabled, always force BM
    const langToSet = !isI18nEnabled() ? 'bm' : newLang;
    setLangState(langToSet);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, langToSet);
      } catch (e) {
        // localStorage not available
      }
    }
  }, []);

  const toggleLang = useCallback(() => {
    const newLang = lang === 'bm' ? 'en' : 'bm';
    setLang(newLang);
  }, [lang, setLang]);

  /**
   * Translation function with interpolation support
   * @param key - Translation key (e.g., 'branding.sentBy')
   * @param vars - Variables to interpolate (e.g., { name: 'Ahmad' })
   * @returns Translated and interpolated string
   */
  const t = useCallback((key: string, vars?: Vars): string => {
    // Try current language first
    let value = getNested(translations[lang], key);

    // Fallback to BM if key not found in current language
    if (!value && lang !== 'bm') {
      value = getNested(translations['bm'], key);
    }

    // If still not found, return a debug marker
    if (!value) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[i18n] Missing translation key: ${key}`);
      }
      return `[missing:${key}]`;
    }

    // Apply interpolation if vars provided
    return interpolate(value, vars);
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t, toggleLang }), [lang, setLang, t, toggleLang]);

  // Prevent hydration mismatch by using default language until mounted
  if (!mounted) {
    const defaultT = (key: string, vars?: Vars): string => {
      const value = getNested(translations[defaultLanguage], key);
      if (!value) return `[missing:${key}]`;
      return interpolate(value, vars);
    };

    return (
      <LanguageContext.Provider value={{
        lang: defaultLanguage,
        setLang,
        t: defaultT,
        toggleLang
      }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Simple hook for just getting translation function
export function useTranslation() {
  const { t, lang } = useLanguage();
  return { t, lang };
}
