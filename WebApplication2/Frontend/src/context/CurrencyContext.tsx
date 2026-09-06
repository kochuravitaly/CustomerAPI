import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

export type CurrencyCode = 'USD' | 'EUR' | 'RUB';

interface CurrencyContextType {
    currency: CurrencyCode;
    rates: Record<CurrencyCode, number>;
    formatPrice: (amount: number) => string;
    convertPrice: (amount: number) => number;
    isLoading: boolean;
}

const symbols: Record<CurrencyCode, string> = {
    USD: '$',
    EUR: '€',
    RUB: '₽',
};

const defaultRates: Record<CurrencyCode, number> = {
    USD: 1,
    EUR: 0.92,
    RUB: 90,
};

const getCurrencyFromLanguage = (): CurrencyCode => {
    const lang = localStorage.getItem('language') || 'en';
    switch (lang) {
        case 'ru': return 'RUB';
        case 'de': return 'EUR';
        default: return 'USD';
    }
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
        return getCurrencyFromLanguage();
    });
    const [rates, setRates] = useState<Record<CurrencyCode, number>>(defaultRates);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const handleLanguageChange = () => {
            setCurrencyState(getCurrencyFromLanguage());
        };

        window.addEventListener('languageChanged', handleLanguageChange);
        return () => window.removeEventListener('languageChanged', handleLanguageChange);
    }, []);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const response = await apiService.get('/currency/rates');
                const data = response.data as any;
                if (data.rates) {
                    setRates({
                        USD: data.rates.USD || 1,
                        EUR: data.rates.EUR || 0.92,
                        RUB: data.rates.RUB || 90,
                    });
                }
            } catch {
                setRates(defaultRates);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRates();
    }, []);

    const convertPrice = useCallback((amount: number): number => {
        return Math.round(amount * rates[currency] * 100) / 100;
    }, [currency, rates]);

    const formatPrice = useCallback((amount: number): string => {
        const converted = convertPrice(amount);
        const symbol = symbols[currency];

        switch (currency) {
            case 'RUB':
                return `${Math.round(converted).toLocaleString('ru-RU')}${symbol}`;
            case 'EUR':
                return `${symbol}${converted.toFixed(2)}`;
            case 'USD':
            default:
                return `${symbol}${converted.toFixed(2)}`;
        }
    }, [currency, rates, convertPrice]);

    return (
        <CurrencyContext.Provider value={{ currency, rates, formatPrice, convertPrice, isLoading }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
    return context;
};