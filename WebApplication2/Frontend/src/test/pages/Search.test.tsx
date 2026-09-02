import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Search } from '../../pages/Search';
import { LanguageProvider } from '../../context/LanguageContext';
import { productService } from '../../services/product.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../../services/product.service', () => ({
    productService: {
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

const mockProductsData = {
    items: [
        { id: 1, name: 'Product 1', price: 100, stockQuantity: 10, categoryId: 1, categoryName: 'Category 1', createdAt: '', updatedAt: '', images: [] },
        { id: 2, name: 'Product 2', price: 200, stockQuantity: 20, categoryId: 1, categoryName: 'Category 1', createdAt: '', updatedAt: '', images: [] },
    ],
    page: 1,
    pageSize: 20,
    totalCount: 2,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
};

describe('Search', () => {
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
        vi.mocked(productService.getAll).mockResolvedValue(mockAxiosResponse(mockProductsData));
    });

    const renderSearch = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <Search />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Initial State', () => {
        it('should show search input', () => {
            renderSearch();
            expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
        });

        it('should show empty state icon', () => {
            renderSearch();
            expect(screen.getAllByText('🔍')).toHaveLength(2);
        });

        it('should show back button', () => {
            renderSearch();
            expect(screen.getByText('←')).toBeInTheDocument();
        });
    });

    describe('Search History', () => {
        it('should show history when input focused', async () => {
            localStorage.setItem('searchHistory', JSON.stringify(['test search']));
            renderSearch();

            const input = screen.getByPlaceholderText(/search/i);
            await userEvent.click(input);

            expect(await screen.findByText('History')).toBeInTheDocument();
            expect(screen.getByText('test search')).toBeInTheDocument();
        });

        it('should search when history item clicked', async () => {
            localStorage.setItem('searchHistory', JSON.stringify(['test search']));
            renderSearch();

            const input = screen.getByPlaceholderText(/search/i);
            await userEvent.click(input);

            const historyItem = await screen.findByText('test search');
            await userEvent.click(historyItem);

            await waitFor(() => {
                expect(vi.mocked(productService.getAll)).toHaveBeenCalledWith(expect.objectContaining({ search: 'test search' }));
            });
        });

        it('should clear history when clear clicked', async () => {
            localStorage.setItem('searchHistory', JSON.stringify(['test search']));
            renderSearch();

            const input = screen.getByPlaceholderText(/search/i);
            await userEvent.click(input);

            const clearButton = await screen.findByText('Clear');
            await userEvent.click(clearButton);

            expect(screen.queryByText('test search')).not.toBeInTheDocument();
            expect(localStorage.getItem('searchHistory')).toBeNull();
        });
    });

    describe('Search', () => {
        it('should search when form submitted', async () => {
            renderSearch();

            const input = screen.getByPlaceholderText(/search/i);
            await userEvent.type(input, 'test product');

            const submitButton = document.querySelector('.search-submit-btn') as HTMLElement;
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(productService.getAll)).toHaveBeenCalledWith(expect.objectContaining({ search: 'test product' }));
            });
        });

        it('should save search to history', async () => {
            renderSearch();

            const input = screen.getByPlaceholderText(/search/i);
            await userEvent.type(input, 'test product');

            const submitButton = document.querySelector('.search-submit-btn') as HTMLElement;
            await userEvent.click(submitButton);

            expect(localStorage.getItem('searchHistory')).toContain('test product');
        });

        it('should not search when input is empty', async () => {
            renderSearch();

            const submitButton = document.querySelector('.search-submit-btn') as HTMLElement;
            await userEvent.click(submitButton);

            expect(vi.mocked(productService.getAll)).not.toHaveBeenCalled();
        });
    });

    describe('Results', () => {
        it('should show results after search', async () => {
            renderSearch();

            const input = screen.getByPlaceholderText(/search/i);
            await userEvent.type(input, 'test');

            const submitButton = document.querySelector('.search-submit-btn') as HTMLElement;
            await userEvent.click(submitButton);

            expect(await screen.findByText('Product 1')).toBeInTheDocument();
            expect(screen.getByText('Product 2')).toBeInTheDocument();
        });

        it('should show results count', async () => {
            renderSearch();

            const input = screen.getByPlaceholderText(/search/i);
            await userEvent.type(input, 'test');

            const submitButton = document.querySelector('.search-submit-btn') as HTMLElement;
            await userEvent.click(submitButton);

            expect(await screen.findByText(/2.*results found/i)).toBeInTheDocument();
        });

        it('should show no products message when empty', async () => {
            vi.mocked(productService.getAll).mockResolvedValue(mockAxiosResponse({ ...mockProductsData, items: [], totalCount: 0 }));
            renderSearch();

            const input = screen.getByPlaceholderText(/search/i);
            await userEvent.type(input, 'nonexistent');

            const submitButton = document.querySelector('.search-submit-btn') as HTMLElement;
            await userEvent.click(submitButton);

            expect(await screen.findByText(/no products found/i)).toBeInTheDocument();
        });

        it('should show error when search fails', async () => {
            vi.mocked(productService.getAll).mockRejectedValue(new Error('Network error'));
            renderSearch();

            const input = screen.getByPlaceholderText(/search/i);
            await userEvent.type(input, 'test');

            const submitButton = document.querySelector('.search-submit-btn') as HTMLElement;
            await userEvent.click(submitButton);

            expect(await screen.findByText('Failed to load search results')).toBeInTheDocument();
        });
    });

    describe('Filters', () => {
        it('should open filters panel when clicked', async () => {
            renderSearch();

            const input = screen.getByPlaceholderText(/search/i);
            await userEvent.type(input, 'test');
            const submitButton = document.querySelector('.search-submit-btn') as HTMLElement;
            await userEvent.click(submitButton);

            const filtersButton = await screen.findByText(/filters/i);
            await userEvent.click(filtersButton);

            expect(await screen.findByPlaceholderText(/min/i)).toBeInTheDocument();
        });

        it('should apply price filter', async () => {
            renderSearch();

            const input = screen.getByPlaceholderText(/search/i);
            await userEvent.type(input, 'test');
            const submitButton = document.querySelector('.search-submit-btn') as HTMLElement;
            await userEvent.click(submitButton);

            const filtersButton = await screen.findByText(/filters/i);
            await userEvent.click(filtersButton);

            const minInput = screen.getByPlaceholderText(/min/i);
            const maxInput = screen.getByPlaceholderText(/max/i);
            await userEvent.type(minInput, '50');
            await userEvent.type(maxInput, '150');

            const applyButton = screen.getByText(/apply/i);
            await userEvent.click(applyButton);

            await waitFor(() => {
                expect(vi.mocked(productService.getAll)).toHaveBeenCalledWith(expect.objectContaining({ minPrice: 50, maxPrice: 150 }));
            });
        });

        it('should show error when min price is greater than max', async () => {
            renderSearch();

            const input = screen.getByPlaceholderText(/search/i);
            await userEvent.type(input, 'test');
            const submitButton = document.querySelector('.search-submit-btn') as HTMLElement;
            await userEvent.click(submitButton);

            const filtersButton = await screen.findByText(/filters/i);
            await userEvent.click(filtersButton);

            const minInput = screen.getByPlaceholderText(/min/i);
            const maxInput = screen.getByPlaceholderText(/max/i);
            await userEvent.type(minInput, '200');
            await userEvent.type(maxInput, '100');

            const applyButton = screen.getByText(/apply/i);
            await userEvent.click(applyButton);

            expect(await screen.findByText('Minimum price cannot be greater than maximum price')).toBeInTheDocument();
        });
    });

    describe('Sort', () => {
        it('should open sort panel when clicked', async () => {
            renderSearch();

            const input = screen.getByPlaceholderText(/search/i);
            await userEvent.type(input, 'test');
            const submitButton = document.querySelector('.search-submit-btn') as HTMLElement;
            await userEvent.click(submitButton);

            const sortButton = await screen.findByText(/sort by/i);
            await userEvent.click(sortButton);

            expect(await screen.findByText(/newest/i)).toBeInTheDocument();
        });

        it('should sort by price when clicked', async () => {
            renderSearch();

            const input = screen.getByPlaceholderText(/search/i);
            await userEvent.type(input, 'test');
            const submitButton = document.querySelector('.search-submit-btn') as HTMLElement;
            await userEvent.click(submitButton);

            const sortButton = await screen.findByText(/sort by/i);
            await userEvent.click(sortButton);

            const priceOption = await screen.findByText(/price: low to high/i);
            await userEvent.click(priceOption);

            await waitFor(() => {
                expect(vi.mocked(productService.getAll)).toHaveBeenCalledWith(expect.objectContaining({ sortBy: 'price', sortDirection: 'asc' }));
            });
        });
    });

    describe('Navigation', () => {
        it('should navigate back when back button clicked', () => {
            renderSearch();
            const backButton = screen.getByText('←');
            backButton.click();
            expect(mockNavigate).toHaveBeenCalledWith(-1);
        });

        it('should navigate to home when logo clicked', async () => {
            renderSearch();

            const input = screen.getByPlaceholderText(/search/i);
            await userEvent.type(input, 'test');
            const submitButton = document.querySelector('.search-submit-btn') as HTMLElement;
            await userEvent.click(submitButton);

            const logoButton = await screen.findByText('CheyenneShop');
            await userEvent.click(logoButton);

            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });
});