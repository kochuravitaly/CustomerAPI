import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminHomeSections } from '../../../pages/admin/AdminHomeSections';
import { LanguageProvider } from '../../../context/LanguageContext';
import { homeSectionService } from '../../../services/homeSection.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../../../services/homeSection.service', () => ({
    homeSectionService: {
        getAll: vi.fn(),
        delete: vi.fn(),
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

const mockSections = [
    {
        id: 1,
        title: 'Best Sellers',
        titleTranslations: { en: 'Best Sellers' },
        productsToShow: 4,
        filterJson: '{}',
        displayOrder: 1,
    },
    {
        id: 2,
        title: 'New Arrivals',
        titleTranslations: { en: 'New Arrivals' },
        productsToShow: 8,
        filterJson: '{}',
        displayOrder: 2,
    },
];

describe('AdminHomeSections', () => {
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
        vi.mocked(homeSectionService.getAll).mockResolvedValue(mockAxiosResponse(mockSections));
    });

    const renderAdminHomeSections = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <AdminHomeSections />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Display', () => {
        it('should show heading', async () => {
            renderAdminHomeSections();
            expect(await screen.findByText(/manage homepage sections/i)).toBeInTheDocument();
        });

        it('should show add button', async () => {
            renderAdminHomeSections();
            expect(await screen.findByText(/add/i)).toBeInTheDocument();
        });

        it('should display all sections', async () => {
            renderAdminHomeSections();
            expect(await screen.findByText('Best Sellers')).toBeInTheDocument();
            expect(screen.getByText('New Arrivals')).toBeInTheDocument();
        });

        it('should display products to show', async () => {
            renderAdminHomeSections();
            expect(await screen.findByText('4')).toBeInTheDocument();
            expect(screen.getByText('8')).toBeInTheDocument();
        });

        it('should show search input', async () => {
            renderAdminHomeSections();
            expect(await screen.findByPlaceholderText(/search/i)).toBeInTheDocument();
        });
    });

    describe('Loading and Error States', () => {
        it('should show loading spinner while sections load', () => {
            vi.mocked(homeSectionService.getAll).mockImplementation(() => new Promise(() => { }));
            renderAdminHomeSections();
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });

        it('should show error when sections fail to load', async () => {
            vi.mocked(homeSectionService.getAll).mockRejectedValue(new Error('Network error'));
            renderAdminHomeSections();
            expect(await screen.findByText('Failed to load home sections')).toBeInTheDocument();
        });
    });

    describe('Search', () => {
        it('should filter sections by search term', async () => {
            renderAdminHomeSections();

            const searchInput = await screen.findByPlaceholderText(/search/i);
            await userEvent.type(searchInput, 'Best');

            const submitButton = screen.getByText('🔍');
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Best Sellers')).toBeInTheDocument();
                expect(screen.queryByText('New Arrivals')).not.toBeInTheDocument();
            });
        });

        it('should save search to history', async () => {
            renderAdminHomeSections();

            const searchInput = await screen.findByPlaceholderText(/search/i);
            await userEvent.type(searchInput, 'Best');

            const submitButton = screen.getByText('🔍');
            await userEvent.click(submitButton);

            expect(localStorage.getItem('adminHomeSectionSearchHistory')).toContain('Best');
        });
    });

    describe('Sort', () => {
        it('should sort by title ascending by default', async () => {
            renderAdminHomeSections();

            const titles = await screen.findAllByText(/Best Sellers|New Arrivals/);
            expect(titles[0]).toHaveTextContent('Best Sellers');
            expect(titles[1]).toHaveTextContent('New Arrivals');
        });

        it('should sort by title descending', async () => {
            renderAdminHomeSections();

            const sortSelects = await screen.findAllByRole('combobox');
            await userEvent.selectOptions(sortSelects[1], 'desc');

            const titles = await screen.findAllByText(/Best Sellers|New Arrivals/);
            expect(titles[0]).toHaveTextContent('New Arrivals');
            expect(titles[1]).toHaveTextContent('Best Sellers');
        });
    });

    describe('Delete', () => {
        it('should show confirmation modal when delete clicked', async () => {
            renderAdminHomeSections();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            expect(await screen.findByText(/are you sure/i)).toBeInTheDocument();
        });

        it('should call delete when confirmed', async () => {
            vi.mocked(homeSectionService.delete).mockResolvedValue(mockAxiosResponse({}));
            renderAdminHomeSections();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            const confirmButton = document.querySelector('.modal .btn-danger') as HTMLElement;
            await userEvent.click(confirmButton);

            await waitFor(() => {
                expect(vi.mocked(homeSectionService.delete)).toHaveBeenCalledWith(1);
            });
        });

        it('should disable button while deleting', async () => {
            vi.mocked(homeSectionService.delete).mockImplementation(() => new Promise(() => { }));
            renderAdminHomeSections();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            const confirmButton = document.querySelector('.modal .btn-danger') as HTMLElement;
            await userEvent.click(confirmButton);

            expect(confirmButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });

        it('should close modal when cancel clicked', async () => {
            renderAdminHomeSections();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            const cancelButton = await screen.findByText(/cancel/i);
            await userEvent.click(cancelButton);

            expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
        });

        it('should show error when delete fails', async () => {
            vi.mocked(homeSectionService.delete).mockRejectedValue({
                response: { data: 'Failed to delete' },
            });
            renderAdminHomeSections();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            const confirmButton = document.querySelector('.modal .btn-danger') as HTMLElement;
            await userEvent.click(confirmButton);

            expect(await screen.findByText('Failed to delete')).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should navigate back when back button clicked', async () => {
            renderAdminHomeSections();
            const backButton = await screen.findByText(/back/i);
            backButton.click();
            expect(mockNavigate).toHaveBeenCalledWith('/admin');
        });

        it('should have add section link', async () => {
            renderAdminHomeSections();
            const addLink = await screen.findByRole('link', { name: /add/i });
            expect(addLink).toHaveAttribute('href', '/admin/home-sections/new');
        });

        it('should have edit links', async () => {
            renderAdminHomeSections();
            const editLinks = await screen.findAllByText(/edit/i);
            expect(editLinks[0]).toHaveAttribute('href', '/admin/home-sections/1/edit');
        });
    });
});