import { describe, it, expect, vi, beforeEach } from 'vitest';
import { couponService, flashSaleService, formatExpiryDate } from '../../services/coupon.service';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
    apiService: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('formatExpiryDate', () => {
    it('should return dash for undefined', () => {
        expect(formatExpiryDate(undefined)).toBe('—');
    });

    it('should return dash for null', () => {
        expect(formatExpiryDate(null as any)).toBe('—');
    });

    it('should format date string', () => {
        const date = '2024-01-15T10:30:00Z';
        const result = formatExpiryDate(date);
        expect(result).toContain('2024');
        expect(result.length).toBeGreaterThan(5);
    });

    it('should format invalid date gracefully', () => {
        const result = formatExpiryDate('invalid-date');
        expect(result).toContain('Invalid');
    });
});

describe('couponService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(apiService.get).mockResolvedValue({ data: [] } as any);
        vi.mocked(apiService.post).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.patch).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.delete).mockResolvedValue({ data: {} } as any);
    });

    describe('getCoupons', () => {
        it('should call GET /coupons', async () => {
            await couponService.getCoupons();
            expect(apiService.get).toHaveBeenCalledWith('/coupons');
        });

        it('should return coupons array', async () => {
            const mockCoupons = [{ id: 1, code: 'SAVE10', discountType: 0, discountValue: 10 }];
            vi.mocked(apiService.get).mockResolvedValue({ data: mockCoupons } as any);
            const result = await couponService.getCoupons();
            expect(result.data).toEqual(mockCoupons);
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.get).mockRejectedValue(new Error('Failed to get coupons'));
            await expect(couponService.getCoupons()).rejects.toThrow('Failed to get coupons');
        });
    });

    describe('createCoupon', () => {
        it('should call POST /coupons with data', async () => {
            const data = { code: 'SAVE10', discountType: 0, discountValue: 10 };
            await couponService.createCoupon(data);
            expect(apiService.post).toHaveBeenCalledWith('/coupons', data);
        });

        it('should return created coupon', async () => {
            const mockCoupon = { id: 1, code: 'SAVE10', discountType: 0, discountValue: 10 };
            vi.mocked(apiService.post).mockResolvedValue({ data: mockCoupon } as any);
            const result = await couponService.createCoupon({ code: 'SAVE10', discountType: 0, discountValue: 10 });
            expect(result.data).toEqual(mockCoupon);
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.post).mockRejectedValue(new Error('Failed to create coupon'));
            await expect(couponService.createCoupon({ code: 'SAVE10', discountType: 0, discountValue: 10 })).rejects.toThrow('Failed to create coupon');
        });
    });

    describe('updateCoupon', () => {
        it('should call PATCH /coupons/:id with data', async () => {
            const data = { code: 'SAVE20', discountType: 0, discountValue: 20 };
            await couponService.updateCoupon(1, data);
            expect(apiService.patch).toHaveBeenCalledWith('/coupons/1', data);
        });
    });

    describe('deleteCoupon', () => {
        it('should call DELETE /coupons/:id', async () => {
            await couponService.deleteCoupon(1);
            expect(apiService.delete).toHaveBeenCalledWith('/coupons/1');
        });
    });
});

describe('flashSaleService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(apiService.get).mockResolvedValue({ data: [] } as any);
        vi.mocked(apiService.post).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.patch).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.delete).mockResolvedValue({ data: {} } as any);
    });

    describe('getActive', () => {
        it('should call GET /flashsale', async () => {
            await flashSaleService.getActive();
            expect(apiService.get).toHaveBeenCalledWith('/flashsale');
        });

        it('should return flash sales array', async () => {
            const mockSales = [{ id: 1, discountPercentage: 20, startsAt: '', endsAt: '', isActive: true }];
            vi.mocked(apiService.get).mockResolvedValue({ data: mockSales } as any);
            const result = await flashSaleService.getActive();
            expect(result.data).toEqual(mockSales);
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.get).mockRejectedValue(new Error('Failed to get flash sales'));
            await expect(flashSaleService.getActive()).rejects.toThrow('Failed to get flash sales');
        });
    });

    describe('getAll', () => {
        it('should call GET /flashsale/all', async () => {
            await flashSaleService.getAll();
            expect(apiService.get).toHaveBeenCalledWith('/flashsale/all');
        });
    });

    describe('create', () => {
        it('should call POST /flashsale with data', async () => {
            const data = { discountPercentage: 20, startsAt: '2024-01-01', endsAt: '2024-01-02' };
            await flashSaleService.create(data);
            expect(apiService.post).toHaveBeenCalledWith('/flashsale', data);
        });
    });

    describe('update', () => {
        it('should call PATCH /flashsale/:id with data', async () => {
            const data = { discountPercentage: 30 };
            await flashSaleService.update(1, data);
            expect(apiService.patch).toHaveBeenCalledWith('/flashsale/1', data);
        });
    });

    describe('delete', () => {
        it('should call DELETE /flashsale/:id', async () => {
            await flashSaleService.delete(1);
            expect(apiService.delete).toHaveBeenCalledWith('/flashsale/1');
        });
    });
});