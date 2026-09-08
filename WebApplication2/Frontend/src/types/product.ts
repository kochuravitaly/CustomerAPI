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
    gender?: number;
    season?: number;
    ageGroup?: number;
    seasonsJson?: string;
    ageGroupsJson?: string;
    materialCompositionJson?: string;
    materialId?: number;
    materialName?: string;
    materialNameTranslations?: Record<string, string>;
    styleId?: number;
    styleName?: string;
    styleNameTranslations?: Record<string, string>;
    occasionId?: number;
    occasionName?: string;
    occasionNameTranslations?: Record<string, string>;
    patternId?: number;
    patternName?: string;
    patternNameTranslations?: Record<string, string>;
    createdAt: string;
    updatedAt: string;
    images: ProductImageResponseDto[];
    nameTranslations?: Record<string, string>;
    descriptionTranslations?: Record<string, string>;
}

export interface CreateProductDto {
    name: string;
    description?: string;
    price: number;
    stockQuantity: number;
    categoryId: number;
    gender?: number;
    season?: number;
    ageGroup?: number;
    seasonsJson?: string;
    ageGroupsJson?: string;
    materialCompositionJson?: string;
    materialId?: number;
    styleId?: number;
    occasionId?: number;
    patternId?: number;
}

export interface UpdateProductDto {
    name?: string;
    description?: string;
    price?: number;
    stockQuantity?: number;
    categoryId?: number;
    gender?: number;
    season?: number;
    ageGroup?: number;
    seasonsJson?: string;
    ageGroupsJson?: string;
    materialCompositionJson?: string;
    materialId?: number;
    styleId?: number;
    occasionId?: number;
    patternId?: number;
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

export interface RecommendationDto {
    productId: number;
    productName: string;
    productNameTranslations?: Record<string, string>;
    price: number;
    imageUrl?: string;
    timesBoughtTogether: number;
}

export interface ProductSuggestionDto {
    id: number;
    name: string;
    matchedName: string;
}