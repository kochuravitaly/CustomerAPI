export interface CategoryResponseDto {
    id: number;
    name: string;
    description?: string;
    nameTranslations?: Record<string, string>;
    descriptionTranslations?: Record<string, string>;
}

export interface CreateCategoryDto {
    name: string;
    description?: string;
}

export interface UpdateCategoryDto {
    name?: string;
    description?: string;
}

export interface ProductImageResponseDto {
    id: number;
    productId: number;
    colorId?: number;
    fileName: string;
    contentType: string;
    fileSize: number;
    sortOrder: number;
    isMain: boolean;
    objectKey: string;
}

export interface ProductResponseDto {
    id: number;
    name: string;
    description?: string;
    price: number;
    stockQuantity: number;
    categoryId: number;
    categoryName: string;
    gender: number;
    season: number;
    ageGroup: number;
    materialId?: number;
    materialName?: string;
    styleId?: number;
    styleName?: string;
    occasionId?: number;
    occasionName?: string;
    patternId?: number;
    patternName?: string;
    createdAt: string;
    updatedAt: string;
    images: ProductImageResponseDto[];
    nameTranslations?: Record<string, string>;
    descriptionTranslations?: Record<string, string>;
}

export interface UpdateProductDto {
    name?: string;
    description?: string;
    price?: number;
    stockQuantity?: number;
    categoryId?: number;
    gender?: number | null;
    season?: number | null;
    ageGroup?: number | null;
    materialId?: number | null;
    styleId?: number | null;
    occasionId?: number | null;
    patternId?: number | null;
}

export interface CreateProductDto {
    name: string;
    description?: string;
    price: number;
    stockQuantity: number;
    categoryId: number;
    gender?: number | null;
    season?: number | null;
    ageGroup?: number | null;
    materialId?: number | null;
    styleId?: number | null;
    occasionId?: number | null;
    patternId?: number | null;
}

export interface ProductQueryDto {
    search?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    gender?: number;
    season?: number;
    ageGroup?: number;
    materialId?: number;
    styleId?: number;
    occasionId?: number;
    patternId?: number;
    sortBy?: string;
    sortDirection?: string;
    page?: number;
    pageSize?: number;
}

export interface PagedResponseDto<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}