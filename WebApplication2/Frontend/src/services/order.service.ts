import { apiService } from './api';
import { OrderResponseDto } from '../types/order';

export const orderService = {
    create: () =>
        apiService.post<OrderResponseDto>('/orders'),

    getMyOrders: () =>
        apiService.get<OrderResponseDto[]>('/orders'),

    getById: (id: string) =>
        apiService.get<OrderResponseDto>(`/orders/${id}`),
};