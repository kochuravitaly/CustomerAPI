export interface ProductImage {
    id: number;
    productId: number;
    fileName: string;
    contentType: string;
    fileSize: number;
    sortOrder: number;
    isMain: boolean;
    objectKey: string;
}

export interface Product {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stockQuantity: number;
    categoryId: number;
    categoryName: string;
    createdAt: string;
    updatedAt: string;
    images: ProductImage[];
}

export interface Category {
    id: number;
    name: string;
    description: string | null;
}

export interface CreateProductRequest {
    name: string;
    description: string | null;
    price: number;
    stockQuantity: number;
    categoryId: number;
}

export interface UpdateProductRequest {
    name?: string;
    description?: string | null;
    price?: number;
    stockQuantity?: number;
    categoryId?: number;
}

export interface CreateCategoryRequest {
    name: string;
    description: string | null;
}

export interface UpdateCategoryRequest {
    name?: string;
    description?: string | null;
}

export interface ProductQuery {
    search?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortDirection?: string;
    page?: number;
    pageSize?: number;
}

export interface PagedResponse<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}