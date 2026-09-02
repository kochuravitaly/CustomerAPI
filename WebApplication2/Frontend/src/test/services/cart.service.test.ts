import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cartService } from '../../services/cart.service';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
    apiService: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('cartService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(apiService.get).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.post).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.patch).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.delete).mockResolvedValue({ data: {} } as any);
    });

    describe('getCart', () => {
        it('should call GET /cart', async () => {
            await cartService.getCart();
            expect(apiService.get).toHaveBeenCalledWith('/cart');
        });

        it('should return CartResponseDto', async () => {
            const mockCart = { cartItems: [], total: 0 };
            vi.mocked(apiService.get).mockResolvedValue({ data: mockCart } as any);
            const result = await cartService.getCart();
            expect(result.data).toEqual(mockCart);
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.get).mockRejectedValue(new Error('Failed to get cart'));
            await expect(cartService.getCart()).rejects.toThrow('Failed to get cart');
        });
    });

    describe('addItem', () => {
        it('should call POST /cart/items with data', async () => {
            const data = { productId: 1, quantity: 2 };
            await cartService.addItem(data);
            expect(apiService.post).toHaveBeenCalledWith('/cart/items', data);
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.post).mockRejectedValue(new Error('Failed to add item'));
            await expect(cartService.addItem({ productId: 1, quantity: 2 })).rejects.toThrow('Failed to add item');
        });
    });

    describe('updateItem', () => {
        it('should call PATCH /cart/items/:productId with data', async () => {
            const data = { quantity: 3 };
            await cartService.updateItem(1, data);
            expect(apiService.patch).toHaveBeenCalledWith('/cart/items/1', data);
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.patch).mockRejectedValue(new Error('Failed to update item'));
            await expect(cartService.updateItem(1, { quantity: 3 })).rejects.toThrow('Failed to update item');
        });
    });

    describe('removeItem', () => {
        it('should call DELETE /cart/items/:productId', async () => {
            await cartService.removeItem(1);
            expect(apiService.delete).toHaveBeenCalledWith('/cart/items/1');
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.delete).mockRejectedValue(new Error('Failed to remove item'));
            await expect(cartService.removeItem(1)).rejects.toThrow('Failed to remove item');
        });
    });

    describe('clearCart', () => {
        it('should call DELETE /cart', async () => {
            await cartService.clearCart();
            expect(apiService.delete).toHaveBeenCalledWith('/cart');
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.delete).mockRejectedValue(new Error('Failed to clear cart'));
            await expect(cartService.clearCart()).rejects.toThrow('Failed to clear cart');
        });
    });
});