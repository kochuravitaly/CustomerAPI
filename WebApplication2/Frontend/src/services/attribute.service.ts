import { apiService } from './api';

export interface ProductAttributeDto {
    id: number;
    name: string;
}

export const attributeService = {
    getMaterials: () =>
        apiService.get<ProductAttributeDto[]>('/productattributes/materials'),

    getStyles: () =>
        apiService.get<ProductAttributeDto[]>('/productattributes/styles'),

    getOccasions: () =>
        apiService.get<ProductAttributeDto[]>('/productattributes/occasions'),

    getPatterns: () =>
        apiService.get<ProductAttributeDto[]>('/productattributes/patterns'),

    createMaterial: (name: string) =>
        apiService.post<ProductAttributeDto>('/productattributes/materials', { name }),

    createStyle: (name: string) =>
        apiService.post<ProductAttributeDto>('/productattributes/styles', { name }),

    createOccasion: (name: string) =>
        apiService.post<ProductAttributeDto>('/productattributes/occasions', { name }),

    createPattern: (name: string) =>
        apiService.post<ProductAttributeDto>('/productattributes/patterns', { name }),

    updateMaterial: (id: number, name: string) =>
        apiService.patch(`/productattributes/materials/${id}`, { name }),

    updateStyle: (id: number, name: string) =>
        apiService.patch(`/productattributes/styles/${id}`, { name }),

    updateOccasion: (id: number, name: string) =>
        apiService.patch(`/productattributes/occasions/${id}`, { name }),

    updatePattern: (id: number, name: string) =>
        apiService.patch(`/productattributes/patterns/${id}`, { name }),

    deleteMaterial: (id: number) =>
        apiService.delete(`/productattributes/materials/${id}`),

    deleteStyle: (id: number) =>
        apiService.delete(`/productattributes/styles/${id}`),

    deleteOccasion: (id: number) =>
        apiService.delete(`/productattributes/occasions/${id}`),

    deletePattern: (id: number) =>
        apiService.delete(`/productattributes/patterns/${id}`),
};