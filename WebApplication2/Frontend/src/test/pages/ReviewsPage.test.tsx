import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReviewsPage } from '../../pages/ReviewsPage';
import { AuthProvider } from '../../context/AuthContext';
import { LanguageProvider } from '../../context/LanguageContext';
import { reviewService } from '../../services/review.service';
import { productService } from '../../services/product.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
        useParams: vi.fn(() => ({ id: '1' })),
    };
});

vi.mock('../../services/review.service', () => ({
    reviewService: {
        getProductReviews: vi.fn(),
        getProductSummary: vi.fn(),
        markHelpful: vi.fn(),
        reportReview: vi.fn(),
        deleteReview: vi.fn(),
    },
}));

vi.mock('../../services/product.service', () => ({
    productService: {
        getById: vi.fn(),
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

const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxMjM0NTY3OCIsInJvbGUiOiJBZG1pbiIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.fakeSignature';

const mockProduct = {
    id: 1,
    name: 'Test Product',
    nameTranslations: { en: 'Test Product' },
    price: 100,
};

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

const mockSummary = {
    averageRating: 4.5,
    totalReviews: 2,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
};

describe('ReviewsPage', () => {
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
        vi.mocked(reviewService.getProductReviews).mockResolvedValue(mockAxiosResponse(mockReviews));
        vi.mocked(reviewService.getProductSummary).mockResolvedValue(mockAxiosResponse(mockSummary));
    });

    const renderReviewsPage = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <AuthProvider>
                        <MemoryRouter>
                            <ReviewsPage />
                        </MemoryRouter>
                    </AuthProvider>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Loading and Error States', () => {
        it('should show loading spinner while product loads', () => {
            vi.mocked(productService.getById).mockImplementation(() => new Promise(() => { }));
            renderReviewsPage();
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });

        it('should show error when product fails to load', async () => {
            vi.mocked(productService.getById).mockRejectedValue(new Error('Network error'));
            renderReviewsPage();
            expect(await screen.findByText('Failed to load product')).toBeInTheDocument();
        });

        it('should show error when reviews fail to load', async () => {
            vi.mocked(reviewService.getProductReviews).mockRejectedValue(new Error('Network error'));
            renderReviewsPage();
            expect(await screen.findByText('Failed to load reviews')).toBeInTheDocument();
        });
    });

    describe('Display', () => {
        it('should show product name and rating', async () => {
            renderReviewsPage();
            expect(await screen.findByText('Test Product')).toBeInTheDocument();
            expect(screen.getByText(/4\.5/)).toBeInTheDocument();
        });

        it('should display all reviews', async () => {
            renderReviewsPage();
            expect(await screen.findByText('Great product!')).toBeInTheDocument();
            expect(screen.getByText('Good product')).toBeInTheDocument();
        });

        it('should show customer names', async () => {
            renderReviewsPage();
            expect(await screen.findByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        });

        it('should show no reviews message when empty', async () => {
            vi.mocked(reviewService.getProductReviews).mockResolvedValue(mockAxiosResponse([]));
            renderReviewsPage();
            expect(await screen.findByText(/no reviews/i)).toBeInTheDocument();
        });
    });

    describe('Sorting', () => {
        it('should sort by newest by default', async () => {
            renderReviewsPage();
            expect(await screen.findByText(/newest/i)).toBeInTheDocument();
        });

        it('should show sort options when sort clicked', async () => {
            renderReviewsPage();
            const sortButton = await screen.findByText(/newest/i);
            await userEvent.click(sortButton);
            expect(await screen.findByText(/most helpful/i)).toBeInTheDocument();
        });

        it('should sort by helpful when selected', async () => {
            renderReviewsPage();
            const sortButton = await screen.findByText(/newest/i);
            await userEvent.click(sortButton);
            const helpfulButton = await screen.findByText(/most helpful/i);
            await userEvent.click(helpfulButton);
            expect(await screen.findByText(/most helpful/i)).toBeInTheDocument();
        });
    });

    describe('Rating Filter', () => {
        it('should show all ratings by default', async () => {
            renderReviewsPage();
            expect(await screen.findByText(/all ratings/i)).toBeInTheDocument();
        });

        it('should show rating options when clicked', async () => {
            renderReviewsPage();
            const ratingButton = await screen.findByText(/all ratings/i);
            await userEvent.click(ratingButton);
            expect(await screen.findByText(/5 ★/)).toBeInTheDocument();
        });

        it('should filter by rating when selected', async () => {
            renderReviewsPage();
            const ratingButton = await screen.findByText(/all ratings/i);
            await userEvent.click(ratingButton);
            const fiveStarButton = await screen.findByText(/5 ★/);
            await userEvent.click(fiveStarButton);
            await waitFor(() => {
                expect(vi.mocked(reviewService.getProductReviews)).toHaveBeenCalledWith(1, 5);
            });
        });
    });

    describe('Helpful', () => {
        it('should mark review as helpful', async () => {
            vi.mocked(reviewService.markHelpful).mockResolvedValue(mockAxiosResponse({}));
            renderReviewsPage();
            const helpfulButtons = await screen.findAllByText(/helpful/i);
            await userEvent.click(helpfulButtons[0]);
            await waitFor(() => {
                expect(vi.mocked(reviewService.markHelpful)).toHaveBeenCalledWith(2);
            });
        });
    });

    describe('Report', () => {
        it('should report review', async () => {
            vi.mocked(reviewService.reportReview).mockResolvedValue(mockAxiosResponse({}));
            renderReviewsPage();
            const reportButtons = await screen.findAllByText(/report/i);
            await userEvent.click(reportButtons[0]);
            await waitFor(() => {
                expect(vi.mocked(reviewService.reportReview)).toHaveBeenCalledWith(2);
            });
        });
    });

    describe('Delete Review', () => {
        it('should show delete button for admin', async () => {
            renderReviewsPage();
            const deleteButtons = await screen.findAllByText('🗑️');
            expect(deleteButtons.length).toBeGreaterThan(0);
        });

        it('should show confirmation modal when delete clicked', async () => {
            renderReviewsPage();
            const deleteButtons = await screen.findAllByText('🗑️');
            await userEvent.click(deleteButtons[0]);
            expect(await screen.findAllByText(/delete/i)).toHaveLength(2);
        });

        it('should delete review when confirmed', async () => {
            vi.mocked(reviewService.deleteReview).mockResolvedValue(mockAxiosResponse({}));
            renderReviewsPage();
            const deleteButtons = await screen.findAllByText('🗑️');
            await userEvent.click(deleteButtons[0]);
            const confirmButtons = screen.getAllByText(/delete/i);
            await userEvent.click(confirmButtons[1]);
            await waitFor(() => {
                expect(vi.mocked(reviewService.deleteReview)).toHaveBeenCalledWith(2);
            });
        });

        it('should close modal when cancel clicked', async () => {
            renderReviewsPage();
            const deleteButtons = await screen.findAllByText('🗑️');
            await userEvent.click(deleteButtons[0]);
            const cancelButton = await screen.findByText(/cancel/i);
            await userEvent.click(cancelButton);
            expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should navigate back when back button clicked', async () => {
            renderReviewsPage();
            const backButton = await screen.findByText(/back/i);
            await userEvent.click(backButton);
            expect(mockNavigate).toHaveBeenCalledWith(-1);
        });
    });
});