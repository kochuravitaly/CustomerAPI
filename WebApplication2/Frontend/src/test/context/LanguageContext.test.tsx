import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider, useLanguage } from '../../context/LanguageContext';

vi.mock('../../i18n', () => ({
    translations: {
        en: {
            common: { error: 'Error' },
            auth: { login: 'Login' },
            test: { key: 'English text' },
        },
        ru: {
            common: { error: 'Ошибка' },
            auth: { login: 'Войти' },
            test: { key: 'Русский текст' },
        },
    },
} as any));

const TestComponent = () => {
    const { language, t, setLanguage } = useLanguage();
    const translations = t as any;
    return (
        <div>
            <div data-testid="language">{language}</div>
            <div data-testid="translation">{translations.test.key}</div>
            <button onClick={() => setLanguage('ru')}>Switch to Russian</button>
            <button onClick={() => setLanguage('en')}>Switch to English</button>
        </div>
    );
};

describe('LanguageContext', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    const renderLanguage = () => {
        return render(
            <LanguageProvider>
                <TestComponent />
            </LanguageProvider>
        );
    };

    describe('Initial State', () => {
        it('should default to English', () => {
            renderLanguage();
            expect(screen.getByTestId('language')).toHaveTextContent('en');
            expect(screen.getByTestId('translation')).toHaveTextContent('English text');
        });

        it('should load saved language from localStorage', () => {
            localStorage.setItem('language', 'ru');
            renderLanguage();
            expect(screen.getByTestId('language')).toHaveTextContent('ru');
            expect(screen.getByTestId('translation')).toHaveTextContent('Русский текст');
        });
    });

    describe('setLanguage', () => {
        it('should switch to Russian', async () => {
            renderLanguage();

            const switchButton = screen.getByText('Switch to Russian');
            await userEvent.click(switchButton);

            expect(screen.getByTestId('language')).toHaveTextContent('ru');
            expect(screen.getByTestId('translation')).toHaveTextContent('Русский текст');
        });

        it('should save language to localStorage', async () => {
            renderLanguage();

            const switchButton = screen.getByText('Switch to Russian');
            await userEvent.click(switchButton);

            expect(localStorage.getItem('language')).toBe('ru');
        });

        it('should switch back to English', async () => {
            renderLanguage();

            await userEvent.click(screen.getByText('Switch to Russian'));
            await userEvent.click(screen.getByText('Switch to English'));

            expect(screen.getByTestId('language')).toHaveTextContent('en');
            expect(screen.getByTestId('translation')).toHaveTextContent('English text');
        });
    });
});