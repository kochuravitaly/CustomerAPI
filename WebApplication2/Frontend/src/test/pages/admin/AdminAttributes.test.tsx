import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminAttributes } from '../../../pages/admin/AdminAttributes';
import { LanguageProvider } from '../../../context/LanguageContext';
import { attributeService } from '../../../services/attribute.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
        useSearchParams: vi.fn(() => [new URLSearchParams(''), vi.fn()]),
    };
});

vi.mock('../../../services/attribute.service', () => ({
    attributeService: {
        getMaterials: vi.fn(),
        getStyles: vi.fn(),
        getOccasions: vi.fn(),
        getPatterns: vi.fn(),
        deleteMaterial: vi.fn(),
        deleteStyle: vi.fn(),
        deleteOccasion: vi.fn(),
        deletePattern: vi.fn(),
    },
}));

vi.mock('../../../components/LoadingSpinner', () => ({
    LoadingSpinner: () => <div>Loading...</div>,
}));

const mockAxiosResponse = (data: any = {}) => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {
        headers: {},
    },
} as any);

const mockMaterials = [
    { id: 1, name: 'Cotton' },
    { id: 2, name: 'Wool' },
];

const mockStyles = [
    { id: 1, name: 'Casual' },
    { id: 2, name: 'Formal' },
];

const mockOccasions = [
    { id: 1, name: 'Daily' },
    { id: 2, name: 'Party' },
];

const mockPatterns = [
    { id: 1, name: 'Solid' },
    { id: 2, name: 'Striped' },
];

describe('AdminAttributes', () => {
    let queryClient: QueryClient;
    const mockNavigate = vi.fn();

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        localStorage.clear();
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useSearchParams).mockReturnValue([new URLSearchParams(''), vi.fn()]);
        vi.mocked(attributeService.getMaterials).mockResolvedValue(mockAxiosResponse(mockMaterials));
        vi.mocked(attributeService.getStyles).mockResolvedValue(mockAxiosResponse(mockStyles));
        vi.mocked(attributeService.getOccasions).mockResolvedValue(mockAxiosResponse(mockOccasions));
        vi.mocked(attributeService.getPatterns).mockResolvedValue(mockAxiosResponse(mockPatterns));
    });

    const renderAdminAttributes = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <AdminAttributes />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Display', () => {
        it('should show heading', async () => {
            renderAdminAttributes();
            expect(await screen.findByText(/manage attributes/i)).toBeInTheDocument();
        });

        it('should show tabs', async () => {
            renderAdminAttributes();
            expect(await screen.findByText(/materials/i)).toBeInTheDocument();
            expect(screen.getByText(/styles/i)).toBeInTheDocument();
            expect(screen.getByText(/occasions/i)).toBeInTheDocument();
            expect(screen.getByText(/patterns/i)).toBeInTheDocument();
        });

        it('should show add button', async () => {
            renderAdminAttributes();
            expect(await screen.findByText(/add/i)).toBeInTheDocument();
        });

        it('should show materials by default', async () => {
            renderAdminAttributes();
            expect(await screen.findByText('Cotton')).toBeInTheDocument();
            expect(screen.getByText('Wool')).toBeInTheDocument();
        });

        it('should show search input', async () => {
            renderAdminAttributes();
            expect(await screen.findByPlaceholderText(/search/i)).toBeInTheDocument();
        });

        it('should show sort select', async () => {
            renderAdminAttributes();
            expect(await screen.findByRole('combobox')).toBeInTheDocument();
        });
    });

    describe('Tabs', () => {
        it('should switch to styles tab', async () => {
            renderAdminAttributes();

            const stylesTab = await screen.findByText(/styles/i);
            await userEvent.click(stylesTab);

            expect(await screen.findByText('Casual')).toBeInTheDocument();
            expect(screen.getByText('Formal')).toBeInTheDocument();
        });

        it('should switch to occasions tab', async () => {
            renderAdminAttributes();

            const occasionsTab = await screen.findByText(/occasions/i);
            await userEvent.click(occasionsTab);

            expect(await screen.findByText('Daily')).toBeInTheDocument();
            expect(screen.getByText('Party')).toBeInTheDocument();
        });

        it('should switch to patterns tab', async () => {
            renderAdminAttributes();

            const patternsTab = await screen.findByText(/patterns/i);
            await userEvent.click(patternsTab);

            expect(await screen.findByText('Solid')).toBeInTheDocument();
            expect(screen.getByText('Striped')).toBeInTheDocument();
        });
    });

    describe('Search', () => {
        it('should filter items by search term', async () => {
            renderAdminAttributes();

            const searchInput = await screen.findByPlaceholderText(/search/i);
            await userEvent.type(searchInput, 'Cotton');

            const submitButton = screen.getByText('🔍');
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Cotton')).toBeInTheDocument();
                expect(screen.queryByText('Wool')).not.toBeInTheDocument();
            });
        });

        it('should save search to history', async () => {
            renderAdminAttributes();

            const searchInput = await screen.findByPlaceholderText(/search/i);
            await userEvent.type(searchInput, 'Cotton');

            const submitButton = screen.getByText('🔍');
            await userEvent.click(submitButton);

            expect(localStorage.getItem('adminAttributeSearchHistory')).toContain('Cotton');
        });

        it('should show search history on focus', async () => {
            localStorage.setItem('adminAttributeSearchHistory', JSON.stringify(['Wool']));
            renderAdminAttributes();

            const searchInput = await screen.findByPlaceholderText(/search/i);
            await userEvent.click(searchInput);

            expect(await screen.findByText('Wool')).toBeInTheDocument();
        });
    });

    describe('Sort', () => {
        it('should sort ascending by default', async () => {
            renderAdminAttributes();

            const items = await screen.findAllByText(/Cotton|Wool/);
            expect(items[0]).toHaveTextContent('Cotton');
            expect(items[1]).toHaveTextContent('Wool');
        });

        it('should sort descending when selected', async () => {
            renderAdminAttributes();

            const sortSelect = await screen.findByRole('combobox');
            await userEvent.selectOptions(sortSelect, 'desc');

            const items = await screen.findAllByText(/Cotton|Wool/);
            expect(items[0]).toHaveTextContent('Wool');
            expect(items[1]).toHaveTextContent('Cotton');
        });
    });

    describe('Error States', () => {
        it('should show error when materials fail to load', async () => {
            vi.mocked(attributeService.getMaterials).mockRejectedValue(new Error('Network error'));
            renderAdminAttributes();
            expect(await screen.findByText('Failed to load data')).toBeInTheDocument();
        });

        it('should show error when styles fail to load', async () => {
            vi.mocked(attributeService.getStyles).mockRejectedValue(new Error('Network error'));
            renderAdminAttributes();

            const stylesTab = await screen.findByText(/styles/i);
            await userEvent.click(stylesTab);

            expect(await screen.findByText('Failed to load data')).toBeInTheDocument();
        });
    });

    describe('Delete', () => {
        it('should show confirmation modal when delete clicked', async () => {
            renderAdminAttributes();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            expect(await screen.findByText(/are you sure/i)).toBeInTheDocument();
        });

        it('should call deleteMaterial when confirmed', async () => {
            vi.mocked(attributeService.deleteMaterial).mockResolvedValue(mockAxiosResponse({}));
            renderAdminAttributes();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            const confirmButton = document.querySelector('.modal .btn-danger') as HTMLElement;
            await userEvent.click(confirmButton);

            await waitFor(() => {
                expect(vi.mocked(attributeService.deleteMaterial)).toHaveBeenCalledWith(1);
            });
        });

        it('should close modal when cancel clicked', async () => {
            renderAdminAttributes();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            const cancelButton = await screen.findByText(/cancel/i);
            await userEvent.click(cancelButton);

            expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
        });

        it('should show error when delete fails', async () => {
            vi.mocked(attributeService.deleteMaterial).mockRejectedValue({
                response: { data: 'Failed to delete' },
            });
            renderAdminAttributes();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            const confirmButton = document.querySelector('.modal .btn-danger') as HTMLElement;
            await userEvent.click(confirmButton);

            expect(await screen.findByText('Failed to delete')).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should navigate back when back button clicked', async () => {
            renderAdminAttributes();
            const backButton = await screen.findByText(/back/i);
            backButton.click();
            expect(mockNavigate).toHaveBeenCalledWith('/admin');
        });

        it('should have add attribute link', async () => {
            renderAdminAttributes();
            const addLink = await screen.findByRole('link', { name: /add/i });
            expect(addLink).toHaveAttribute('href', '/admin/attributes/new?type=materials');
        });

        it('should have edit links', async () => {
            renderAdminAttributes();
            const editLinks = await screen.findAllByText(/edit/i);
            expect(editLinks[0]).toHaveAttribute('href', '/admin/attributes/1/edit?type=materials');
        });
    });
});