import { useCallback, useEffect, useState } from "react";
import { getProduct } from "../api/productsApi";
import type { Product } from "../types/products";

export function useProduct(id: number | undefined) {
    const [product, setProduct] =
        useState<Product | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadProduct = useCallback(async () => {
        if (id === undefined) {
            setProduct(null);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const result = await getProduct(id);

            setProduct(result);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load product."
            );
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadProduct();
    }, [loadProduct]);

    return {
        product,
        isLoading,
        error,
        reload: loadProduct,
    };
}