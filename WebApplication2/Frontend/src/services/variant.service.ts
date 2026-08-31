import { apiService } from './api';

export interface ProductColorDto {
    id: number;
    name: string;
    hexCode: string;
    nameTranslations?: Record<string, string>;
}

export interface ProductSizeDto {
    id: number;
    name: string;
}

export interface ProductVariantResponseDto {
    id: number;
    colorId: number;
    colorName: string;
    hexCode: string;
    sizeId: number;
    sizeName: string;
    stockQuantity: number;
    sku: string;
    price?: number;
}

export const variantService = {
    getColors: (productId: number) =>
        apiService.get<ProductColorDto[]>(`/products/${productId}/variants/colors`),

    getSizes: (productId: number) =>
        apiService.get<ProductSizeDto[]>(`/products/${productId}/variants/sizes`),

    getVariants: (productId: number) =>
        apiService.get<ProductVariantResponseDto[]>(`/products/${productId}/variants`),

    createColor: (productId: number, data: { name: string; hexCode: string }) =>
        apiService.post<ProductColorDto>(`/products/${productId}/variants/colors`, data),

    createSize: (productId: number, data: { name: string }) =>
        apiService.post<ProductSizeDto>(`/products/${productId}/variants/sizes`, data),

    createVariant: (productId: number, data: { colorId: number; sizeId: number; stockQuantity: number; sku: string; price?: number }) =>
        apiService.post<ProductVariantResponseDto>(`/products/${productId}/variants`, data),

    deleteColor: (productId: number, colorId: number) =>
        apiService.delete(`/products/${productId}/variants/colors/${colorId}`),

    deleteSize: (productId: number, sizeId: number) =>
        apiService.delete(`/products/${productId}/variants/sizes/${sizeId}`),

    deleteVariant: (productId: number, variantId: number) =>
        apiService.delete(`/products/${productId}/variants/${variantId}`),
};