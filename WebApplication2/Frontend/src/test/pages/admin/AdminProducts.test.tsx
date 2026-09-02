import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminProducts } from '../../../pages/admin/AdminProducts';
import { LanguageProvider } from '../../../context/LanguageContext';
import { productService, categoryService } from '../../../services/product.service';

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
        delete: vi.fn(),
    },
    categoryService: {
        getAll: vi.fn(),
    },
}));

vi.mock('../../../components/LoadingSpinner', () => ({
    LoadingSpinner: () => <div>Loading...</div>,
}));

vi.mock('../../../components/Pagination', () => ({
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

const mockProducts = {
    items: [
        {
            id: 1,
            name: 'Product 1',
            nameTranslations: { en: 'Product 1' },
            price: 100,
            stockQuantity: 10,
            categoryId: 1,
            categoryName: 'Category 1',
            createdAt: '',
            updatedAt: '',
            images: [{ id: 1, productId: 1, fileName: 'img.jpg', contentType: 'image/jpeg', fileSize: 100, sortOrder: 1, isMain: true, objectKey: 'key' }],
        },
        {
            id: 2,
            name: 'Product 2',
            nameTranslations: { en: 'Product 2' },
            price: 200,
            stockQuantity: 0,
            categoryId: 2,
            categoryName: 'Category 2',
            createdAt: '',
            updatedAt: '',
            images: [],
        },
    ],
    page: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
};

const mockCategories = [
    { id: 1, name: 'Category 1', nameTranslations: { en: 'Category 1' }, description: '' },
    { id: 2, name: 'Category 2', nameTranslations: { en: 'Category 2' }, description: '' },
];

describe('AdminProducts', () => {
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
        vi.mocked(productService.getAll).mockResolvedValue(mockAxiosResponse(mockProducts));
        vi.mocked(categoryService.getAll).mockResolvedValue(mockAxiosResponse(mockCategories));
    });

    const renderAdminProducts = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <AdminProducts />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Loading and Error States', () => {
        it('should show loading spinner while products load', () => {
            vi.mocked(productService.getAll).mockImplementation(() => new Promise(() => { }));
            renderAdminProducts();
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });

        it('should show error when products fail to load', async () => {
            vi.mocked(productService.getAll).mockRejectedValue(new Error('Network error'));
            renderAdminProducts();
            expect(await screen.findByText('Failed to load products')).toBeInTheDocument();
        });
    });

    describe('Display', () => {
        it('should display products table', async () => {
            renderAdminProducts();
            expect(await screen.findByText('Product 1')).toBeInTheDocument();
            expect(screen.getByText('Product 2')).toBeInTheDocument();
        });

        it('should display product prices', async () => {
            renderAdminProducts();
            expect(await screen.findByText('$100.00')).toBeInTheDocument();
            expect(screen.getByText('$200.00')).toBeInTheDocument();
        });

        it('should display stock quantities', async () => {
            renderAdminProducts();
            expect(await screen.findByText('10')).toBeInTheDocument();
            expect(screen.getByText('0')).toBeInTheDocument();
        });

        it('should display add product button', async () => {
            renderAdminProducts();
            expect(await screen.findByText(/add product/i)).toBeInTheDocument();
        });

        it('should show no items message when empty', async () => {
            vi.mocked(productService.getAll).mockResolvedValue(mockAxiosResponse({ ...mockProducts, items: [], totalCount: 0 }));
            renderAdminProducts();
            expect(await screen.findByText(/no items/i)).toBeInTheDocument();
        });
    });

    describe('Search', () => {
        it('should search when form submitted', async () => {
            renderAdminProducts();
            const searchInput = await screen.findByPlaceholderText(/search/i);
            await userEvent.type(searchInput, 'test');
            const submitButton = screen.getByText('🔍');
            await userEvent.click(submitButton);
            await waitFor(() => {
                expect(vi.mocked(productService.getAll)).toHaveBeenCalledWith(expect.objectContaining({ search: 'test' }));
            });
        });

        it('should save search to history', async () => {
            renderAdminProducts();
            const searchInput = await screen.findByPlaceholderText(/search/i);
            await userEvent.type(searchInput, 'test');
            await userEvent.click(screen.getByText('🔍'));
            expect(localStorage.getItem('adminSearchHistory')).toContain('test');
        });

        it('should show search history', async () => {
            localStorage.setItem('adminSearchHistory', JSON.stringify(['test search']));
            renderAdminProducts();
            const searchInput = await screen.findByPlaceholderText(/search/i);
            await userEvent.click(searchInput);
            await waitFor(() => {
                expect(screen.getByText(/test search/i)).toBeInTheDocument();
            });
        });

        it('should clear search history', async () => {
            localStorage.setItem('adminSearchHistory', JSON.stringify(['test search']));
            renderAdminProducts();
            const searchInput = await screen.findByPlaceholderText(/search/i);
            await userEvent.click(searchInput);
            const clearButton = await screen.findByText(/clear/i);
            await userEvent.click(clearButton);
            expect(localStorage.getItem('adminSearchHistory')).toBeNull();
        });
    });

    describe('Delete Product', () => {
        it('should show confirmation modal when delete clicked', async () => {
            renderAdminProducts();
            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);
            await waitFor(() => {
                expect(screen.getAllByText(/are you sure/i).length).toBe(2);
            });
        });

        it('should call delete when confirmed', async () => {
            vi.mocked(productService.delete).mockResolvedValue(mockAxiosResponse({}));
            renderAdminProducts();
            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);
            const confirmButton = document.querySelector('.modal-actions .btn-danger') as HTMLElement;
            fireEvent.click(confirmButton);
            await waitFor(() => {
                expect(vi.mocked(productService.delete)).toHaveBeenCalledWith(1);
            });
        });

        it('should show error when delete fails', async () => {
            vi.mocked(productService.delete).mockRejectedValue({
                response: { data: 'Failed to delete product' },
            });
            renderAdminProducts();
            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);
            const confirmButton = document.querySelector('.modal-actions .btn-danger') as HTMLElement;
            fireEvent.click(confirmButton);
            await waitFor(() => {
                expect(screen.getByText('Failed to delete product')).toBeInTheDocument();
            });
        });

        it('should close modal when cancel clicked', async () => {
            renderAdminProducts();
            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            await userEvent.click(deleteButtons[0]);
            const cancelButton = await screen.findByText(/cancel/i);
            await userEvent.click(cancelButton);
            expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
        });
    });

    describe('Sort', () => {
        it('should sort by name', async () => {
            renderAdminProducts();
            await waitFor(() => {
                expect(document.querySelectorAll('select').length).toBe(2);
            });
            const selects = document.querySelectorAll('select');
            await userEvent.selectOptions(selects[0], 'name');
            await waitFor(() => {
                expect(vi.mocked(productService.getAll)).toHaveBeenCalledWith(expect.objectContaining({ sortBy: 'name' }));
            });
        });

        it('should change sort direction', async () => {
            renderAdminProducts();
            await waitFor(() => {
                expect(document.querySelectorAll('select').length).toBe(2);
            });
            const selects = document.querySelectorAll('select');
            await userEvent.selectOptions(selects[1], 'desc');
            await waitFor(() => {
                expect(vi.mocked(productService.getAll)).toHaveBeenCalledWith(expect.objectContaining({ sortDirection: 'desc' }));
            });
        });
    });

    describe('Navigation', () => {
        it('should navigate back to admin', async () => {
            renderAdminProducts();
            const backButton = await screen.findByText(/back/i);
            await userEvent.click(backButton);
            expect(mockNavigate).toHaveBeenCalledWith('/admin');
        });
    });
});