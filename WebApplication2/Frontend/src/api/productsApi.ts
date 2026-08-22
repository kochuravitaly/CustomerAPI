import { apiRequest } from "./client";
import type {
    Product,
    ProductQuery,
    PagedResponse,
    CreateProductRequest,
    UpdateProductRequest,
} from "../types/products";

export async function getProducts(
    query: ProductQuery = {}
): Promise<PagedResponse<Product>> {
    const params = new URLSearchParams();

    if (query.search) {
        params.set("Search", query.search);
    }

    if (query.categoryId !== undefined) {
        params.set("CategoryId", String(query.categoryId));
    }

    if (query.minPrice !== undefined) {
        params.set("MinPrice", String(query.minPrice));
    }

    if (query.maxPrice !== undefined) {
        params.set("MaxPrice", String(query.maxPrice));
    }

    if (query.sortBy) {
        params.set("SortBy", query.sortBy);
    }

    if (query.sortDirection) {
        params.set("SortDirection", query.sortDirection);
    }

    if (query.page !== undefined) {
        params.set("Page", String(query.page));
    }

    if (query.pageSize !== undefined) {
        params.set("PageSize", String(query.pageSize));
    }

    const queryString = params.toString();

    return apiRequest<PagedResponse<Product>>(
        `/api/products${queryString ? `?${queryString}` : ""}`
    );
}

export async function getProduct(
    id: number
): Promise<Product> {
    return apiRequest<Product>(
        `/api/products/${id}`
    );
}

export async function createProduct(
    request: CreateProductRequest
): Promise<Product> {
    return apiRequest<Product>(
        "/api/products",
        {
            method: "POST",
            body: JSON.stringify(request),
        }
    );
}

export async function updateProduct(
    id: number,
    request: UpdateProductRequest
): Promise<void> {
    await apiRequest<void>(
        `/api/products/${id}`,
        {
            method: "PATCH",
            body: JSON.stringify(request),
        }
    );
}

export async function deleteProduct(
    id: number
): Promise<void> {
    await apiRequest<void>(
        `/api/products/${id}`,
        {
            method: "DELETE",
        }
    );
}