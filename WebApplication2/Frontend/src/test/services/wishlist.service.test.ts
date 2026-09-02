import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wishlistService } from '../../services/wishlist.service';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
    apiService: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('wishlistService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(apiService.get).mockResolvedValue({ data: [] } as any);
        vi.mocked(apiService.post).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.delete).mockResolvedValue({ data: {} } as any);
    });

    describe('getWishlist', () => {
        it('should call GET /wishlist', async () => {
            await wishlistService.getWishlist();
            expect(apiService.get).toHaveBeenCalledWith('/wishlist');
        });

        it('should return wishlist items array', async () => {
            const mockWishlist = [{ id: 1, productId: 1, productName: 'Product 1', price: 100, stockQuantity: 10, addedAt: '2024-01-01T00:00:00Z' }];
            vi.mocked(apiService.get).mockResolvedValue({ data: mockWishlist } as any);
            const result = await wishlistService.getWishlist();
            expect(result.data).toEqual(mockWishlist);
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.get).mockRejectedValue(new Error('Failed to get wishlist'));
            await expect(wishlistService.getWishlist()).rejects.toThrow('Failed to get wishlist');
        });
    });

    describe('addToWishlist', () => {
        it('should call POST /wishlist with productId', async () => {
            await wishlistService.addToWishlist(1);
            expect(apiService.post).toHaveBeenCalledWith('/wishlist', { productId: 1 });
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.post).mockRejectedValue(new Error('Failed to add to wishlist'));
            await expect(wishlistService.addToWishlist(1)).rejects.toThrow('Failed to add to wishlist');
        });
    });

    describe('removeFromWishlist', () => {
        it('should call DELETE /wishlist/:productId', async () => {
            await wishlistService.removeFromWishlist(1);
            expect(apiService.delete).toHaveBeenCalledWith('/wishlist/1');
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.delete).mockRejectedValue(new Error('Failed to remove from wishlist'));
            await expect(wishlistService.removeFromWishlist(1)).rejects.toThrow('Failed to remove from wishlist');
        });
    });

    describe('isInWishlist', () => {
        it('should call GET /wishlist/check/:productId', async () => {
            await wishlistService.isInWishlist(1);
            expect(apiService.get).toHaveBeenCalledWith('/wishlist/check/1');
        });

        it('should return boolean', async () => {
            vi.mocked(apiService.get).mockResolvedValue({ data: true } as any);
            const result = await wishlistService.isInWishlist(1);
            expect(result.data).toBe(true);
        });
    });

    describe('clearWishlist', () => {
        it('should call DELETE /wishlist', async () => {
            await wishlistService.clearWishlist();
            expect(apiService.delete).toHaveBeenCalledWith('/wishlist');
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.delete).mockRejectedValue(new Error('Failed to clear wishlist'));
            await expect(wishlistService.clearWishlist()).rejects.toThrow('Failed to clear wishlist');
        });
    });
});