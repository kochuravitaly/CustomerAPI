import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n';

export const LanguageSelector: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const languages: { code: Language; flag: string; name: string; country: string }[] = [
        { code: 'en', flag: '🇬🇧', name: 'English', country: 'United Kingdom' },
        { code: 'ru', flag: '🇷🇺', name: 'Русский', country: 'Россия' },
        { code: 'de', flag: '🇩🇪', name: 'Deutsch', country: 'Deutschland' },
    ];

    const currentLanguage = languages.find(l => l.code === language);

    const filteredLanguages = languages.filter(lang =>
        lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lang.country.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    return (
        <div className="location-selector" ref={dropdownRef}>
            <button
                className="location-selector-btn"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>📍</span>
                <span className="flag">{currentLanguage?.flag}</span>
                <span>{currentLanguage?.country}</span>
                <span className="dropdown-arrow">▾</span>
            </button>

            {isOpen && (
                <div className="location-dropdown">
                    <div className="location-search">
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder={t.location.searchCountry}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="location-search-input"
                        />
                    </div>
                    {filteredLanguages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                setLanguage(lang.code);
                                setIsOpen(false);
                                setSearchTerm('');
                            }}
                            className={`location-dropdown-item ${language === lang.code ? 'active' : ''}`}
                        >
                            <span className="flag">{lang.flag}</span>
                            <div className="location-info">
                                <span className="location-country">{lang.country}</span>
                                <span className="location-language">{lang.name}</span>
                            </div>
                            {language === lang.code && <span className="checkmark">✓</span>}
                        </button>
                    ))}
                    {filteredLanguages.length === 0 && (
                        <p className="no-locations">{t.location.noCountries}</p>
                    )}
                </div>
            )}
        </div>
    );
};