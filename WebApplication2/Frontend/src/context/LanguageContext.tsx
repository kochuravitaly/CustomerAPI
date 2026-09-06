import React, { createContext, useState, useContext } from 'react';
import { translations, Language } from '../i18n';
import { TranslationKeys } from '../i18n';

interface LanguageContextType {
    language: Language;
    t: TranslationKeys;
    setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getCurrencyForLanguage = (lang: Language): string => {
    switch (lang) {
        case 'ru': return 'RUB';
        case 'de': return 'EUR';
        default: return 'USD';
    }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('language');
        return (saved as Language) || 'en';
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
        localStorage.setItem('currency', getCurrencyForLanguage(lang));
        window.dispatchEvent(new Event('languageChanged'));
    };

    const value: LanguageContextType = {
        language,
        t: translations[language],
        setLanguage,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};