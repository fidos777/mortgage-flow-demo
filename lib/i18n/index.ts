// lib/i18n/index.ts
export { LanguageProvider, useLanguage, useTranslation } from './LanguageContext';
export { translations, defaultLanguage } from './translations';
export type { Language } from './translations';
export { glossary, getTerm, BANNED_WORDS } from './glossary';
export type { GlossaryKey } from './glossary';

// Re-export helpers for convenience
import { getTerm as _getTerm, type GlossaryKey as _GlossaryKey } from './glossary';
export const getBMTerm = (key: _GlossaryKey) => _getTerm(key, 'bm');
export const getENTerm = (key: _GlossaryKey) => _getTerm(key, 'en');
