import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { defaultLanguage, supportedLanguages, translations } from './translations'

const STORAGE_KEY = 'homego_locale'
const LanguageContext = createContext(null)

function normalizeLanguage(language) {
  const code = (language || '').toLowerCase().split('-')[0]
  return supportedLanguages.some((item) => item.code === code) ? code : defaultLanguage
}

function getInitialLanguage() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) return normalizeLanguage(stored)
  return normalizeLanguage(navigator.language)
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage)

  const setLanguage = (nextLanguage) => {
    setLanguageState(normalizeLanguage(nextLanguage))
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(() => {
    const dictionary = translations[language] || translations[defaultLanguage]
    const fallback = translations[defaultLanguage]
    return {
      language,
      languages: supportedLanguages,
      setLanguage,
      t: (key, params) => {
        const template = dictionary[key] || fallback[key] || key
        if (!params) return template
        return Object.entries(params).reduce(
          (text, [name, value]) => text.replaceAll(`{${name}}`, value ?? ''),
          template,
        )
      },
    }
  }, [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

export function getStoredLanguage() {
  return normalizeLanguage(localStorage.getItem(STORAGE_KEY) || navigator.language)
}

export function translateStored(key) {
  const language = getStoredLanguage()
  return translations[language]?.[key] || translations[defaultLanguage][key] || key
}
