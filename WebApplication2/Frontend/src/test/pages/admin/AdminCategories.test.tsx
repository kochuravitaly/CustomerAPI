import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminCategories } from '../../../pages/admin/AdminCategories';
import { LanguageProvider } from '../../../context/LanguageContext';
import { categoryService } from '../../../services/product.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../../../services/product.service', () => ({
    categoryService: {
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

const mockCategories = [
    { id: 1, name: 'Category 1', nameTranslations: { en: 'Category 1' }, description: 'Description 1' },
    { id: 2, name: 'Category 2', nameTranslations: { en: 'Category 2' }, description: 'Description 2' },
];

describe('AdminCategories', () => {
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
        vi.mocked(categoryService.getAll).mockResolvedValue(mockAxiosResponse(mockCategories));
    });

    const renderAdminCategories = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <AdminCategories />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Display', () => {
        it('should show heading', async () => {
            renderAdminCategories();
            expect(await screen.findByText(/manage categories/i)).toBeInTheDocument();
        });

        it('should show add button', async () => {
            renderAdminCategories();
            expect(await screen.findByText(/add/i)).toBeInTheDocument();
        });

        it('should display all categories', async () => {
            renderAdminCategories();
            expect(await screen.findByText('Category 1')).toBeInTheDocument();
            expect(screen.getByText('Category 2')).toBeInTheDocument();
        });

        it('should display descriptions', async () => {
            renderAdminCategories();
            expect(await screen.findByText('Description 1')).toBeInTheDocument();
            expect(screen.getByText('Description 2')).toBeInTheDocument();
        });

        it('should show search input', async () => {
            renderAdminCategories();
            expect(await screen.findByPlaceholderText(/search/i)).toBeInTheDocument();
        });

        it('should show sort selects', async () => {
            renderAdminCategories();
            const selects = await screen.findAllByRole('combobox');
            expect(selects).toHaveLength(2);
        });
    });

    describe('Loading and Error States', () => {
        it('should show loading spinner while categories load', () => {
            vi.mocked(categoryService.getAll).mockImplementation(() => new Promise(() => { }));
            renderAdminCategories();
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });

        it('should show error when categories fail to load', async () => {
            vi.mocked(categoryService.getAll).mockRejectedValue(new Error('Network error'));
            renderAdminCategories();
            expect(await screen.findByText('Failed to load categories')).toBeInTheDocument();
        });
    });

    describe('Search', () => {
        it('should filter categories by search term', async () => {
            renderAdminCategories();

            const searchInput = await screen.findByPlaceholderText(/search/i);
            await userEvent.type(searchInput, 'Category 1');

            const submitButton = screen.getByText('🔍');
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('Category 1')).toBeInTheDocument();
                expect(screen.queryByText('Category 2')).not.toBeInTheDocument();
            });
        });

        it('should save search to history', async () => {
            renderAdminCategories();

            const searchInput = await screen.findByPlaceholderText(/search/i);
            await userEvent.type(searchInput, 'Category 1');

            const submitButton = screen.getByText('🔍');
            await userEvent.click(submitButton);

            expect(localStorage.getItem('adminCategorySearchHistory')).toContain('Category 1');
        });

        it('should show search history on focus', async () => {
            localStorage.setItem('adminCategorySearchHistory', JSON.stringify(['Category 2']));
            renderAdminCategories();

            const searchInput = await screen.findByPlaceholderText(/search/i);
            await userEvent.click(searchInput);

            expect(await screen.findByText('Category 2')).toBeInTheDocument();
        });
    });

    describe('Sort', () => {
        it('should sort by name ascending by default', async () => {
            renderAdminCategories();

            const items = await screen.findAllByText(/Category \d/);
            expect(items[0]).toHaveTextContent('Category 1');
            expect(items[1]).toHaveTextContent('Category 2');
        });

        it('should sort by name descending', async () => {
            renderAdminCategories();

            const sortSelects = await screen.findAllByRole('combobox');
            await userEvent.selectOptions(sortSelects[1], 'desc');

            const items = await screen.findAllByText(/Category \d/);
            expect(items[0]).toHaveTextContent('Category 2');
            expect(items[1]).toHaveTextContent('Category 1');
        });
    });

    describe('Delete', () => {
        it('should show confirmation modal when delete clicked', async () => {
            renderAdminCategories();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            expect(await screen.findByText(/are you sure/i)).toBeInTheDocument();
        });

        it('should call delete when confirmed', async () => {
            vi.mocked(categoryService.delete).mockResolvedValue(mockAxiosResponse({}));
            renderAdminCategories();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            const confirmButton = document.querySelector('.modal .btn-danger') as HTMLElement;
            await userEvent.click(confirmButton);

            await waitFor(() => {
                expect(vi.mocked(categoryService.delete)).toHaveBeenCalledWith(1);
            });
        });

        it('should disable delete button while deleting', async () => {
            vi.mocked(categoryService.delete).mockImplementation(() => new Promise(() => { }));
            renderAdminCategories();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            const confirmButton = document.querySelector('.modal .btn-danger') as HTMLElement;
            await userEvent.click(confirmButton);

            expect(confirmButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });

        it('should close modal when cancel clicked', async () => {
            renderAdminCategories();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            const cancelButton = await screen.findByText(/cancel/i);
            await userEvent.click(cancelButton);

            expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
        });

        it('should show error when delete fails', async () => {
            vi.mocked(categoryService.delete).mockRejectedValue({
                response: { data: 'Cannot delete this category' },
            });
            renderAdminCategories();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            const confirmButton = document.querySelector('.modal .btn-danger') as HTMLElement;
            await userEvent.click(confirmButton);

            expect(await screen.findByText('Cannot delete this category')).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should navigate back when back button clicked', async () => {
            renderAdminCategories();
            const backButton = await screen.findByText(/back/i);
            backButton.click();
            expect(mockNavigate).toHaveBeenCalledWith('/admin');
        });

        it('should have add category link', async () => {
            renderAdminCategories();
            const addLink = await screen.findByRole('link', { name: /add/i });
            expect(addLink).toHaveAttribute('href', '/admin/categories/new');
        });

        it('should have edit links', async () => {
            renderAdminCategories();
            const editLinks = await screen.findAllByText(/edit/i);
            expect(editLinks[0]).toHaveAttribute('href', '/admin/categories/1/edit');
        });
    });
});