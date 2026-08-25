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

export interface CreateReviewDto {
    productId: number;
    rating: number;
    text: string;
}

export interface UpdateReviewDto {
    rating: number;
    text: string;
}

export interface ProductReviewSummaryDto {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
}