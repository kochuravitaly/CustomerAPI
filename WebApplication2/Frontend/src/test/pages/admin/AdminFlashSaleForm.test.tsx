import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminFlashSaleForm } from '../../../pages/admin/AdminFlashSaleForm';
import { LanguageProvider } from '../../../context/LanguageContext';
import { flashSaleService } from '../../../services/coupon.service';
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
    flashSaleService: {
        getAll: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
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

describe('AdminFlashSaleForm', () => {
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
        vi.mocked(flashSaleService.getAll).mockResolvedValue(mockAxiosResponse([]));
        vi.mocked(productService.getAll).mockResolvedValue(mockAxiosResponse(mockProducts));
        vi.mocked(categoryService.getAll).mockResolvedValue(mockAxiosResponse(mockCategories));
    });

    const renderAdminFlashSaleForm = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <AdminFlashSaleForm />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Create Mode', () => {
        it('should show form in create mode', () => {
            renderAdminFlashSaleForm();
            expect(screen.getByRole('heading', { name: /create/i })).toBeInTheDocument();
        });

        it('should show discount percentage input', () => {
            renderAdminFlashSaleForm();
            expect(screen.getByRole('spinbutton')).toBeInTheDocument();
        });

        it('should show products selector', async () => {
            renderAdminFlashSaleForm();
            expect(await screen.findByText('Product 1')).toBeInTheDocument();
            expect(screen.getByText('Product 2')).toBeInTheDocument();
        });

        it('should show categories selector', async () => {
            renderAdminFlashSaleForm();
            expect(await screen.findByText('Category 1')).toBeInTheDocument();
            expect(screen.getByText('Category 2')).toBeInTheDocument();
        });

        it('should show error when discount percentage is empty', async () => {
            renderAdminFlashSaleForm();
            const submitButton = screen.getByRole('button', { name: /create/i });
            await userEvent.click(submitButton);
            expect(await screen.findByText('Discount percentage is required')).toBeInTheDocument();
        });

        it('should create flash sale when submitted', async () => {
            vi.mocked(flashSaleService.create).mockResolvedValue(mockAxiosResponse({}));
            renderAdminFlashSaleForm();

            const discountInput = screen.getAllByRole('spinbutton')[0];
            const dateInputs = document.querySelectorAll('input[type="datetime-local"]');

            await userEvent.type(discountInput, '20');
            await userEvent.type(dateInputs[0] as HTMLElement, '2025-01-01T00:00');
            await userEvent.type(dateInputs[1] as HTMLElement, '2025-01-02T00:00');

            const submitButton = screen.getByRole('button', { name: /create/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(flashSaleService.create)).toHaveBeenCalledWith(expect.objectContaining({
                    discountPercentage: 20,
                }));
            });
        });

        it('should navigate back after create', async () => {
            vi.mocked(flashSaleService.create).mockResolvedValue(mockAxiosResponse({}));
            renderAdminFlashSaleForm();

            const discountInput = screen.getAllByRole('spinbutton')[0];
            const dateInputs = document.querySelectorAll('input[type="datetime-local"]');

            await userEvent.type(discountInput, '20');
            await userEvent.type(dateInputs[0] as HTMLElement, '2025-01-01T00:00');
            await userEvent.type(dateInputs[1] as HTMLElement, '2025-01-02T00:00');

            const submitButton = screen.getByRole('button', { name: /create/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/admin/flash-sale');
            });
        });

        it('should disable button while creating', async () => {
            vi.mocked(flashSaleService.create).mockImplementation(() => new Promise(() => { }));
            renderAdminFlashSaleForm();

            const discountInput = screen.getAllByRole('spinbutton')[0];
            const dateInputs = document.querySelectorAll('input[type="datetime-local"]');

            await userEvent.type(discountInput, '20');
            await userEvent.type(dateInputs[0] as HTMLElement, '2025-01-01T00:00');
            await userEvent.type(dateInputs[1] as HTMLElement, '2025-01-02T00:00');

            const submitButton = screen.getByRole('button', { name: /create/i });
            await userEvent.click(submitButton);

            expect(submitButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });

        it('should show error when create fails', async () => {
            vi.mocked(flashSaleService.create).mockRejectedValue({
                response: { data: 'Failed to create' },
            });
            renderAdminFlashSaleForm();

            const discountInput = screen.getAllByRole('spinbutton')[0];
            const dateInputs = document.querySelectorAll('input[type="datetime-local"]');

            await userEvent.type(discountInput, '20');
            await userEvent.type(dateInputs[0] as HTMLElement, '2025-01-01T00:00');
            await userEvent.type(dateInputs[1] as HTMLElement, '2025-01-02T00:00');

            const submitButton = screen.getByRole('button', { name: /create/i });
            await userEvent.click(submitButton);

            expect(await screen.findByText('Failed to create')).toBeInTheDocument();
        });

        it('should toggle product selection', async () => {
            renderAdminFlashSaleForm();

            const productButton = await screen.findByText('Product 1');
            await userEvent.click(productButton);

            expect(productButton).toHaveClass('active');
        });
    });

    describe('Edit Mode', () => {
        beforeEach(() => {
            vi.mocked(useParams).mockReturnValue({ id: '1' });
            vi.mocked(flashSaleService.getAll).mockResolvedValue(mockAxiosResponse([{
                id: 1,
                discountPercentage: 30,
                startsAt: '2025-01-01T00:00:00Z',
                endsAt: '2025-01-02T00:00:00Z',
                productIdsJson: '[1]',
                categoryIdsJson: '[1]',
            }]));
        });

        it('should show form in edit mode', async () => {
            renderAdminFlashSaleForm();
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /update/i })).toBeInTheDocument();
            });
        });

        it('should load existing discount', async () => {
            renderAdminFlashSaleForm();
            await waitFor(() => {
                expect(screen.getByDisplayValue('30')).toBeInTheDocument();
            });
        });

        it('should update flash sale when submitted', async () => {
            vi.mocked(flashSaleService.update).mockResolvedValue(mockAxiosResponse({}));
            renderAdminFlashSaleForm();

            await waitFor(() => {
                expect(screen.getByDisplayValue('30')).toBeInTheDocument();
            });

            const submitButton = screen.getByRole('button', { name: /update/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(flashSaleService.update)).toHaveBeenCalledWith(1, expect.objectContaining({
                    discountPercentage: 30,
                }));
            });
        });

        it('should show error when update fails', async () => {
            vi.mocked(flashSaleService.update).mockRejectedValue({
                response: { data: 'Failed to update' },
            });
            renderAdminFlashSaleForm();

            await waitFor(() => {
                expect(screen.getByDisplayValue('30')).toBeInTheDocument();
            });

            const submitButton = screen.getByRole('button', { name: /update/i });
            await userEvent.click(submitButton);

            expect(await screen.findByText('Failed to update')).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should navigate back when back button clicked', () => {
            renderAdminFlashSaleForm();
            const backButton = screen.getByText(/back/i);
            backButton.click();
            expect(mockNavigate).toHaveBeenCalledWith('/admin/flash-sale');
        });

        it('should navigate back when cancel clicked', () => {
            renderAdminFlashSaleForm();
            const cancelButton = screen.getByText(/cancel/i);
            cancelButton.click();
            expect(mockNavigate).toHaveBeenCalledWith('/admin/flash-sale');
        });
    });
});