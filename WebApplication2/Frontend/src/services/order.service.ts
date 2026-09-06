import { apiService } from './api';
import { OrderResponseDto } from '../types/order';

export const orderService = {
    create: (coupons?: { code: string; productId: number }[]) =>
        apiService.post<OrderResponseDto>('/orders', { coupons: coupons || [] }),

    createDirect: (data: { productId: number; quantity: number; colorId?: number; sizeName?: string }) =>
        apiService.post<OrderResponseDto>('/orders/direct', data),

    getMyOrders: () =>
        apiService.get<OrderResponseDto[]>('/orders'),

    getById: (id: string) =>
        apiService.get<OrderResponseDto>(`/orders/${id}`),

    reorder: (orderId: string) =>
        apiService.post(`/orders/${orderId}/reorder`),
};