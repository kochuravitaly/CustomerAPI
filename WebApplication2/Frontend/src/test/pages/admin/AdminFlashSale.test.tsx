import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminFlashSale } from '../../../pages/admin/AdminFlashSale';
import { LanguageProvider } from '../../../context/LanguageContext';
import { flashSaleService } from '../../../services/coupon.service';
import { productService, categoryService } from '../../../services/product.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../../../services/coupon.service', () => ({
    flashSaleService: {
        getAll: vi.fn(),
        delete: vi.fn(),
    },
}));

vi.mock('../../../services/product.service', () => ({
    productService: {
        getAll: vi.fn(),
    },
    categoryService: {
        getAll: vi.fn(),
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

const mockFlashSales = [
    {
        id: 1,
        discountPercentage: 20,
        startsAt: '2025-01-01T00:00:00Z',
        endsAt: '2025-01-02T00:00:00Z',
        productIdsJson: '[]',
        categoryIdsJson: '[]',
    },
    {
        id: 2,
        discountPercentage: 50,
        startsAt: '2025-02-01T00:00:00Z',
        endsAt: '2025-02-02T00:00:00Z',
        productIdsJson: '[1]',
        categoryIdsJson: '[1]',
    },
];

const mockProducts = {
    items: [
        { id: 1, name: 'Product 1', nameTranslations: { en: 'Product 1' }, price: 100 },
    ],
    page: 1,
    pageSize: 100,
    totalCount: 1,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
};

const mockCategories = [
    { id: 1, name: 'Category 1', nameTranslations: { en: 'Category 1' }, description: '' },
];

describe('AdminFlashSale', () => {
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
        vi.mocked(flashSaleService.getAll).mockResolvedValue(mockAxiosResponse(mockFlashSales));
        vi.mocked(productService.getAll).mockResolvedValue(mockAxiosResponse(mockProducts));
        vi.mocked(categoryService.getAll).mockResolvedValue(mockAxiosResponse(mockCategories));
    });

    const renderAdminFlashSale = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <AdminFlashSale />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Display', () => {
        it('should show heading', async () => {
            renderAdminFlashSale();
            expect(await screen.findByText(/manage flash sales/i)).toBeInTheDocument();
        });

        it('should show add button', async () => {
            renderAdminFlashSale();
            expect(await screen.findByText(/add/i)).toBeInTheDocument();
        });

        it('should display discount percentages', async () => {
            renderAdminFlashSale();
            expect(await screen.findByText('-20%')).toBeInTheDocument();
            expect(screen.getByText('-50%')).toBeInTheDocument();
        });

        it('should show search input', async () => {
            renderAdminFlashSale();
            expect(await screen.findByPlaceholderText(/search/i)).toBeInTheDocument();
        });
    });

    describe('Loading and Error States', () => {
        it('should show loading spinner while flash sales load', () => {
            vi.mocked(flashSaleService.getAll).mockImplementation(() => new Promise(() => { }));
            renderAdminFlashSale();
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });

        it('should show error when flash sales fail to load', async () => {
            vi.mocked(flashSaleService.getAll).mockRejectedValue(new Error('Network error'));
            renderAdminFlashSale();
            expect(await screen.findByText('Failed to load flash sales')).toBeInTheDocument();
        });
    });

    describe('Search', () => {
        it('should filter flash sales by product name', async () => {
            renderAdminFlashSale();

            const searchInput = await screen.findByPlaceholderText(/search/i);
            await userEvent.type(searchInput, 'Product 1');

            const submitButton = screen.getByText('🔍');
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('-50%')).toBeInTheDocument();
                expect(screen.queryByText('-20%')).not.toBeInTheDocument();
            });
        });

        it('should save search to history', async () => {
            renderAdminFlashSale();

            const searchInput = await screen.findByPlaceholderText(/search/i);
            await userEvent.type(searchInput, 'Product 1');

            const submitButton = screen.getByText('🔍');
            await userEvent.click(submitButton);

            expect(localStorage.getItem('adminFlashSaleSearchHistory')).toContain('Product 1');
        });
    });

    describe('Sort', () => {
        it('should sort by discount percentage', async () => {
            renderAdminFlashSale();

            const sortSelects = await screen.findAllByRole('combobox');
            await userEvent.selectOptions(sortSelects[0], 'discountPercentage');
            await userEvent.selectOptions(sortSelects[1], 'asc');

            const discounts = await screen.findAllByText(/-\d+%/);
            expect(discounts[0]).toHaveTextContent('-20%');
            expect(discounts[1]).toHaveTextContent('-50%');
        });
    });

    describe('Delete', () => {
        it('should show confirmation modal when delete clicked', async () => {
            renderAdminFlashSale();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            expect(await screen.findByText(/are you sure/i)).toBeInTheDocument();
        });

        it('should call delete when confirmed', async () => {
            vi.mocked(flashSaleService.delete).mockResolvedValue(mockAxiosResponse({}));
            renderAdminFlashSale();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            const confirmButton = document.querySelector('.modal .btn-danger') as HTMLElement;
            await userEvent.click(confirmButton);

            await waitFor(() => {
                expect(vi.mocked(flashSaleService.delete)).toHaveBeenCalledWith(1);
            });
        });

        it('should disable button while deleting', async () => {
            vi.mocked(flashSaleService.delete).mockImplementation(() => new Promise(() => { }));
            renderAdminFlashSale();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            const confirmButton = document.querySelector('.modal .btn-danger') as HTMLElement;
            await userEvent.click(confirmButton);

            expect(confirmButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });

        it('should close modal when cancel clicked', async () => {
            renderAdminFlashSale();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            const cancelButton = await screen.findByText(/cancel/i);
            await userEvent.click(cancelButton);

            expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
        });

        it('should show error when delete fails', async () => {
            vi.mocked(flashSaleService.delete).mockRejectedValue({
                response: { data: 'Failed to delete' },
            });
            renderAdminFlashSale();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            const confirmButton = document.querySelector('.modal .btn-danger') as HTMLElement;
            await userEvent.click(confirmButton);

            expect(await screen.findByText('Failed to delete')).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should navigate back when back button clicked', async () => {
            renderAdminFlashSale();
            const backButton = await screen.findByText(/back/i);
            backButton.click();
            expect(mockNavigate).toHaveBeenCalledWith('/admin');
        });

        it('should have add flash sale link', async () => {
            renderAdminFlashSale();
            const addLink = await screen.findByRole('link', { name: /add/i });
            expect(addLink).toHaveAttribute('href', '/admin/flash-sale/new');
        });

        it('should have edit links', async () => {
            renderAdminFlashSale();
            const editLinks = await screen.findAllByText(/edit/i);
            expect(editLinks[0]).toHaveAttribute('href', '/admin/flash-sale/1/edit');
        });
    });
});