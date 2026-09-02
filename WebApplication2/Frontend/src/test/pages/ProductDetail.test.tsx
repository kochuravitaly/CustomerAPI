import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductDetail } from '../../pages/ProductDetail';
import { AuthProvider } from '../../context/AuthContext';
import { LanguageProvider } from '../../context/LanguageContext';
import { productService } from '../../services/product.service';
import { variantService } from '../../services/variant.service';
import { reviewService } from '../../services/review.service';
import { cartService } from '../../services/cart.service';
import { flashSaleService } from '../../services/coupon.service';
import { wishlistService } from '../../services/wishlist.service';
import { apiService } from '../../services/api';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
        useParams: vi.fn(() => ({ id: '1' })),
    };
});

vi.mock('../../services/product.service', () => ({
    productService: {
        getById: vi.fn(),
        getAll: vi.fn(),
    },
}));

vi.mock('../../services/variant.service', () => ({
    variantService: {
        getColors: vi.fn(),
        getVariants: vi.fn(),
    },
}));

vi.mock('../../services/review.service', () => ({
    reviewService: {
        getProductReviews: vi.fn(),
        getProductSummary: vi.fn(),
        canReview: vi.fn(),
        createReview: vi.fn(),
        deleteReview: vi.fn(),
        markHelpful: vi.fn(),
        reportReview: vi.fn(),
        uploadMedia: vi.fn(),
    },
}));

vi.mock('../../services/cart.service', () => ({
    cartService: {
        addItem: vi.fn(),
    },
}));

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

vi.mock('../../services/api', () => ({
    apiService: {
        post: vi.fn(),
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
    nameTranslations: { en: 'Test Product', ru: 'Тестовый продукт' },
    description: 'Test description',
    descriptionTranslations: { en: 'Test description', ru: 'Тестовое описание' },
    price: 100,
    stockQuantity: 10,
    categoryId: 1,
    categoryName: 'Category 1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    images: [
        { id: 1, productId: 1, fileName: 'image1.jpg', contentType: 'image/jpeg', fileSize: 1000, sortOrder: 1, isMain: true, objectKey: 'key1', colorId: null },
        { id: 2, productId: 1, fileName: 'image2.jpg', contentType: 'image/jpeg', fileSize: 1000, sortOrder: 2, isMain: false, objectKey: 'key2', colorId: null },
    ],
    gender: 0,
    styleName: 'Casual',
    styleNameTranslations: { en: 'Casual' },
    occasionName: 'Daily',
    occasionNameTranslations: { en: 'Daily' },
    patternName: 'Solid',
    patternNameTranslations: { en: 'Solid' },
    seasonsJson: '{"en":["Summer","Spring"],"ru":["Лето","Весна"]}',
    ageGroupsJson: '{"en":["Adult","Teen"],"ru":["Взрослый","Подросток"]}',
    materialCompositionJson: '[{"materialId":1,"percentage":100}]',
};

const mockColors = [
    { id: 1, name: 'Red', nameTranslations: { en: 'Red', ru: 'Красный' }, hexCode: '#FF0000' },
    { id: 2, name: 'Blue', nameTranslations: { en: 'Blue', ru: 'Синий' }, hexCode: '#0000FF' },
];

const mockVariants = [
    { colorId: 1, sizeName: 'S', stockQuantity: 5 },
    { colorId: 1, sizeName: 'M', stockQuantity: 3 },
    { colorId: 2, sizeName: 'L', stockQuantity: 0 },
];

const mockReviews = [
    {
        id: 1,
        productId: 1,
        customerName: 'John Doe',
        isAdmin: false,
        rating: 5,
        text: 'Great product!',
        createdAt: '2024-01-01T00:00:00Z',
        media: [
            { id: 1, fileName: 'review1.jpg', mediaType: 'image' },
            { id: 2, fileName: 'review2.mp4', mediaType: 'video' },
        ],
        helpfulCount: 3,
    },
    {
        id: 2,
        productId: 1,
        customerName: 'Jane Smith',
        isAdmin: true,
        rating: 4,
        text: 'Good product',
        createdAt: '2024-01-02T00:00:00Z',
        media: [],
        helpfulCount: 1,
    },
];

const mockReviewSummary = {
    averageRating: 4.5,
    totalReviews: 2,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
};

const mockSimilarProducts = {
    items: [
        { ...mockProduct, id: 2, name: 'Similar Product 1', nameTranslations: { en: 'Similar Product 1' } },
        { ...mockProduct, id: 3, name: 'Similar Product 2', nameTranslations: { en: 'Similar Product 2' } },
    ],
    page: 1,
    pageSize: 5,
    totalCount: 2,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
};

describe('ProductDetail', () => {
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
        localStorage.setItem('accessToken', mockToken);
        localStorage.setItem('refreshToken', 'refresh-token');
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useParams).mockReturnValue({ id: '1' });
        vi.mocked(productService.getById).mockResolvedValue(mockAxiosResponse(mockProduct));
        vi.mocked(productService.getAll).mockResolvedValue(mockAxiosResponse(mockSimilarProducts));
        vi.mocked(variantService.getColors).mockResolvedValue(mockAxiosResponse(mockColors));
        vi.mocked(variantService.getVariants).mockResolvedValue(mockAxiosResponse(mockVariants));
        vi.mocked(reviewService.getProductReviews).mockResolvedValue(mockAxiosResponse(mockReviews));
        vi.mocked(reviewService.getProductSummary).mockResolvedValue(mockAxiosResponse(mockReviewSummary));
        vi.mocked(reviewService.canReview).mockResolvedValue(mockAxiosResponse(true));
        vi.mocked(flashSaleService.getActive).mockResolvedValue(mockAxiosResponse([]));
        vi.mocked(wishlistService.isInWishlist).mockResolvedValue(mockAxiosResponse(false));
        window.scrollTo = vi.fn();
    });

    const renderProductDetail = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <AuthProvider>
                        <MemoryRouter>
                            <ProductDetail />
                        </MemoryRouter>
                    </AuthProvider>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Loading and Error States', () => {
        it('should show loading spinner while product loads', () => {
            vi.mocked(productService.getById).mockImplementation(() => new Promise(() => { }));
            renderProductDetail();
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });

        it('should show error when product not found', async () => {
            vi.mocked(productService.getById).mockResolvedValue(mockAxiosResponse(null));
            renderProductDetail();
            expect(await screen.findByText(/product not found/i)).toBeInTheDocument();
        });

        it('should show error when colors fail to load', async () => {
            vi.mocked(variantService.getColors).mockRejectedValue(new Error('Network error'));
            renderProductDetail();
            expect(await screen.findByText(/failed to load product details/i)).toBeInTheDocument();
        });

        it('should show error when variants fail to load', async () => {
            vi.mocked(variantService.getVariants).mockRejectedValue(new Error('Network error'));
            renderProductDetail();
            expect(await screen.findByText(/failed to load product details/i)).toBeInTheDocument();
        });

        it('should show error when reviews fail to load', async () => {
            vi.mocked(reviewService.getProductReviews).mockRejectedValue(new Error('Network error'));
            renderProductDetail();
            expect(await screen.findByText(/failed to load product details/i)).toBeInTheDocument();
        });
    });

    describe('Product Display', () => {
        it('should display product name', async () => {
            renderProductDetail();
            expect(await screen.findByText('Test Product')).toBeInTheDocument();
        });

        it('should display product description', async () => {
            renderProductDetail();
            expect(await screen.findByText('Test description')).toBeInTheDocument();
        });

        it('should display product price', async () => {
            renderProductDetail();
            expect(await screen.findByText('$100.00')).toBeInTheDocument();
        });

        it('should display product images', async () => {
            renderProductDetail();
            await waitFor(() => {
                const images = screen.getAllByRole('img');
                expect(images.length).toBeGreaterThan(0);
            });
        });

        it('should display gender', async () => {
            renderProductDetail();
            expect(await screen.findByText(/unisex/i)).toBeInTheDocument();
        });

        it('should display seasons', async () => {
            renderProductDetail();
            expect(await screen.findByText(/summer/i)).toBeInTheDocument();
            expect(screen.getByText(/spring/i)).toBeInTheDocument();
        });

        it('should display age groups', async () => {
            renderProductDetail();
            expect(await screen.findByText(/adult/i)).toBeInTheDocument();
            expect(screen.getByText(/teen/i)).toBeInTheDocument();
        });

        it('should display style', async () => {
            renderProductDetail();
            expect(await screen.findByText(/casual/i)).toBeInTheDocument();
        });

        it('should display occasion', async () => {
            renderProductDetail();
            expect(await screen.findByText(/daily/i)).toBeInTheDocument();
        });

        it('should display pattern', async () => {
            renderProductDetail();
            expect(await screen.findByText(/solid/i)).toBeInTheDocument();
        });
    });

    describe('Color Selection', () => {
        it('should display color options', async () => {
            renderProductDetail();
            const colorButtons = await screen.findAllByRole('button', { name: /red|blue/i });
            expect(colorButtons).toHaveLength(2);
        });

        it('should select first color by default', async () => {
            renderProductDetail();
            await waitFor(() => {
                expect(screen.getByText(/red/i)).toBeInTheDocument();
            });
        });

        it('should change color when clicked', async () => {
            renderProductDetail();
            const colorButtons = await screen.findAllByRole('button', { name: /red|blue/i });
            fireEvent.click(colorButtons[1]);
            await waitFor(() => {
                expect(screen.getByText(/blue/i)).toBeInTheDocument();
            });
        });
    });

    describe('Size Selection', () => {
        it('should display sizes for selected color', async () => {
            renderProductDetail();
            await waitFor(() => {
                expect(screen.getByText('S')).toBeInTheDocument();
                expect(screen.getByText('M')).toBeInTheDocument();
            });
        });

        it('should select size when clicked', async () => {
            renderProductDetail();
            const sizeS = await screen.findByText('S');
            await userEvent.click(sizeS);
            expect(sizeS).toHaveClass('active');
        });
    });

    describe('Stock Information', () => {
        it('should show in stock for variant with stock', async () => {
            renderProductDetail();
            expect(await screen.findByText(/in stock/i)).toBeInTheDocument();
        });

        it('should show out of stock for variant without stock', async () => {
            renderProductDetail();
            const colorButtons = await screen.findAllByRole('button', { name: /red|blue/i });
            fireEvent.click(colorButtons[1]);
            expect(await screen.findByText(/out of stock/i)).toBeInTheDocument();
        });
    });

    describe('Quantity Selection', () => {
        it('should increment quantity', async () => {
            renderProductDetail();
            const plusButton = await screen.findByText('+');
            await userEvent.click(plusButton);
            const quantityDisplay = document.querySelector('.quantity-display');
            expect(quantityDisplay).toHaveTextContent('2');
        });

        it('should decrement quantity', async () => {
            renderProductDetail();
            const plusButton = await screen.findByText('+');
            await userEvent.click(plusButton);
            const minusButton = screen.getByText('−');
            await userEvent.click(minusButton);
            const quantityDisplay = document.querySelector('.quantity-display');
            expect(quantityDisplay).toHaveTextContent('1');
        });

        it('should not go below 1', async () => {
            renderProductDetail();
            const minusButton = await screen.findByText('−');
            await userEvent.click(minusButton);
            const quantityDisplay = document.querySelector('.quantity-display');
            expect(quantityDisplay).toHaveTextContent('1');
        });
    });

    describe('Add to Cart', () => {
        it('should add to cart when clicked', async () => {
            vi.mocked(cartService.addItem).mockResolvedValue(mockAxiosResponse({}));
            vi.spyOn(window, 'alert').mockImplementation(() => { });
            renderProductDetail();
            const addToCartButton = await screen.findByText(/add to cart/i);
            await userEvent.click(addToCartButton);
            await waitFor(() => {
                expect(vi.mocked(cartService.addItem)).toHaveBeenCalledWith({
                    productId: 1,
                    quantity: 1,
                });
            });
        });

        it('should disable add to cart when out of stock', async () => {
            renderProductDetail();
            const colorButtons = await screen.findAllByRole('button', { name: /red|blue/i });
            fireEvent.click(colorButtons[1]);
            await waitFor(() => {
                const addToCartButton = screen.getByText(/add to cart/i);
                expect(addToCartButton).toBeDisabled();
            });
        });

        it('should show error when add to cart fails', async () => {
            vi.mocked(cartService.addItem).mockRejectedValue({
                response: { data: 'Failed to add to cart' },
            });
            renderProductDetail();
            const addToCartButton = await screen.findByText(/add to cart/i);
            await userEvent.click(addToCartButton);
            expect(await screen.findByText('Failed to add to cart')).toBeInTheDocument();
        });
    });

    describe('Wishlist', () => {
        it('should add to wishlist when clicked', async () => {
            vi.mocked(wishlistService.addToWishlist).mockResolvedValue(mockAxiosResponse({}));
            renderProductDetail();
            const wishlistButton = await screen.findByTitle(/wishlist/i);
            await userEvent.click(wishlistButton);
            await waitFor(() => {
                expect(vi.mocked(wishlistService.addToWishlist)).toHaveBeenCalledWith(1);
            });
        });

        it('should remove from wishlist when already in wishlist', async () => {
            vi.mocked(wishlistService.isInWishlist).mockResolvedValue(mockAxiosResponse(true));
            vi.mocked(wishlistService.removeFromWishlist).mockResolvedValue(mockAxiosResponse({}));
            renderProductDetail();
            const wishlistButton = await screen.findByTitle(/wishlist/i);
            await userEvent.click(wishlistButton);
            await waitFor(() => {
                expect(vi.mocked(wishlistService.removeFromWishlist)).toHaveBeenCalledWith(1);
            });
        });
    });

    describe('Flash Sale', () => {
        it('should display flash sale when active', async () => {
            const flashSale = [{
                id: 1,
                discountPercentage: 20,
                productIdsJson: '[1]',
                endsAt: new Date(Date.now() + 3600000).toISOString(),
            }];
            vi.mocked(flashSaleService.getActive).mockResolvedValue(mockAxiosResponse(flashSale));
            renderProductDetail();
            expect(await screen.findByText(/flash sale/i)).toBeInTheDocument();
            expect(screen.getByText('$80.00')).toBeInTheDocument();
        });
    });

    describe('Coupons', () => {
        it('should apply coupon when valid', async () => {
            vi.mocked(apiService.post).mockResolvedValue(mockAxiosResponse({ discount: 10, finalTotal: 90 }));
            renderProductDetail();
            const couponInput = await screen.findByPlaceholderText(/enter coupon/i);
            await userEvent.type(couponInput, 'SAVE10');
            const applyButton = screen.getByText(/apply/i);
            await userEvent.click(applyButton);
            await waitFor(() => {
                expect(vi.mocked(apiService.post)).toHaveBeenCalledWith('/coupons/apply', {
                    code: 'SAVE10',
                    orderTotal: 100,
                    productId: 1,
                    categoryId: 1,
                });
            });
        });

        it('should show error when coupon invalid', async () => {
            vi.mocked(apiService.post).mockRejectedValue({
                response: { data: 'Invalid coupon' },
            });
            renderProductDetail();
            const couponInput = await screen.findByPlaceholderText(/enter coupon/i);
            await userEvent.type(couponInput, 'INVALID');
            const applyButton = screen.getByText(/apply/i);
            await userEvent.click(applyButton);
            expect(await screen.findByText('Invalid coupon')).toBeInTheDocument();
        });

        it('should remove coupon when remove clicked', async () => {
            localStorage.setItem('coupon_1', JSON.stringify({ code: 'SAVE10', discount: 10 }));
            vi.mocked(apiService.post).mockResolvedValue(mockAxiosResponse({ discount: 10, finalTotal: 90 }));
            renderProductDetail();
            await waitFor(() => {
                expect(screen.getByText(/remove/i)).toBeInTheDocument();
            });
            const removeButton = screen.getByText(/remove/i);
            await userEvent.click(removeButton);
            expect(screen.queryByText(/remove/i)).not.toBeInTheDocument();
        });
    });

    describe('Reviews', () => {
        it('should display reviews', async () => {
            renderProductDetail();
            expect(await screen.findByText('Great product!')).toBeInTheDocument();
            expect(screen.getByText('Good product')).toBeInTheDocument();
        });

        it('should display review summary', async () => {
            renderProductDetail();
            expect(await screen.findByText('4.5')).toBeInTheDocument();
        });

        it('should show write review button when can review', async () => {
            renderProductDetail();
            await waitFor(() => {
                expect(screen.getByText(/write a review/i)).toBeInTheDocument();
            });
        });

        it('should open review form when write review clicked', async () => {
            renderProductDetail();
            const writeReviewButton = await screen.findByText(/write a review/i);
            await userEvent.click(writeReviewButton);
            expect(screen.getByPlaceholderText(/your review/i)).toBeInTheDocument();
        });

        it('should submit review', async () => {
            vi.mocked(reviewService.createReview).mockResolvedValue(mockAxiosResponse({ id: 3 }));
            renderProductDetail();
            const writeReviewButton = await screen.findByText(/write a review/i);
            await userEvent.click(writeReviewButton);
            const textarea = screen.getByPlaceholderText(/your review/i);
            await userEvent.type(textarea, 'Nice product!');
            const submitButton = screen.getByText(/submit/i);
            await userEvent.click(submitButton);
            await waitFor(() => {
                expect(vi.mocked(reviewService.createReview)).toHaveBeenCalledWith({
                    productId: 1,
                    rating: 5,
                    text: 'Nice product!',
                });
            });
        });

        it('should show error when review text is empty', async () => {
            renderProductDetail();
            const writeReviewButton = await screen.findByText(/write a review/i);
            await userEvent.click(writeReviewButton);
            const submitButton = screen.getByText(/submit/i);
            await userEvent.click(submitButton);
            expect(await screen.findByText('Review text is required')).toBeInTheDocument();
        });

        it('should mark review as helpful', async () => {
            vi.mocked(reviewService.markHelpful).mockResolvedValue(mockAxiosResponse({}));
            renderProductDetail();
            const helpfulButtons = await screen.findAllByText(/helpful/i);
            await userEvent.click(helpfulButtons[0]);
            await waitFor(() => {
                expect(vi.mocked(reviewService.markHelpful)).toHaveBeenCalledWith(1);
            });
        });

        it('should report review', async () => {
            vi.mocked(reviewService.reportReview).mockResolvedValue(mockAxiosResponse({}));
            renderProductDetail();
            const reportButtons = await screen.findAllByText(/report/i);
            await userEvent.click(reportButtons[0]);
            await waitFor(() => {
                expect(vi.mocked(reviewService.reportReview)).toHaveBeenCalledWith(1);
            });
        });
    });

    describe('Image Expansion', () => {
        it('should expand image when clicked', async () => {
            renderProductDetail();
            await waitFor(() => {
                const mainImageButton = document.querySelector('.main-image-btn') as HTMLElement;
                expect(mainImageButton).toBeInTheDocument();
            });
            const mainImageButton = document.querySelector('.main-image-btn') as HTMLElement;
            await userEvent.click(mainImageButton);
            expect(screen.getByText('✕')).toBeInTheDocument();
        });

        it('should close expanded image when close clicked', async () => {
            renderProductDetail();
            await waitFor(() => {
                const mainImageButton = document.querySelector('.main-image-btn') as HTMLElement;
                expect(mainImageButton).toBeInTheDocument();
            });
            const mainImageButton = document.querySelector('.main-image-btn') as HTMLElement;
            await userEvent.click(mainImageButton);
            const closeButton = screen.getByText('✕');
            await userEvent.click(closeButton);
            expect(screen.queryByText('✕')).not.toBeInTheDocument();
        });
    });

    describe('Similar Products', () => {
        it('should display similar products', async () => {
            renderProductDetail();
            expect(await screen.findByText('Similar Product 1')).toBeInTheDocument();
            expect(screen.getByText('Similar Product 2')).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should navigate back when back button clicked', async () => {
            renderProductDetail();
            const backButton = await screen.findByText(/back/i);
            await userEvent.click(backButton);
            expect(mockNavigate).toHaveBeenCalledWith(-1);
        });
    });
});