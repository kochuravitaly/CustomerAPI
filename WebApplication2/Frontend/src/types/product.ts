export interface CategoryResponseDto {
    id: number;
    name: string;
    description?: string;
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
    createdAt: string;
    updatedAt: string;
    images: ProductImageResponseDto[];
}

export interface CreateProductDto {
    name: string;
    description?: string;
    price: number;
    stockQuantity: number;
    categoryId: number;
}

export interface UpdateProductDto {
    name?: string;
    description?: string;
    price?: number;
    stockQuantity?: number;
    categoryId?: number;
}

export interface ProductQueryDto {
    search?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
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