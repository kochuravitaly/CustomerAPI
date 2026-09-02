import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductCard } from '../../components/ProductCard';
import { LanguageProvider } from '../../context/LanguageContext';
import { AuthProvider } from '../../context/AuthContext';
import { flashSaleService } from '../../services/coupon.service';
import { wishlistService } from '../../services/wishlist.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../../services/coupon.service', () => ({
    flashSaleService: {
        getActive: vi.fn(),
    },
}));

vi.mock('../../services/wishlist.service', () => ({
    wishlistService: {
        isInWishlist: vi.fn(),
        addToWishlist: vi.fn(),
        removeFromWishlist: vi.fn(),
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

const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxMjM0NTY3OCIsInJvbGUiOiJDdXN0b21lciIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.fakeSignature';

const mockProduct = {
    id: 1,
    name: 'Test Product',
    nameTranslations: { en: 'Test Product' },
    description: 'This is a test product description that is long enough to be truncated',
    descriptionTranslations: { en: 'This is a test product description that is long enough to be truncated' },
    price: 100,
    stockQuantity: 10,
    categoryId: 1,
    categoryName: 'Category 1',
    createdAt: '',
    updatedAt: '',
    images: [
        { id: 1, productId: 1, fileName: 'img.jpg', contentType: 'image/jpeg', fileSize: 100, sortOrder: 1, isMain: true, objectKey: 'key' },
    ],
};

const mockProductNoImage = {
    ...mockProduct,
    images: [],
};

const mockProductOutOfStock = {
    ...mockProduct,
    stockQuantity: 0,
};

describe('ProductCard', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        localStorage.clear();
        vi.clearAllMocks();
        vi.mocked(flashSaleService.getActive).mockResolvedValue(mockAxiosResponse([]));
        vi.mocked(wishlistService.isInWishlist).mockResolvedValue(mockAxiosResponse(false));
    });

    const renderProductCard = (product = mockProduct) => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <AuthProvider>
                        <MemoryRouter>
                            <ProductCard product={product} />
                        </MemoryRouter>
                    </AuthProvider>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Display', () => {
        it('should show product name', async () => {
            renderProductCard();
            expect(await screen.findByText('Test Product')).toBeInTheDocument();
        });

        it('should show product price', async () => {
            renderProductCard();
            expect(await screen.findByText('$100.00')).toBeInTheDocument();
        });

        it('should show product image', async () => {
            renderProductCard();
            await waitFor(() => {
                const img = document.querySelector('img');
                expect(img).toBeInTheDocument();
            });
        });

        it('should show placeholder when no image', async () => {
            renderProductCard(mockProductNoImage);
            await waitFor(() => {
                const placeholder = document.querySelector('.placeholder-image');
                expect(placeholder).toBeInTheDocument();
            });
        });

        it('should show out of stock badge', async () => {
            renderProductCard(mockProductOutOfStock);
            await waitFor(() => {
                expect(screen.getAllByText(/out of stock/i).length).toBe(2);
            });
        });

        it('should show stock quantity', async () => {
            renderProductCard();
            expect(await screen.findByText(/10.*in stock/i)).toBeInTheDocument();
        });

        it('should truncate long description', async () => {
            const longDescription = 'This is a very long description that exceeds one hundred characters to test truncation behavior properly in the ProductCard component';
            const longDescriptionProduct = {
                ...mockProduct,
                description: longDescription,
                descriptionTranslations: { en: longDescription },
            };
            renderProductCard(longDescriptionProduct);
            const description = await screen.findByText(/very long description/i);
            expect(description.textContent).toContain('...');
        });
    });

    describe('Wishlist', () => {
        it('should show empty heart for non-wishlist', async () => {
            renderProductCard();
            await waitFor(() => {
                expect(screen.getByText('🤍')).toBeInTheDocument();
            });
        });

        it('should show filled heart for wishlist', async () => {
            localStorage.setItem('accessToken', mockToken);
            localStorage.setItem('refreshToken', 'refresh-token');
            vi.mocked(wishlistService.isInWishlist).mockResolvedValue(mockAxiosResponse(true));
            renderProductCard();
            await waitFor(() => {
                expect(screen.getByText('❤️')).toBeInTheDocument();
            });
        });

        it('should add to wishlist when heart clicked', async () => {
            localStorage.setItem('accessToken', mockToken);
            vi.mocked(wishlistService.addToWishlist).mockResolvedValue(mockAxiosResponse({}));
            renderProductCard();

            const heartButton = await screen.findByText('🤍');
            await userEvent.click(heartButton);

            await waitFor(() => {
                expect(vi.mocked(wishlistService.addToWishlist)).toHaveBeenCalledWith(1);
            });
        });

        it('should remove from wishlist when heart clicked', async () => {
            localStorage.setItem('accessToken', mockToken);
            localStorage.setItem('refreshToken', 'refresh-token');
            vi.mocked(wishlistService.isInWishlist).mockResolvedValue(mockAxiosResponse(true));
            vi.mocked(wishlistService.removeFromWishlist).mockResolvedValue(mockAxiosResponse({}));
            renderProductCard();

            const heartButton = await screen.findByText('❤️');
            await userEvent.click(heartButton);

            await waitFor(() => {
                expect(vi.mocked(wishlistService.removeFromWishlist)).toHaveBeenCalledWith(1);
            });
        });
    });

    describe('Flash Sale', () => {
        it('should show flash sale price', async () => {
            const flashSale = [{
                id: 1,
                discountPercentage: 20,
                productIdsJson: '[1]',
                endsAt: '2024-12-31T23:59:59Z',
            }];
            vi.mocked(flashSaleService.getActive).mockResolvedValue(mockAxiosResponse(flashSale));
            renderProductCard();

            await waitFor(() => {
                expect(screen.getByText('$80.00')).toBeInTheDocument();
            });
        });
    });

    describe('Coupon', () => {
        it('should show coupon discounted price', async () => {
            localStorage.setItem('coupon_1', JSON.stringify({ code: 'SAVE10', discount: 10 }));
            renderProductCard();

            await waitFor(() => {
                expect(screen.getByText('$90.00')).toBeInTheDocument();
            });
        });
    });

    describe('Navigation', () => {
        it('should link to product page', () => {
            renderProductCard();
            const link = document.querySelector('.product-card');
            expect(link).toHaveAttribute('href', '/products/1');
        });
    });
});