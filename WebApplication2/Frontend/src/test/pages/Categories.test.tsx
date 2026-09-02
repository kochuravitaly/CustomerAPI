import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Categories } from '../../pages/Categories';
import { LanguageProvider } from '../../context/LanguageContext';
import { categoryService, productService } from '../../services/product.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useSearchParams: vi.fn(() => [new URLSearchParams(''), vi.fn()]),
    };
});

vi.mock('../../services/product.service', () => ({
    categoryService: {
        getAll: vi.fn(),
    },
    productService: {
        getAll: vi.fn(),
        getBestSellers: vi.fn(),
    },
}));

vi.mock('../../components/ProductCard', () => ({
    ProductCard: ({ product }: any) => <div data-testid="product-card">{product.name}</div>,
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
    { id: 1, name: 'Category 1', description: 'Description 1' },
    { id: 2, name: 'Category 2', description: 'Description 2' },
];

const mockProducts = {
    items: [
        { id: 1, name: 'Product 1', price: 100, stockQuantity: 10, categoryId: 1, categoryName: 'Category 1', createdAt: '', updatedAt: '', images: [] },
        { id: 2, name: 'Product 2', price: 200, stockQuantity: 20, categoryId: 1, categoryName: 'Category 1', createdAt: '', updatedAt: '', images: [] },
    ],
    page: 1,
    pageSize: 50,
    totalCount: 2,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
};

const mockBestSellers = [
    { id: 3, name: 'Best Seller 1', price: 300, stockQuantity: 30, categoryId: 2, categoryName: 'Category 2', createdAt: '', updatedAt: '', images: [] },
];

describe('Categories', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        vi.clearAllMocks();
        vi.mocked(useSearchParams).mockReturnValue([new URLSearchParams(''), vi.fn()]);
    });

    const renderCategories = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <Categories />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    it('should render loading spinner while categories load', () => {
        vi.mocked(categoryService.getAll).mockImplementation(() => new Promise(() => { }));

        renderCategories();

        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render categories in sidebar', async () => {
        vi.mocked(categoryService.getAll).mockResolvedValue(mockAxiosResponse(mockCategories));
        vi.mocked(productService.getAll).mockResolvedValue(mockAxiosResponse(mockProducts));

        renderCategories();

        expect(await screen.findByText('Category 1')).toBeInTheDocument();
        expect(screen.getByText('Category 2')).toBeInTheDocument();
    });

    it('should show error when categories fail to load', async () => {
        vi.mocked(categoryService.getAll).mockRejectedValue(new Error('Network error'));

        renderCategories();

        expect(await screen.findByText('Failed to load categories')).toBeInTheDocument();
    });

    it('should select first category by default', async () => {
        vi.mocked(categoryService.getAll).mockResolvedValue(mockAxiosResponse(mockCategories));
        vi.mocked(productService.getAll).mockResolvedValue(mockAxiosResponse(mockProducts));

        renderCategories();

        expect(await screen.findByText('Product 1')).toBeInTheDocument();
        expect(screen.getByText('Product 2')).toBeInTheDocument();
    });

    it('should show products when category is selected', async () => {
        vi.mocked(categoryService.getAll).mockResolvedValue(mockAxiosResponse(mockCategories));
        vi.mocked(productService.getAll).mockResolvedValue(mockAxiosResponse(mockProducts));

        renderCategories();

        const categoryButton = await screen.findByText('Category 1');
        await userEvent.click(categoryButton);

        await waitFor(() => {
            expect(vi.mocked(productService.getAll)).toHaveBeenCalledWith({
                categoryId: 1,
                page: 1,
                pageSize: 50,
                sortBy: 'createdAt',
                sortDirection: 'desc',
            });
        });
    });

    it('should show no products message when category is empty', async () => {
        const emptyProducts = { ...mockProducts, items: [] };

        vi.mocked(categoryService.getAll).mockResolvedValue(mockAxiosResponse(mockCategories));
        vi.mocked(productService.getAll).mockResolvedValue(mockAxiosResponse(emptyProducts));

        renderCategories();

        expect(await screen.findByText(/no items/i)).toBeInTheDocument();
    });

    it('should show error when products fail to load', async () => {
        vi.mocked(categoryService.getAll).mockResolvedValue(mockAxiosResponse(mockCategories));
        vi.mocked(productService.getAll).mockRejectedValue(new Error('Network error'));

        renderCategories();

        expect(await screen.findByText('Failed to load products')).toBeInTheDocument();
    });

    it('should switch to best sellers when button clicked', async () => {
        vi.mocked(categoryService.getAll).mockResolvedValue(mockAxiosResponse(mockCategories));
        vi.mocked(productService.getAll).mockResolvedValue(mockAxiosResponse(mockProducts));
        vi.mocked(productService.getBestSellers).mockResolvedValue(mockAxiosResponse(mockBestSellers));

        renderCategories();

        const bestSellersButton = await screen.findByText(/best sellers/i);
        await userEvent.click(bestSellersButton);

        expect(await screen.findByText('Best Seller 1')).toBeInTheDocument();
    });

    it('should show best sellers from URL param', async () => {
        vi.mocked(categoryService.getAll).mockResolvedValue(mockAxiosResponse(mockCategories));
        vi.mocked(productService.getBestSellers).mockResolvedValue(mockAxiosResponse(mockBestSellers));

        const mockSearchParams = new URLSearchParams('section=bestsellers');
        vi.mocked(useSearchParams).mockReturnValue([mockSearchParams, vi.fn()]);

        renderCategories();

        expect(await screen.findByText('Best Seller 1')).toBeInTheDocument();
    });

    it('should show error when best sellers fail to load', async () => {
        vi.mocked(categoryService.getAll).mockResolvedValue(mockAxiosResponse(mockCategories));
        vi.mocked(productService.getBestSellers).mockRejectedValue(new Error('Network error'));

        renderCategories();

        const bestSellersButton = await screen.findByText(/best sellers/i);
        await userEvent.click(bestSellersButton);

        expect(await screen.findByText('Failed to load best sellers')).toBeInTheDocument();
    });

    it('should show no items when best sellers is empty', async () => {
        vi.mocked(categoryService.getAll).mockResolvedValue(mockAxiosResponse(mockCategories));
        vi.mocked(productService.getBestSellers).mockResolvedValue(mockAxiosResponse([]));

        renderCategories();

        const bestSellersButton = await screen.findByText(/best sellers/i);
        await userEvent.click(bestSellersButton);

        expect(await screen.findByText(/no items/i)).toBeInTheDocument();
    });

    it('should switch back to categories when category clicked', async () => {
        vi.mocked(categoryService.getAll).mockResolvedValue(mockAxiosResponse(mockCategories));
        vi.mocked(productService.getAll).mockResolvedValue(mockAxiosResponse(mockProducts));
        vi.mocked(productService.getBestSellers).mockResolvedValue(mockAxiosResponse(mockBestSellers));

        renderCategories();

        const bestSellersButton = await screen.findByText(/best sellers/i);
        await userEvent.click(bestSellersButton);

        expect(await screen.findByText('Best Seller 1')).toBeInTheDocument();

        const categoryButton = screen.getByText('Category 1');
        await userEvent.click(categoryButton);

        expect(await screen.findByText('Product 1')).toBeInTheDocument();
    });
});