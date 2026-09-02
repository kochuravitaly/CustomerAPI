import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orderService } from '../../services/order.service';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
    apiService: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

describe('orderService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(apiService.get).mockResolvedValue({ data: [] } as any);
        vi.mocked(apiService.post).mockResolvedValue({ data: {} } as any);
    });

    describe('create', () => {
        it('should call POST /orders', async () => {
            await orderService.create();
            expect(apiService.post).toHaveBeenCalledWith('/orders');
        });

        it('should return OrderResponseDto', async () => {
            const mockOrder = {
                id: 'order-123',
                totalAmount: 100,
                status: 0,
                createdAt: '2024-01-01T00:00:00Z',
                items: [],
            };
            vi.mocked(apiService.post).mockResolvedValue({ data: mockOrder } as any);
            const result = await orderService.create();
            expect(result.data).toEqual(mockOrder);
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.post).mockRejectedValue(new Error('Failed to create order'));
            await expect(orderService.create()).rejects.toThrow('Failed to create order');
        });
    });

    describe('getMyOrders', () => {
        it('should call GET /orders', async () => {
            await orderService.getMyOrders();
            expect(apiService.get).toHaveBeenCalledWith('/orders');
        });

        it('should return orders array', async () => {
            const mockOrders = [
                {
                    id: 'order-123',
                    totalAmount: 100,
                    status: 0,
                    createdAt: '2024-01-01T00:00:00Z',
                    items: [],
                },
            ];
            vi.mocked(apiService.get).mockResolvedValue({ data: mockOrders } as any);
            const result = await orderService.getMyOrders();
            expect(result.data).toEqual(mockOrders);
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.get).mockRejectedValue(new Error('Failed to get orders'));
            await expect(orderService.getMyOrders()).rejects.toThrow('Failed to get orders');
        });
    });

    describe('getById', () => {
        it('should call GET /orders/:id', async () => {
            await orderService.getById('order-123');
            expect(apiService.get).toHaveBeenCalledWith('/orders/order-123');
        });

        it('should return OrderResponseDto', async () => {
            const mockOrder = {
                id: 'order-123',
                totalAmount: 100,
                status: 1,
                createdAt: '2024-01-01T00:00:00Z',
                items: [],
            };
            vi.mocked(apiService.get).mockResolvedValue({ data: mockOrder } as any);
            const result = await orderService.getById('order-123');
            expect(result.data).toEqual(mockOrder);
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.get).mockRejectedValue(new Error('Failed to get order'));
            await expect(orderService.getById('order-123')).rejects.toThrow('Failed to get order');
        });
    });
});