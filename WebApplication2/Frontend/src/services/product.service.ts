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
    RecommendationDto,
} from '../types/product';

export const productService = {
    getAll: (params: ProductQueryDto) =>
        apiService.get<PagedResponseDto<ProductResponseDto>>('/products', { params }),

    getById: (id: number) =>
        apiService.get<ProductResponseDto>(`/products/${id}`),

    getBestSellers: () =>
        apiService.get<ProductResponseDto[]>('/products/best-sellers'),

    getRecommendations: (productId: number) =>
        apiService.get<RecommendationDto[]>(`/products/${productId}/recommendations`),

    getAllRecommendations: (productId: number, params?: { sortBy?: string; sortDirection?: string; minPrice?: number; maxPrice?: number; minTimesBought?: number }) =>
        apiService.get<RecommendationDto[]>(`/products/${productId}/recommendations/all`, { params }),

    getSimilarProducts: (productId: number, params: any) => {
        console.log('getSimilarProducts called with params:', params);

        const queryParams = new URLSearchParams();

        Object.keys(params).forEach(key => {
            const value = params[key];
            if (value === undefined || value === null) return;

            if (Array.isArray(value)) {
                value.forEach(item => queryParams.append(key, String(item)));
            } else {
                queryParams.append(key, String(value));
            }
        });

        const queryString = queryParams.toString();
        const url = queryString ? `/products/${productId}/similar?${queryString}` : `/products/${productId}/similar`;

        console.log('Request URL:', url);

        return apiService.get<PagedResponseDto<ProductResponseDto>>(url);
    },

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

    updateColor: (productId: number, imageId: number, colorId: number) =>
        apiService.patch(`/products/${productId}/images/${imageId}/color`, { colorId }),
};