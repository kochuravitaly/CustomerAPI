import { apiService } from './api';
import {
    CartResponseDto,
    AddCartItemDto,
    UpdateCartItemDto,
} from '../types/cart';

export const cartService = {
    getCart: () =>
        apiService.get<CartResponseDto>('/cart'),

    addItem: (data: AddCartItemDto) =>
        apiService.post('/cart/items', data),

    updateItem: (productId: number, data: UpdateCartItemDto) =>
        apiService.patch(`/cart/items/${productId}`, data),

    removeItem: (productId: number) =>
        apiService.delete(`/cart/items/${productId}`),

    clearCart: () =>
        apiService.delete('/cart'),
};