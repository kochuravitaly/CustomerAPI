import { useCallback, useEffect, useState } from "react";
import { getProducts } from "../api/productsApi";
import type {
    Product,
    ProductQuery,
    PagedResponse,
} from "../types/products";

export function useProducts(
    query: ProductQuery = {}
) {
    const [data, setData] =
        useState<PagedResponse<Product> | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadProducts = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const result = await getProducts(query);

            setData(result);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load products."
            );
        } finally {
            setIsLoading(false);
        }
    }, [
        query.page,
        query.pageSize,
        query.search,
        query.categoryId,
        query.minPrice,
        query.maxPrice,
        query.sortBy,
        query.sortDirection,
    ]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    return {
        data,
        products: data?.items ?? [],
        isLoading,
        error,
        reload: loadProducts,
    };
}