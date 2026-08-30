import { apiService } from './api';

export interface WishlistItemResponseDto {
    id: number;
    productId: number;
    productName: string;
    price: number;
    categoryName?: string;
    stockQuantity: number;
    mainImageId?: number;
    nameTranslations?: Record<string, string>;
    addedAt: string;
}

export const wishlistService = {
    getWishlist: () =>
        apiService.get<WishlistItemResponseDto[]>('/wishlist'),

    addToWishlist: (productId: number) =>
        apiService.post('/wishlist', { productId }),

    removeFromWishlist: (productId: number) =>
        apiService.delete(`/wishlist/${productId}`),

    isInWishlist: (productId: number) =>
        apiService.get<boolean>(`/wishlist/check/${productId}`),

    clearWishlist: () =>
        apiService.delete('/wishlist'),
};