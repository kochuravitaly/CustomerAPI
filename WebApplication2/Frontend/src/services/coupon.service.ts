import { apiService } from './api';

export interface CouponResponseDto {
    id: number;
    code: string;
    discountType: number;
    discountValue: number;
    minOrderAmount?: number;
    expiryDate?: string;
    usageLimit?: number;
    timesUsed: number;
    isActive: boolean;
    productIdsJson?: string;
    categoryIdsJson?: string;
}

export interface CreateCouponDto {
    code: string;
    discountType: number;
    discountValue: number;
    minOrderAmount?: number;
    expiryDate?: string;
    usageLimit?: number;
    productIdsJson?: string;
    categoryIdsJson?: string;
}

export interface FlashSaleResponseDto {
    id: number;
    discountPercentage: number;
    startsAt: string;
    endsAt: string;
    isActive: boolean;
    productIdsJson?: string;
    categoryIdsJson?: string;
}

export const formatExpiryDate = (expiryDate: string | undefined): string => {
    if (!expiryDate) return '—';
    const date = new Date(expiryDate);
    return date.toLocaleString('en-US', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const couponService = {
    getCoupons: () => apiService.get<CouponResponseDto[]>('/coupons'),
    createCoupon: (data: CreateCouponDto) => apiService.post<CouponResponseDto>('/coupons', data),
    updateCoupon: (id: number, data: CreateCouponDto) => apiService.patch(`/coupons/${id}`, data),
    deleteCoupon: (id: number) => apiService.delete(`/coupons/${id}`),
};

export const flashSaleService = {
    getActive: () => apiService.get<FlashSaleResponseDto[]>('/flashsale'),
    getAll: () => apiService.get<FlashSaleResponseDto[]>('/flashsale/all'),
    create: (data: any) => apiService.post('/flashsale', data),
    update: (id: number, data: any) => apiService.patch(`/flashsale/${id}`, data),
    delete: (id: number) => apiService.delete(`/flashsale/${id}`),
};