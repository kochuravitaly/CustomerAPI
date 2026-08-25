import { apiService } from './api';

export interface ReviewMediaDto {
    id: number;
    objectKey: string;
    fileName: string;
    contentType: string;
    mediaType: string;
    fileSize: number;
}

export interface ReviewResponseDto {
    id: number;
    productId: number;
    productName: string;
    customerName: string;
    rating: number;
    text: string;
    createdAt: string;
    isVerifiedPurchase: boolean;
    isAdmin: boolean;
    helpfulCount: number;
    media: ReviewMediaDto[];
}

export interface ProductReviewSummaryDto {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
}

export interface CreateReviewDto {
    productId: number;
    rating: number;
    text: string;
}

export interface UpdateReviewDto {
    rating: number;
    text: string;
}

export const reviewService = {
    getProductReviews: (productId: number, rating?: number) =>
        apiService.get<ReviewResponseDto[]>(`/reviews/product/${productId}`, {
            params: rating ? { rating } : {},
        }),

    getProductSummary: (productId: number) =>
        apiService.get<ProductReviewSummaryDto>(`/reviews/product/${productId}/summary`),

    getMyReviews: () =>
        apiService.get<ReviewResponseDto[]>('/reviews/my'),

    createReview: (data: CreateReviewDto) =>
        apiService.post<ReviewResponseDto>('/reviews', data),

    updateReview: (id: number, data: UpdateReviewDto) =>
        apiService.patch(`/reviews/${id}`, data),

    deleteReview: (id: number) =>
        apiService.delete(`/reviews/${id}`),

    markHelpful: (reviewId: number) =>
        apiService.post(`/reviews/${reviewId}/helpful`),

    reportReview: (reviewId: number) =>
        apiService.post(`/reviews/${reviewId}/report`),

    canReview: (productId: number) =>
        apiService.get<boolean>(`/reviews/can-review/${productId}`),

    uploadMedia: (reviewId: number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiService.post(`/reviews/${reviewId}/media`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    deleteMedia: (reviewId: number, mediaId: number) =>
        apiService.delete(`/reviews/${reviewId}/media/${mediaId}`),
};