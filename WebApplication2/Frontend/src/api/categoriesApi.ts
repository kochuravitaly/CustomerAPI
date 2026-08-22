import { apiRequest } from "./client";
import type {
    Category,
    CreateCategoryRequest,
    UpdateCategoryRequest,
} from "../types/products";

export async function getCategories(): Promise<Category[]> {
    return apiRequest<Category[]>(
        "/api/categories"
    );
}

export async function getCategory(
    id: number
): Promise<Category> {
    return apiRequest<Category>(
        `/api/categories/${id}`
    );
}

export async function createCategory(
    request: CreateCategoryRequest
): Promise<Category> {
    return apiRequest<Category>(
        "/api/categories",
        {
            method: "POST",
            body: JSON.stringify(request),
        }
    );
}

export async function updateCategory(
    id: number,
    request: UpdateCategoryRequest
): Promise<void> {
    await apiRequest<void>(
        `/api/categories/${id}`,
        {
            method: "PATCH",
            body: JSON.stringify(request),
        }
    );
}

export async function deleteCategory(
    id: number
): Promise<void> {
    await apiRequest<void>(
        `/api/categories/${id}`,
        {
            method: "DELETE",
        }
    );
}