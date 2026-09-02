import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminCoupons } from '../../../pages/admin/AdminCoupons';
import { LanguageProvider } from '../../../context/LanguageContext';
import { couponService } from '../../../services/coupon.service';
import { productService, categoryService } from '../../../services/product.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../../../services/coupon.service', () => ({
    couponService: {
        getCoupons: vi.fn(),
        deleteCoupon: vi.fn(),
    },
    formatExpiryDate: vi.fn((date: string | null) => date || 'No expiry'),
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

const mockCoupons = [
    {
        id: 1,
        code: 'SAVE10',
        discountType: 0,
        discountValue: 10,
        minOrderAmount: null,
        expiryDate: null,
        usageLimit: null,
        timesUsed: 5,
        productIdsJson: '[]',
        categoryIdsJson: '[]',
    },
    {
        id: 2,
        code: 'SAVE20',
        discountType: 1,
        discountValue: 20,
        minOrderAmount: 100,
        expiryDate: '2025-12-31T00:00:00Z',
        usageLimit: 100,
        timesUsed: 50,
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

describe('AdminCoupons', () => {
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
        vi.mocked(couponService.getCoupons).mockResolvedValue(mockAxiosResponse(mockCoupons));
        vi.mocked(productService.getAll).mockResolvedValue(mockAxiosResponse(mockProducts));
        vi.mocked(categoryService.getAll).mockResolvedValue(mockAxiosResponse(mockCategories));
    });

    const renderAdminCoupons = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <AdminCoupons />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Display', () => {
        it('should show heading', async () => {
            renderAdminCoupons();
            expect(await screen.findByText(/manage coupons/i)).toBeInTheDocument();
        });

        it('should show add button', async () => {
            renderAdminCoupons();
            expect(await screen.findByText(/add/i)).toBeInTheDocument();
        });

        it('should display all coupons', async () => {
            renderAdminCoupons();
            expect(await screen.findByText('SAVE10')).toBeInTheDocument();
            expect(screen.getByText('SAVE20')).toBeInTheDocument();
        });

        it('should display discount values', async () => {
            renderAdminCoupons();
            expect(await screen.findByText('10%')).toBeInTheDocument();
            expect(screen.getByText('$20')).toBeInTheDocument();
        });

        it('should display usage info', async () => {
            renderAdminCoupons();
            expect(await screen.findByText('5')).toBeInTheDocument();
            expect(screen.getByText('50/100')).toBeInTheDocument();
        });

        it('should show search input', async () => {
            renderAdminCoupons();
            expect(await screen.findByPlaceholderText(/search/i)).toBeInTheDocument();
        });
    });

    describe('Loading and Error States', () => {
        it('should show loading spinner while coupons load', () => {
            vi.mocked(couponService.getCoupons).mockImplementation(() => new Promise(() => { }));
            renderAdminCoupons();
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });

        it('should show error when coupons fail to load', async () => {
            vi.mocked(couponService.getCoupons).mockRejectedValue(new Error('Network error'));
            renderAdminCoupons();
            expect(await screen.findByText('Failed to load coupons')).toBeInTheDocument();
        });
    });

    describe('Search', () => {
        it('should filter coupons by search term', async () => {
            renderAdminCoupons();

            const searchInput = await screen.findByPlaceholderText(/search/i);
            await userEvent.type(searchInput, 'SAVE10');

            const submitButton = screen.getByText('🔍');
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText('SAVE10')).toBeInTheDocument();
                expect(screen.queryByText('SAVE20')).not.toBeInTheDocument();
            });
        });

        it('should save search to history', async () => {
            renderAdminCoupons();

            const searchInput = await screen.findByPlaceholderText(/search/i);
            await userEvent.type(searchInput, 'SAVE10');

            const submitButton = screen.getByText('🔍');
            await userEvent.click(submitButton);

            expect(localStorage.getItem('adminCouponSearchHistory')).toContain('SAVE10');
        });
    });

    describe('Sort', () => {
        it('should sort by code ascending by default', async () => {
            renderAdminCoupons();

            const codes = await screen.findAllByText(/SAVE\d+/);
            expect(codes[0]).toHaveTextContent('SAVE10');
            expect(codes[1]).toHaveTextContent('SAVE20');
        });

        it('should sort by code descending', async () => {
            renderAdminCoupons();

            const sortSelects = await screen.findAllByRole('combobox');
            await userEvent.selectOptions(sortSelects[1], 'desc');

            const codes = await screen.findAllByText(/SAVE\d+/);
            expect(codes[0]).toHaveTextContent('SAVE20');
            expect(codes[1]).toHaveTextContent('SAVE10');
        });
    });

    describe('Delete', () => {
        it('should show confirmation modal when delete clicked', async () => {
            renderAdminCoupons();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            expect(await screen.findByText(/are you sure/i)).toBeInTheDocument();
        });

        it('should call deleteCoupon when confirmed', async () => {
            vi.mocked(couponService.deleteCoupon).mockResolvedValue(mockAxiosResponse({}));
            renderAdminCoupons();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            const confirmButton = document.querySelector('.modal .btn-danger') as HTMLElement;
            await userEvent.click(confirmButton);

            await waitFor(() => {
                expect(vi.mocked(couponService.deleteCoupon)).toHaveBeenCalledWith(1);
            });
        });

        it('should disable button while deleting', async () => {
            vi.mocked(couponService.deleteCoupon).mockImplementation(() => new Promise(() => { }));
            renderAdminCoupons();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            const confirmButton = document.querySelector('.modal .btn-danger') as HTMLElement;
            await userEvent.click(confirmButton);

            expect(confirmButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });

        it('should close modal when cancel clicked', async () => {
            renderAdminCoupons();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            const cancelButton = await screen.findByText(/cancel/i);
            await userEvent.click(cancelButton);

            expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
        });

        it('should show error when delete fails', async () => {
            vi.mocked(couponService.deleteCoupon).mockRejectedValue({
                response: { data: 'Failed to delete' },
            });
            renderAdminCoupons();

            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);

            const confirmButton = document.querySelector('.modal .btn-danger') as HTMLElement;
            await userEvent.click(confirmButton);

            expect(await screen.findByText('Failed to delete')).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should navigate back when back button clicked', async () => {
            renderAdminCoupons();
            const backButton = await screen.findByText(/back/i);
            backButton.click();
            expect(mockNavigate).toHaveBeenCalledWith('/admin');
        });

        it('should have add coupon link', async () => {
            renderAdminCoupons();
            const addLink = await screen.findByRole('link', { name: /add/i });
            expect(addLink).toHaveAttribute('href', '/admin/coupons/new');
        });

        it('should have edit links', async () => {
            renderAdminCoupons();
            const editLinks = await screen.findAllByText(/edit/i);
            expect(editLinks[0]).toHaveAttribute('href', '/admin/coupons/1/edit');
        });
    });
});