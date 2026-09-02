import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';

const TestComponent = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <div>
            <div data-testid="theme">{theme}</div>
            <button onClick={toggleTheme}>Toggle Theme</button>
        </div>
    );
};

describe('ThemeContext', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
    });

    const renderTheme = () => {
        return render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );
    };

    describe('Initial State', () => {
        it('should default to light theme', () => {
            renderTheme();
            expect(screen.getByTestId('theme')).toHaveTextContent('light');
        });

        it('should load saved theme from localStorage', () => {
            localStorage.setItem('theme', 'dark');
            renderTheme();
            expect(screen.getByTestId('theme')).toHaveTextContent('dark');
        });

        it('should set data-theme attribute on document', () => {
            renderTheme();
            expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        });
    });

    describe('toggleTheme', () => {
        it('should toggle from light to dark', async () => {
            renderTheme();

            await userEvent.click(screen.getByText('Toggle Theme'));

            expect(screen.getByTestId('theme')).toHaveTextContent('dark');
        });

        it('should toggle from dark to light', async () => {
            localStorage.setItem('theme', 'dark');
            renderTheme();

            await userEvent.click(screen.getByText('Toggle Theme'));

            expect(screen.getByTestId('theme')).toHaveTextContent('light');
        });

        it('should save theme to localStorage', async () => {
            renderTheme();

            await userEvent.click(screen.getByText('Toggle Theme'));

            expect(localStorage.getItem('theme')).toBe('dark');
        });

        it('should update data-theme attribute', async () => {
            renderTheme();

            await userEvent.click(screen.getByText('Toggle Theme'));

            expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        });
    });
});