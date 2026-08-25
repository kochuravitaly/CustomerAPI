import { apiService } from './api';
import {
    ProductResponseDto,
    ProductQueryDto,
    PagedResponseDto,
    CreateProductDto,
    UpdateProductDto,
    CategoryResponseDto,
    CreateCategoryDto,
    UpdateCategoryDto,
    ProductImageResponseDto,
} from '../types/product';

export const productService = {
    getAll: (params: ProductQueryDto) =>
        apiService.get<PagedResponseDto<ProductResponseDto>>('/products', { params }),

    getById: (id: number) =>
        apiService.get<ProductResponseDto>(`/products/${id}`),

    getBestSellers: () =>
        apiService.get<ProductResponseDto[]>('/products/best-sellers'),

    create: (data: CreateProductDto) =>
        apiService.post<ProductResponseDto>('/products', data),

    update: (id: number, data: UpdateProductDto) =>
        apiService.patch(`/products/${id}`, data),

    delete: (id: number) =>
        apiService.delete(`/products/${id}`),
};

export const categoryService = {
    getAll: () =>
        apiService.get<CategoryResponseDto[]>('/categories'),

    getById: (id: number) =>
        apiService.get<CategoryResponseDto>(`/categories/${id}`),

    create: (data: CreateCategoryDto) =>
        apiService.post<CategoryResponseDto>('/categories', data),

    update: (id: number, data: UpdateCategoryDto) =>
        apiService.patch(`/categories/${id}`, data),

    delete: (id: number) =>
        apiService.delete(`/categories/${id}`),
};

export const productImageService = {
    upload: (productId: number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiService.post<ProductImageResponseDto>(
            `/products/${productId}/images`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
    },

    delete: (productId: number, imageId: number) =>
        apiService.delete(`/products/${productId}/images/${imageId}`),

    setMain: (productId: number, imageId: number) =>
        apiService.put(`/products/${productId}/images/${imageId}/main`),
};