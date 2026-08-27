import { apiService } from './api';
import { ProductResponseDto, PagedResponseDto } from '../types/product';

export interface HomeSectionResponseDto {
    id: number;
    title: string;
    displayOrder: number;
    productsToShow: number;
    isActive: boolean;
    filterJson: string;
}

export interface CreateHomeSectionDto {
    title: string;
    displayOrder: number;
    productsToShow: number;
    filterJson: string;
}

export const homeSectionService = {
    getActive: () =>
        apiService.get<HomeSectionResponseDto[]>('/homesections'),

    getAll: () =>
        apiService.get<HomeSectionResponseDto[]>('/homesections/all'),

    create: (data: CreateHomeSectionDto) =>
        apiService.post<HomeSectionResponseDto>('/homesections', data),

    update: (id: number, data: CreateHomeSectionDto) =>
        apiService.patch(`/homesections/${id}`, data),

    delete: (id: number) =>
        apiService.delete(`/homesections/${id}`),

    getProducts: (id: number, page = 1, pageSize = 4) =>
        apiService.get<PagedResponseDto<ProductResponseDto>>(`/homesections/${id}/products`, {
            params: { page, pageSize },
        }),
};