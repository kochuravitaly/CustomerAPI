import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSelector } from '../../components/LanguageSelector';
import { LanguageProvider } from '../../context/LanguageContext';

describe('LanguageSelector', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    const renderLanguageSelector = () => {
        return render(
            <LanguageProvider>
                <LanguageSelector />
            </LanguageProvider>
        );
    };

    it('should show current language', () => {
        renderLanguageSelector();
        expect(screen.getByText('United Kingdom')).toBeInTheDocument();
    });

    it('should show dropdown when clicked', async () => {
        renderLanguageSelector();
        const button = screen.getByRole('button');
        await userEvent.click(button);
        expect(screen.getByText('Русский')).toBeInTheDocument();
        expect(screen.getByText('Deutsch')).toBeInTheDocument();
    });

    it('should close dropdown when clicked outside', async () => {
        renderLanguageSelector();
        const button = screen.getByRole('button');
        await userEvent.click(button);
        expect(screen.getByText('Русский')).toBeInTheDocument();

        await userEvent.click(document.body);
        await waitFor(() => {
            expect(screen.queryByText('Русский')).not.toBeInTheDocument();
        });
    });

    it('should change language when option clicked', async () => {
        renderLanguageSelector();
        const button = screen.getByRole('button');
        await userEvent.click(button);

        const russianOption = screen.getByText('Русский');
        await userEvent.click(russianOption);

        expect(screen.getByText('Россия')).toBeInTheDocument();
    });

    it('should filter languages by search term', async () => {
        renderLanguageSelector();
        const button = screen.getByRole('button');
        await userEvent.click(button);

        const searchInput = screen.getByPlaceholderText(/search/i);
        await userEvent.type(searchInput, 'deutsch');

        expect(screen.getByText('Deutsch')).toBeInTheDocument();
        expect(screen.queryByText('Русский')).not.toBeInTheDocument();
        expect(screen.queryByText('English')).not.toBeInTheDocument();
    });

    it('should show no results when filter has no matches', async () => {
        renderLanguageSelector();
        const button = screen.getByRole('button');
        await userEvent.click(button);

        const searchInput = screen.getByPlaceholderText(/search/i);
        await userEvent.type(searchInput, 'xyz');

        expect(screen.getByText(/no countries/i)).toBeInTheDocument();
    });

    it('should clear search term after selecting language', async () => {
        renderLanguageSelector();
        const button = screen.getByRole('button');
        await userEvent.click(button);

        const searchInput = screen.getByPlaceholderText(/search/i);
        await userEvent.type(searchInput, 'рус');

        const russianOption = screen.getByText('Русский');
        await userEvent.click(russianOption);

        const newButton = screen.getByRole('button');
        await userEvent.click(newButton);

        const newSearchInput = document.querySelector('.location-search-input') as HTMLInputElement;
        expect(newSearchInput.value).toBe('');
    });

    it('should show checkmark for current language', async () => {
        renderLanguageSelector();
        const button = screen.getByRole('button');
        await userEvent.click(button);

        const checkmarks = screen.getAllByText('✓');
        expect(checkmarks.length).toBe(1);
    });

    it('should mark current language as active', async () => {
        renderLanguageSelector();
        const button = screen.getByRole('button');
        await userEvent.click(button);

        const englishOption = screen.getByText('English').closest('button');
        expect(englishOption).toHaveClass('active');
    });

    it('should focus search input when dropdown opens', async () => {
        renderLanguageSelector();
        const button = screen.getByRole('button');
        await userEvent.click(button);

        const searchInput = screen.getByPlaceholderText(/search/i);
        expect(document.activeElement).toBe(searchInput);
    });
});