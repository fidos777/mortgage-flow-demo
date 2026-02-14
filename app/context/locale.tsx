'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export type Locale = 'bm' | 'en'

interface LocaleCtx {
  lang: Locale
  setLang: (l: Locale) => void
}

const LocaleContext = createContext<LocaleCtx>({ lang: 'bm', setLang: () => {} })

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Locale>('bm')
  return (
    <LocaleContext.Provider value={{ lang, setLang }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
