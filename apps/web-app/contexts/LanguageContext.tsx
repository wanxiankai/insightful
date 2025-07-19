'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, defaultLocale, getTranslations, Translations } from '@/lib/i18n';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [translations, setTranslations] = useState<Translations>(getTranslations(defaultLocale));

  // 从localStorage加载语言设置
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && (savedLocale === 'zh' || savedLocale === 'en')) {
      setLocaleState(savedLocale);
      setTranslations(getTranslations(savedLocale));
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setTranslations(getTranslations(newLocale));
    localStorage.setItem('locale', newLocale);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: translations }}>
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