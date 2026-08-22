import { apiRequest } from "./client";
import type { ProductImage } from "../types/products";

export async function uploadProductImage(
    productId: number,
    file: File
): Promise<ProductImage> {
    const formData = new FormData();

    formData.append(
        "file",
        file
    );

    return apiRequest<ProductImage>(
        `/api/products/${productId}/images`,
        {
            method: "POST",
            body: formData,
        }
    );
}

export async function deleteProductImage(
    productId: number,
    imageId: number
): Promise<void> {
    await apiRequest<void>(
        `/api/products/${productId}/images/${imageId}`,
        {
            method: "DELETE",
        }
    );
}

export async function setMainProductImage(
    productId: number,
    imageId: number
): Promise<void> {
    await apiRequest<void>(
        `/api/products/${productId}/images/${imageId}/main`,
        {
            method: "PUT",
        }
    );
}

export async function updateProductImageSortOrder(
    productId: number,
    imageId: number,
    sortOrder: number
): Promise<void> {
    await apiRequest<void>(
        `/api/products/${productId}/images/${imageId}/sort-order`,
        {
            method: "PUT",
            body: JSON.stringify({
                sortOrder,
            }),
        }
    );
}