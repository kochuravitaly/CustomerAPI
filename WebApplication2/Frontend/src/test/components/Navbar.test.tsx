import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import { LanguageProvider } from '../../context/LanguageContext';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
        useLocation: vi.fn(() => ({ pathname: '/', state: null, key: '', search: '', hash: '' })),
    };
});

vi.mock('../../components/LanguageSelector', () => ({
    LanguageSelector: () => <div data-testid="language-selector">Language Selector</div>,
}));

describe('Navbar', () => {
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    });

    const renderNavbar = () => {
        return render(
            <LanguageProvider>
                <MemoryRouter>
                    <Navbar />
                </MemoryRouter>
            </LanguageProvider>
        );
    };

    describe('On Home Page', () => {
        beforeEach(() => {
            vi.mocked(useLocation).mockReturnValue({ pathname: '/', state: null, key: '', search: '', hash: '' } as any);
        });

        it('should show logo', () => {
            renderNavbar();
            expect(screen.getByText('CheyenneShop')).toBeInTheDocument();
        });

        it('should show search button', () => {
            renderNavbar();
            expect(screen.getByText(/search/i)).toBeInTheDocument();
        });

        it('should show language selector', () => {
            renderNavbar();
            expect(screen.getByTestId('language-selector')).toBeInTheDocument();
        });

        it('should navigate to search when search button clicked', async () => {
            renderNavbar();
            const searchButton = screen.getByRole('button', { name: /search/i });
            await userEvent.click(searchButton);
            expect(mockNavigate).toHaveBeenCalledWith('/search');
        });
    });

    describe('On Categories Page', () => {
        beforeEach(() => {
            vi.mocked(useLocation).mockReturnValue({ pathname: '/categories', state: null, key: '', search: '', hash: '' } as any);
        });

        it('should show logo', () => {
            renderNavbar();
            expect(screen.getByText('CheyenneShop')).toBeInTheDocument();
        });

        it('should show search icon button instead of language selector', () => {
            renderNavbar();
            expect(screen.queryByTestId('language-selector')).not.toBeInTheDocument();
            expect(screen.getByText('🔍')).toBeInTheDocument();
        });

        it('should not show search button', () => {
            renderNavbar();
            expect(screen.queryByRole('button', { name: /search/i })).not.toBeInTheDocument();
        });

        it('should navigate to search when search icon clicked', async () => {
            renderNavbar();
            const searchIcon = screen.getByText('🔍');
            await userEvent.click(searchIcon);
            expect(mockNavigate).toHaveBeenCalledWith('/search');
        });
    });

    describe('On Other Pages', () => {
        beforeEach(() => {
            vi.mocked(useLocation).mockReturnValue({ pathname: '/products', state: null, key: '', search: '', hash: '' } as any);
        });

        it('should show search button', () => {
            renderNavbar();
            expect(screen.getByText(/search/i)).toBeInTheDocument();
        });

        it('should show language selector', () => {
            renderNavbar();
            expect(screen.getByTestId('language-selector')).toBeInTheDocument();
        });
    });
});