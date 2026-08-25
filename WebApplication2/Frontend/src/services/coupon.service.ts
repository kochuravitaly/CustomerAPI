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
}

export interface CreateCouponDto {
    code: string;
    discountType: number;
    discountValue: number;
    minOrderAmount?: number;
    expiryDate?: string;
    usageLimit?: number;
}

export interface FlashSaleResponseDto {
    id: number;
    productId: number;
    productName: string;
    discountPercentage: number;
    startsAt: string;
    endsAt: string;
    isActive: boolean;
}

export const couponService = {
    getCoupons: () =>
        apiService.get<CouponResponseDto[]>('/coupons'),

    createCoupon: (data: CreateCouponDto) =>
        apiService.post<CouponResponseDto>('/coupons', data),

    deleteCoupon: (id: number) =>
        apiService.delete(`/coupons/${id}`),
};

export const flashSaleService = {
    getActive: () =>
        apiService.get<FlashSaleResponseDto[]>('/flashsale'),

    getAll: () =>
        apiService.get<FlashSaleResponseDto[]>('/flashsale/all'),

    create: (data: any) =>
        apiService.post('/flashsale', data),

    delete: (id: number) =>
        apiService.delete(`/flashsale/${id}`),
};