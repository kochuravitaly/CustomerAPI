import { describe, it, expect, vi, beforeEach } from 'vitest';
import { paymentService } from '../../services/payment.service';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
    apiService: {
        post: vi.fn(),
    },
}));

describe('paymentService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(apiService.post).mockResolvedValue({ data: {} } as any);
    });

    describe('create', () => {
        it('should call POST /payments with data', async () => {
            const data = { orderId: 'order-123' };
            await paymentService.create(data);
            expect(apiService.post).toHaveBeenCalledWith('/payments', data);
        });

        it('should return PaymentResponseDto', async () => {
            const mockPayment = {
                paymentId: 'payment-123',
                paymentUrl: 'https://payment.example.com',
            };
            vi.mocked(apiService.post).mockResolvedValue({ data: mockPayment } as any);
            const result = await paymentService.create({ orderId: 'order-123' });
            expect(result.data).toEqual(mockPayment);
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.post).mockRejectedValue(new Error('Failed to create payment'));
            await expect(paymentService.create({ orderId: 'order-123' })).rejects.toThrow('Failed to create payment');
        });
    });
});