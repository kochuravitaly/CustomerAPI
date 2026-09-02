import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminDashboard } from '../../../pages/admin/AdminDashboard';
import { LanguageProvider } from '../../../context/LanguageContext';
import { productService, categoryService } from '../../../services/product.service';
import { orderService } from '../../../services/order.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../../../services/product.service', () => ({
    productService: {
        getAll: vi.fn(),
    },
    categoryService: {
        getAll: vi.fn(),
    },
}));

vi.mock('../../../services/order.service', () => ({
    orderService: {
        getMyOrders: vi.fn(),
    },
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

const mockProductsData = {
    items: [],
    page: 1,
    pageSize: 1,
    totalCount: 15,
    totalPages: 15,
    hasPreviousPage: false,
    hasNextPage: true,
};

const mockCategories = [
    { id: 1, name: 'Category 1', nameTranslations: { en: 'Category 1' }, description: '' },
    { id: 2, name: 'Category 2', nameTranslations: { en: 'Category 2' }, description: '' },
];

const mockOrders = [
    { id: 'order-1', totalAmount: 100, status: 0, createdAt: '', items: [] },
    { id: 'order-2', totalAmount: 200, status: 1, createdAt: '', items: [] },
    { id: 'order-3', totalAmount: 300, status: 2, createdAt: '', items: [] },
];

describe('AdminDashboard', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        vi.clearAllMocks();
        vi.mocked(productService.getAll).mockResolvedValue(mockAxiosResponse(mockProductsData));
        vi.mocked(categoryService.getAll).mockResolvedValue(mockAxiosResponse(mockCategories));
        vi.mocked(orderService.getMyOrders).mockResolvedValue(mockAxiosResponse(mockOrders));
    });

    const renderAdminDashboard = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <AdminDashboard />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Display', () => {
        it('should show logo', () => {
            renderAdminDashboard();
            expect(screen.getByText('CheyenneShop')).toBeInTheDocument();
        });

        it('should show dashboard title', () => {
            renderAdminDashboard();
            expect(screen.getByRole('heading', { name: /admin panel/i })).toBeInTheDocument();
        });

        it('should show products count', async () => {
            renderAdminDashboard();
            expect(await screen.findByText('15')).toBeInTheDocument();
        });

        it('should show categories count', async () => {
            renderAdminDashboard();
            expect(await screen.findByText('2')).toBeInTheDocument();
        });

        it('should show orders count', async () => {
            renderAdminDashboard();
            expect(await screen.findByText('3')).toBeInTheDocument();
        });

        it('should show total revenue', async () => {
            renderAdminDashboard();
            expect(await screen.findByText('$600.00')).toBeInTheDocument();
        });
    });

    describe('Navigation Links', () => {
        it('should have manage products link', () => {
            renderAdminDashboard();
            const link = screen.getByText(/manage products/i);
            expect(link.closest('a')).toHaveAttribute('href', '/admin/products');
        });

        it('should have manage categories link', () => {
            renderAdminDashboard();
            const link = screen.getByText(/manage categories/i);
            expect(link.closest('a')).toHaveAttribute('href', '/admin/categories');
        });

        it('should have manage attributes link', () => {
            renderAdminDashboard();
            const link = screen.getByText(/manage attributes/i);
            expect(link.closest('a')).toHaveAttribute('href', '/admin/attributes');
        });

        it('should have manage home sections link', () => {
            renderAdminDashboard();
            const link = screen.getByText(/manage homepage sections/i);
            expect(link.closest('a')).toHaveAttribute('href', '/admin/home-sections');
        });

        it('should have manage coupons link', () => {
            renderAdminDashboard();
            const link = screen.getByText(/manage coupons/i);
            expect(link.closest('a')).toHaveAttribute('href', '/admin/coupons');
        });

        it('should have manage flash sales link', () => {
            renderAdminDashboard();
            const link = screen.getByText(/manage flash sales/i);
            expect(link.closest('a')).toHaveAttribute('href', '/admin/flash-sale');
        });
    });

    describe('Loading States', () => {
        it('should show 0 for products while loading', () => {
            vi.mocked(productService.getAll).mockImplementation(() => new Promise(() => { }));
            renderAdminDashboard();
            expect(screen.getAllByText('0').length).toBeGreaterThan(0);
        });

        it('should show 0 for revenue while loading', () => {
            vi.mocked(orderService.getMyOrders).mockImplementation(() => new Promise(() => { }));
            renderAdminDashboard();
            expect(screen.getByText('$0.00')).toBeInTheDocument();
        });
    });

    describe('Stats Cards', () => {
        it('should show stat icons', () => {
            renderAdminDashboard();
            expect(screen.getAllByText('📦')).toHaveLength(2);
            expect(screen.getAllByText('🗂️')).toHaveLength(2);
            expect(screen.getByText('📋')).toBeInTheDocument();
            expect(screen.getByText('💰')).toBeInTheDocument();
        });
    });
});