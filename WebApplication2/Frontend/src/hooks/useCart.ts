import { useCallback, useEffect, useState } from "react";
import {
    addCartItem,
    clearCart,
    getCart,
    removeCartItem,
    updateCartItem,
} from "../api/cartApi";
import type {
    AddCartItemRequest,
    Cart,
    UpdateCartItemRequest,
} from "../types/cart";
import { useAuth } from "../auth/AuthContext";

const emptyCart: Cart = {
    cartItems: [],
    total: 0,
};

export function useCart() {
    const { isAuthenticated } = useAuth();

    const [cart, setCart] = useState<Cart>(emptyCart);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadCart = useCallback(async () => {
        if (!isAuthenticated) {
            setCart(emptyCart);
            setError(null);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const result = await getCart();
            setCart(result);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load cart."
            );
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        void loadCart();
    }, [loadCart]);

    const addItem = useCallback(
        async (request: AddCartItemRequest) => {
            await addCartItem(request);
            await loadCart();
        },
        [loadCart]
    );

    const updateItem = useCallback(
        async (
            productId: number,
            request: UpdateCartItemRequest
        ) => {
            await updateCartItem(productId, request);
            await loadCart();
        },
        [loadCart]
    );

    const removeItem = useCallback(
        async (productId: number) => {
            await removeCartItem(productId);
            await loadCart();
        },
        [loadCart]
    );

    const empty = useCallback(async () => {
        await clearCart();
        await loadCart();
    }, [loadCart]);

    return {
        cart,
        isLoading,
        error,
        loadCart,
        addItem,
        updateItem,
        removeItem,
        clearCart: empty,
    };
}