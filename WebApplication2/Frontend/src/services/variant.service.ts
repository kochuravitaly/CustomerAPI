import { apiService } from './api';

export interface ProductColorDto {
    id: number;
    name: string;
    hexCode: string;
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
};