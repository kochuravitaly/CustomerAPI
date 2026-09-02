import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminCouponForm } from '../../../pages/admin/AdminCouponForm';
import { LanguageProvider } from '../../../context/LanguageContext';
import { couponService } from '../../../services/coupon.service';
import { productService, categoryService } from '../../../services/product.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
        useParams: vi.fn(() => ({})),
    };
});

vi.mock('../../../services/coupon.service', () => ({
    couponService: {
        getCoupons: vi.fn(),
        createCoupon: vi.fn(),
        updateCoupon: vi.fn(),
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

const mockProducts = {
    items: [
        { id: 1, name: 'Product 1', nameTranslations: { en: 'Product 1' }, price: 100 },
        { id: 2, name: 'Product 2', nameTranslations: { en: 'Product 2' }, price: 200 },
    ],
    page: 1,
    pageSize: 100,
    totalCount: 2,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
};

const mockCategories = [
    { id: 1, name: 'Category 1', nameTranslations: { en: 'Category 1' }, description: '' },
    { id: 2, name: 'Category 2', nameTranslations: { en: 'Category 2' }, description: '' },
];

describe('AdminCouponForm', () => {
    let queryClient: QueryClient;
    const mockNavigate = vi.fn();

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useParams).mockReturnValue({});
        vi.mocked(couponService.getCoupons).mockResolvedValue(mockAxiosResponse([]));
        vi.mocked(productService.getAll).mockResolvedValue(mockAxiosResponse(mockProducts));
        vi.mocked(categoryService.getAll).mockResolvedValue(mockAxiosResponse(mockCategories));
    });

    const renderAdminCouponForm = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <AdminCouponForm />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Create Mode', () => {
        it('should show form in create mode', () => {
            renderAdminCouponForm();
            expect(screen.getByRole('heading', { name: /create coupon/i })).toBeInTheDocument();
        });

        it('should show code input', () => {
            renderAdminCouponForm();
            expect(screen.getByRole('textbox')).toBeInTheDocument();
        });

        it('should show discount value input', () => {
            renderAdminCouponForm();
            expect(screen.getAllByRole('spinbutton')).toHaveLength(3);
        });

        it('should show products selector', async () => {
            renderAdminCouponForm();
            expect(await screen.findByText('Product 1')).toBeInTheDocument();
            expect(screen.getByText('Product 2')).toBeInTheDocument();
        });

        it('should show categories selector', async () => {
            renderAdminCouponForm();
            expect(await screen.findByText('Category 1')).toBeInTheDocument();
            expect(screen.getByText('Category 2')).toBeInTheDocument();
        });

        it('should show error when code is empty', async () => {
            renderAdminCouponForm();
            const submitButton = screen.getByRole('button', { name: /create coupon/i });
            await userEvent.click(submitButton);
            expect(await screen.findByText('Code is required')).toBeInTheDocument();
        });

        it('should show error when discount value is empty', async () => {
            renderAdminCouponForm();
            const codeInput = screen.getByRole('textbox');
            await userEvent.type(codeInput, 'SAVE10');
            const submitButton = screen.getByRole('button', { name: /create coupon/i });
            await userEvent.click(submitButton);
            expect(await screen.findByText('Discount value is required')).toBeInTheDocument();
        });

        it('should create coupon when submitted', async () => {
            vi.mocked(couponService.createCoupon).mockResolvedValue(mockAxiosResponse({}));
            renderAdminCouponForm();

            const codeInput = screen.getByRole('textbox');
            const discountInput = screen.getAllByRole('spinbutton')[0];

            await userEvent.type(codeInput, 'SAVE10');
            await userEvent.type(discountInput, '10');

            const submitButton = screen.getByRole('button', { name: /create coupon/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(couponService.createCoupon)).toHaveBeenCalledWith(expect.objectContaining({
                    code: 'SAVE10',
                    discountValue: 10,
                }));
            });
        });

        it('should navigate back after create', async () => {
            vi.mocked(couponService.createCoupon).mockResolvedValue(mockAxiosResponse({}));
            renderAdminCouponForm();

            const codeInput = screen.getByRole('textbox');
            const discountInput = screen.getAllByRole('spinbutton')[0];

            await userEvent.type(codeInput, 'SAVE10');
            await userEvent.type(discountInput, '10');

            const submitButton = screen.getByRole('button', { name: /create coupon/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/admin/coupons');
            });
        });

        it('should disable button while creating', async () => {
            vi.mocked(couponService.createCoupon).mockImplementation(() => new Promise(() => { }));
            renderAdminCouponForm();

            const codeInput = screen.getByRole('textbox');
            const discountInput = screen.getAllByRole('spinbutton')[0];

            await userEvent.type(codeInput, 'SAVE10');
            await userEvent.type(discountInput, '10');

            const submitButton = screen.getByRole('button', { name: /create coupon/i });
            await userEvent.click(submitButton);

            expect(submitButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });

        it('should show error when create fails', async () => {
            vi.mocked(couponService.createCoupon).mockRejectedValue({
                response: { data: 'Failed to create coupon' },
            });
            renderAdminCouponForm();

            const codeInput = screen.getByRole('textbox');
            const discountInput = screen.getAllByRole('spinbutton')[0];

            await userEvent.type(codeInput, 'SAVE10');
            await userEvent.type(discountInput, '10');

            const submitButton = screen.getByRole('button', { name: /create coupon/i });
            await userEvent.click(submitButton);

            expect(await screen.findByText('Failed to create coupon')).toBeInTheDocument();
        });

        it('should toggle product selection', async () => {
            renderAdminCouponForm();

            const productButton = await screen.findByText('Product 1');
            await userEvent.click(productButton);

            expect(productButton).toHaveClass('active');
        });

        it('should toggle category selection', async () => {
            renderAdminCouponForm();

            const categoryButton = await screen.findByText('Category 1');
            await userEvent.click(categoryButton);

            expect(categoryButton).toHaveClass('active');
        });
    });

    describe('Edit Mode', () => {
        beforeEach(() => {
            vi.mocked(useParams).mockReturnValue({ id: '1' });
            vi.mocked(couponService.getCoupons).mockResolvedValue(mockAxiosResponse([{
                id: 1,
                code: 'SAVE20',
                discountType: 0,
                discountValue: 20,
                minOrderAmount: null,
                expiryDate: null,
                usageLimit: null,
                productIdsJson: '[1]',
                categoryIdsJson: '[1]',
            }]));
        });

        it('should show form in edit mode', async () => {
            renderAdminCouponForm();
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /update coupon/i })).toBeInTheDocument();
            });
        });

        it('should load existing code', async () => {
            renderAdminCouponForm();
            await waitFor(() => {
                expect(screen.getByDisplayValue('SAVE20')).toBeInTheDocument();
            });
        });

        it('should update coupon when submitted', async () => {
            vi.mocked(couponService.updateCoupon).mockResolvedValue(mockAxiosResponse({}));
            renderAdminCouponForm();

            await waitFor(() => {
                expect(screen.getByDisplayValue('SAVE20')).toBeInTheDocument();
            });

            const submitButton = screen.getByRole('button', { name: /update coupon/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(couponService.updateCoupon)).toHaveBeenCalledWith(1, expect.objectContaining({
                    code: 'SAVE20',
                }));
            });
        });

        it('should show error when update fails', async () => {
            vi.mocked(couponService.updateCoupon).mockRejectedValue({
                response: { data: 'Failed to update coupon' },
            });
            renderAdminCouponForm();

            await waitFor(() => {
                expect(screen.getByDisplayValue('SAVE20')).toBeInTheDocument();
            });

            const submitButton = screen.getByRole('button', { name: /update coupon/i });
            await userEvent.click(submitButton);

            expect(await screen.findByText('Failed to update coupon')).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should navigate back when back button clicked', () => {
            renderAdminCouponForm();
            const backButton = screen.getByText(/back/i);
            backButton.click();
            expect(mockNavigate).toHaveBeenCalledWith('/admin/coupons');
        });

        it('should navigate back when cancel clicked', () => {
            renderAdminCouponForm();
            const cancelButton = screen.getByText(/cancel/i);
            cancelButton.click();
            expect(mockNavigate).toHaveBeenCalledWith('/admin/coupons');
        });
    });
});