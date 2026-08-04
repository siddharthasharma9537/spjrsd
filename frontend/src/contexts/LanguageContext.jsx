import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('lang');
    if (saved === 'en' || saved === 'te') setLangState(saved);
  }, []);

  const setLang = (value) => {
    localStorage.setItem('lang', value);
    setLangState(value);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/**
 * Picks one language instead of showing both.
 *
 *   const { t, te, heading } = useT();
 *   <h1 className={heading}>{t('Contact Us', 'సంప్రదించండి')}</h1>
 *
 * Falls back to whichever string exists, so a missing Telugu translation
 * renders the English rather than an empty heading.
 */
export function useT() {
  const { lang } = useLanguage() || {};
  const te = lang === 'te';
  // Full font class, not a suffix: .font-english-heading is declared after
  // .font-telugu-heading in index.css, so appending the Telugu class would lose
  // the cascade. These must replace font-english-* outright.
  return {
    te,
    t: (en, teStr) => (te ? teStr || en : en || teStr),
    heading: te ? 'font-telugu-heading' : 'font-english-heading',
    body: te ? 'font-telugu-body' : 'font-english-body',
  };
}
