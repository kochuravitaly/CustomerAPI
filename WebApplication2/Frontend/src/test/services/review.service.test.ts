import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reviewService } from '../../services/review.service';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
    apiService: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('reviewService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(apiService.get).mockResolvedValue({ data: [] } as any);
        vi.mocked(apiService.post).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.patch).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.delete).mockResolvedValue({ data: {} } as any);
    });

    describe('getProductReviews', () => {
        it('should call GET /reviews/product/:productId without rating', async () => {
            await reviewService.getProductReviews(1);
            expect(apiService.get).toHaveBeenCalledWith('/reviews/product/1', {
                params: {},
            });
        });

        it('should call GET /reviews/product/:productId with rating', async () => {
            await reviewService.getProductReviews(1, 5);
            expect(apiService.get).toHaveBeenCalledWith('/reviews/product/1', {
                params: { rating: 5 },
            });
        });

        it('should return reviews array', async () => {
            const mockReviews = [{ id: 1, productId: 1, customerName: 'John', rating: 5, text: 'Great', createdAt: '', isVerifiedPurchase: true, isAdmin: false, helpfulCount: 0, media: [] }];
            vi.mocked(apiService.get).mockResolvedValue({ data: mockReviews } as any);
            const result = await reviewService.getProductReviews(1);
            expect(result.data).toEqual(mockReviews);
        });
    });

    describe('getProductSummary', () => {
        it('should call GET /reviews/product/:productId/summary', async () => {
            await reviewService.getProductSummary(1);
            expect(apiService.get).toHaveBeenCalledWith('/reviews/product/1/summary');
        });
    });

    describe('getMyReviews', () => {
        it('should call GET /reviews/my', async () => {
            await reviewService.getMyReviews();
            expect(apiService.get).toHaveBeenCalledWith('/reviews/my');
        });
    });

    describe('createReview', () => {
        it('should call POST /reviews with data', async () => {
            const data = { productId: 1, rating: 5, text: 'Great product' };
            await reviewService.createReview(data);
            expect(apiService.post).toHaveBeenCalledWith('/reviews', data);
        });

        it('should return created review', async () => {
            const mockReview = { id: 1, productId: 1, rating: 5, text: 'Great' };
            vi.mocked(apiService.post).mockResolvedValue({ data: mockReview } as any);
            const result = await reviewService.createReview({ productId: 1, rating: 5, text: 'Great' });
            expect(result.data).toEqual(mockReview);
        });
    });

    describe('updateReview', () => {
        it('should call PATCH /reviews/:id with data', async () => {
            const data = { rating: 4, text: 'Updated review' };
            await reviewService.updateReview(1, data);
            expect(apiService.patch).toHaveBeenCalledWith('/reviews/1', data);
        });
    });

    describe('deleteReview', () => {
        it('should call DELETE /reviews/:id', async () => {
            await reviewService.deleteReview(1);
            expect(apiService.delete).toHaveBeenCalledWith('/reviews/1');
        });
    });

    describe('markHelpful', () => {
        it('should call POST /reviews/:reviewId/helpful', async () => {
            await reviewService.markHelpful(1);
            expect(apiService.post).toHaveBeenCalledWith('/reviews/1/helpful');
        });
    });

    describe('reportReview', () => {
        it('should call POST /reviews/:reviewId/report', async () => {
            await reviewService.reportReview(1);
            expect(apiService.post).toHaveBeenCalledWith('/reviews/1/report');
        });
    });

    describe('canReview', () => {
        it('should call GET /reviews/can-review/:productId', async () => {
            await reviewService.canReview(1);
            expect(apiService.get).toHaveBeenCalledWith('/reviews/can-review/1');
        });
    });

    describe('uploadMedia', () => {
        it('should call POST /reviews/:reviewId/media with FormData', async () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            await reviewService.uploadMedia(1, file);
            expect(apiService.post).toHaveBeenCalledWith(
                '/reviews/1/media',
                expect.any(FormData),
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
        });
    });

    describe('deleteMedia', () => {
        it('should call DELETE /reviews/:reviewId/media/:mediaId', async () => {
            await reviewService.deleteMedia(1, 2);
            expect(apiService.delete).toHaveBeenCalledWith('/reviews/1/media/2');
        });
    });
});