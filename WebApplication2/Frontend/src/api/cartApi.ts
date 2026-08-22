import { apiRequest } from "./client";
import type {
    Cart,
    AddCartItemRequest,
    UpdateCartItemRequest,
} from "../types/cart";

export async function getCart(): Promise<Cart> {
    return apiRequest<Cart>(
        "/api/cart"
    );
}

export async function addCartItem(
    request: AddCartItemRequest
): Promise<void> {
    await apiRequest<void>(
        "/api/cart/items",
        {
            method: "POST",
            body: JSON.stringify(request),
        }
    );
}

export async function updateCartItem(
    productId: number,
    request: UpdateCartItemRequest
): Promise<void> {
    await apiRequest<void>(
        `/api/cart/items/${productId}`,
        {
            method: "PATCH",
            body: JSON.stringify(request),
        }
    );
}

export async function removeCartItem(
    productId: number
): Promise<void> {
    await apiRequest<void>(
        `/api/cart/items/${productId}`,
        {
            method: "DELETE",
        }
    );
}

export async function clearCart(): Promise<void> {
    await apiRequest<void>(
        "/api/cart",
        {
            method: "DELETE",
        }
    );
}