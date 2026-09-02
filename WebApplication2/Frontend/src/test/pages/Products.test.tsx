import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Products } from '../../pages/Products';
import { LanguageProvider } from '../../context/LanguageContext';
import { productService, categoryService } from '../../services/product.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useSearchParams: vi.fn(() => [new URLSearchParams(''), vi.fn()]),
    };
});

vi.mock('../../services/product.service', () => ({
    productService: {
        getAll: vi.fn(),
    },
    categoryService: {
        getAll: vi.fn(),
    },
}));

vi.mock('../../components/ProductCard', () => ({
    ProductCard: ({ product }: any) => <div data-testid="product-card">{product.name}</div>,
}));

vi.mock('../../components/Pagination', () => ({
    Pagination: ({ currentPage, totalPages, onPageChange }: any) => (
        <div data-testid="pagination">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>Prev</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>Next</button>
        </div>
    ),
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
    { id: 1, name: 'Category 1', nameTranslations: { en: 'Category 1' }, description: '' },
    { id: 2, name: 'Category 2', nameTranslations: { en: 'Category 2' }, description: '' },
];

const mockProductsData = {
    items: [
        { id: 1, name: 'Product 1', price: 100, stockQuantity: 10, categoryId: 1, categoryName: 'Category 1', createdAt: '', updatedAt: '', images: [] },
        { id: 2, name: 'Product 2', price: 200, stockQuantity: 20, categoryId: 2, categoryName: 'Category 2', createdAt: '', updatedAt: '', images: [] },
    ],
    page: 1,
    pageSize: 12,
    totalCount: 2,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
};

describe('Products', () => {
    let queryClient: QueryClient;
    const mockSetSearchParams = vi.fn();

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        vi.clearAllMocks();
        vi.mocked(useSearchParams).mockReturnValue([new URLSearchParams(''), mockSetSearchParams]);
        vi.mocked(productService.getAll).mockResolvedValue(mockAxiosResponse(mockProductsData));
        vi.mocked(categoryService.getAll).mockResolvedValue(mockAxiosResponse(mockCategories));
    });

    const renderProducts = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <Products />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Loading and Error States', () => {
        it('should show loading spinner while products load', () => {
            vi.mocked(productService.getAll).mockImplementation(() => new Promise(() => { }));
            renderProducts();
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });

        it('should show error when products fail to load', async () => {
            vi.mocked(productService.getAll).mockRejectedValue(new Error('Network error'));
            renderProducts();
            expect(await screen.findByText('Failed to load products')).toBeInTheDocument();
        });

        it('should show error when categories fail to load', async () => {
            vi.mocked(categoryService.getAll).mockRejectedValue(new Error('Network error'));
            renderProducts();
            expect(await screen.findByText('Failed to load categories')).toBeInTheDocument();
        });
    });

    describe('Product Display', () => {
        it('should display products', async () => {
            renderProducts();
            expect(await screen.findByText('Product 1')).toBeInTheDocument();
            expect(screen.getByText('Product 2')).toBeInTheDocument();
        });

        it('should display total count', async () => {
            renderProducts();
            expect(await screen.findByText(/2.*found/i)).toBeInTheDocument();
        });

        it('should show no products message when empty', async () => {
            vi.mocked(productService.getAll).mockResolvedValue(mockAxiosResponse({ ...mockProductsData, items: [], totalCount: 0 }));
            renderProducts();
            expect(await screen.findByText(/no products/i)).toBeInTheDocument();
        });
    });

    describe('Category Filter', () => {
        it('should display all categories', async () => {
            renderProducts();
            expect(await screen.findByText('Category 1')).toBeInTheDocument();
            expect(screen.getByText('Category 2')).toBeInTheDocument();
        });

        it('should show all categories button as active by default', async () => {
            renderProducts();
            const allButton = await screen.findByText(/all categories/i);
            expect(allButton).toHaveClass('active');
        });

        it('should filter by category when clicked', async () => {
            renderProducts();
            const categoryButton = await screen.findByText('Category 1');
            await userEvent.click(categoryButton);

            await waitFor(() => {
                expect(vi.mocked(productService.getAll)).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 1 }));
            });
        });

        it('should clear category filter when all categories clicked', async () => {
            renderProducts();
            const categoryButton = await screen.findByText('Category 1');
            await userEvent.click(categoryButton);

            const allButton = screen.getByText(/all categories/i);
            await userEvent.click(allButton);

            await waitFor(() => {
                expect(vi.mocked(productService.getAll)).toHaveBeenCalledWith(expect.objectContaining({ categoryId: undefined }));
            });
        });
    });

    describe('Search', () => {
        it('should search when form submitted', async () => {
            renderProducts();
            const searchInput = screen.getByPlaceholderText(/search/i);
            await userEvent.type(searchInput, 'test product');

            const searchButton = screen.getByRole('button', { name: /search/i });
            await userEvent.click(searchButton);

            await waitFor(() => {
                expect(vi.mocked(productService.getAll)).toHaveBeenCalledWith(expect.objectContaining({ search: 'test product' }));
            });
        });
    });

    describe('Price Filter', () => {
        it('should apply price filter', async () => {
            renderProducts();
            const minInput = screen.getByPlaceholderText(/min/i);
            const maxInput = screen.getByPlaceholderText(/max/i);

            await userEvent.type(minInput, '50');
            await userEvent.type(maxInput, '150');

            const applyButton = screen.getByText(/apply filter/i);
            await userEvent.click(applyButton);

            await waitFor(() => {
                expect(vi.mocked(productService.getAll)).toHaveBeenCalledWith(expect.objectContaining({ minPrice: 50, maxPrice: 150 }));
            });
        });

        it('should show error when min price is greater than max price', async () => {
            renderProducts();
            const minInput = screen.getByPlaceholderText(/min/i);
            const maxInput = screen.getByPlaceholderText(/max/i);

            await userEvent.type(minInput, '200');
            await userEvent.type(maxInput, '100');

            const applyButton = screen.getByText(/apply filter/i);
            await userEvent.click(applyButton);

            expect(await screen.findByText('Minimum price cannot be greater than maximum price')).toBeInTheDocument();
        });
    });

    describe('Sort', () => {
        it('should sort by price when selected', async () => {
            renderProducts();
            const sortSelect = screen.getByRole('combobox');
            await userEvent.selectOptions(sortSelect, 'price');

            await waitFor(() => {
                expect(vi.mocked(productService.getAll)).toHaveBeenCalledWith(expect.objectContaining({ sortBy: 'price', sortDirection: 'asc' }));
            });
        });

        it('should sort by name when selected', async () => {
            renderProducts();
            const sortSelect = screen.getByRole('combobox');
            await userEvent.selectOptions(sortSelect, 'name');

            await waitFor(() => {
                expect(vi.mocked(productService.getAll)).toHaveBeenCalledWith(expect.objectContaining({ sortBy: 'name' }));
            });
        });
    });

    describe('Pagination', () => {
        it('should display pagination when multiple pages', async () => {
            vi.mocked(productService.getAll).mockResolvedValue(mockAxiosResponse({ ...mockProductsData, totalPages: 3 }));
            renderProducts();
            expect(await screen.findByTestId('pagination')).toBeInTheDocument();
        });

        it('should change page when next clicked', async () => {
            vi.mocked(productService.getAll).mockResolvedValue(mockAxiosResponse({ ...mockProductsData, totalPages: 3, hasNextPage: true }));
            renderProducts();

            const nextButton = await screen.findByText('Next');
            await userEvent.click(nextButton);

            await waitFor(() => {
                expect(vi.mocked(productService.getAll)).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
            });
        });
    });

    describe('URL Params', () => {
        it('should initialize from URL params', () => {
            const params = new URLSearchParams('search=test&categoryId=1&page=2');
            vi.mocked(useSearchParams).mockReturnValue([params, mockSetSearchParams]);

            renderProducts();

            expect(vi.mocked(productService.getAll)).toHaveBeenCalledWith(expect.objectContaining({
                search: 'test',
                categoryId: 1,
                page: 2,
            }));
        });
    });
});