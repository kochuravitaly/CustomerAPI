import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getCategories } from "../api/categoriesApi";
import { useProducts } from "../hooks/useProducts";
import type { Category } from "../types/products";
import { formatCurrency } from "../utils/formatCurrency";

export default function ProductsPage() {
    const [searchParams, setSearchParams] =
        useSearchParams();

    const [categories, setCategories] =
        useState<Category[]>([]);

    const page =
        Number(
            searchParams.get("page") ?? "1"
        ) || 1;

    const search =
        searchParams.get("search") ?? "";

    const categoryId =
        searchParams.get("categoryId");

    const sortBy =
        searchParams.get("sortBy") ??
        "createdAt";

    const sortDirection =
        searchParams.get("sortDirection") ??
        "desc";

    const [searchInput, setSearchInput] =
        useState(search);

    const {
        products,
        data,
        isLoading,
        error,
    } = useProducts({
        page,
        pageSize: 12,
        search,
        categoryId: categoryId
            ? Number(categoryId)
            : undefined,
        sortBy,
        sortDirection,
    });

    useEffect(() => {
        getCategories()
            .then(setCategories)
            .catch(() => setCategories([]));
    }, []);

    useEffect(() => {
        setSearchInput(search);
    }, [search]);

    function updateFilters(
        changes: Record<string, string>
    ) {
        const next =
            new URLSearchParams(
                searchParams
            );

        Object.entries(changes).forEach(
            ([key, value]) => {
                if (value) {
                    next.set(key, value);
                } else {
                    next.delete(key);
                }
            }
        );

        next.set("page", "1");

        setSearchParams(next);
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                        Products
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Discover something you'll love.
                    </p>
                </div>

                <div className="mb-8 grid gap-3 md:grid-cols-[1fr_220px_180px]">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();

                            updateFilters({
                                search: searchInput.trim(),
                            });
                        }}
                    >
                        <input
                            value={searchInput}
                            onChange={(event) =>
                                setSearchInput(
                                    event.target.value
                                )
                            }
                            placeholder="Search products..."
                            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                        />
                    </form>

                    <select
                        value={categoryId ?? ""}
                        onChange={(event) =>
                            updateFilters({
                                categoryId:
                                    event.target.value,
                            })
                        }
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                    >
                        <option value="">
                            All categories
                        </option>

                        {categories.map(
                            (category) => (
                                <option
                                    key={category.id}
                                    value={category.id}
                                >
                                    {category.name}
                                </option>
                            )
                        )}
                    </select>

                    <select
                        value={`${sortBy}:${sortDirection}`}
                        onChange={(event) => {
                            const [
                                newSortBy,
                                newDirection,
                            ] =
                                event.target.value.split(
                                    ":"
                                );

                            updateFilters({
                                sortBy: newSortBy,
                                sortDirection:
                                    newDirection,
                            });
                        }}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                    >
                        <option value="createdAt:desc">
                            Newest
                        </option>

                        <option value="price:asc">
                            Price: low to high
                        </option>

                        <option value="price:desc">
                            Price: high to low
                        </option>

                        <option value="name:asc">
                            Name A-Z
                        </option>
                    </select>
                </div>

                {error && (
                    <div className="mb-8 rounded-2xl bg-red-50 p-5 text-red-700">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {Array.from({
                            length: 8,
                        }).map((_, index) => (
                            <div
                                key={index}
                                className="h-80 animate-pulse rounded-3xl bg-slate-200"
                            />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="rounded-3xl bg-white p-16 text-center">
                        <h2 className="text-2xl font-bold text-slate-900">
                            No products found
                        </h2>

                        <p className="mt-2 text-slate-500">
                            Try changing your search or filters.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {products.map(
                            (product) => (
                                <Link
                                    key={product.id}
                                    to={`/products/${product.id}`}
                                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <div className="flex aspect-square items-center justify-center bg-slate-100">
                                        <span className="text-5xl font-bold text-slate-300">
                                            {product.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="p-5">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            {
                                                product.categoryName
                                            }
                                        </p>

                                        <h2 className="mt-1 truncate text-lg font-bold text-slate-900">
                                            {product.name}
                                        </h2>

                                        <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                                            {product.description ??
                                                "No description available."}
                                        </p>

                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-xl font-bold text-slate-900">
                                                {formatCurrency(
                                                    product.price
                                                )}
                                            </span>

                                            <span className="text-xs text-slate-500">
                                                {product.stockQuantity >
                                                    0
                                                    ? `${product.stockQuantity} in stock`
                                                    : "Out of stock"}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            )
                        )}
                    </div>
                )}

                {data &&
                    data.totalPages > 1 && (
                        <div className="mt-10 flex items-center justify-center gap-2">
                            <button
                                type="button"
                                disabled={
                                    page <= 1
                                }
                                onClick={() =>
                                    updateFilters({
                                        page: String(
                                            page - 1
                                        ),
                                    })
                                }
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <span className="px-4 text-sm text-slate-500">
                                Page{" "}
                                {data.page} of{" "}
                                {data.totalPages}
                            </span>

                            <button
                                type="button"
                                disabled={
                                    page >=
                                    data.totalPages
                                }
                                onClick={() =>
                                    updateFilters({
                                        page: String(
                                            page + 1
                                        ),
                                    })
                                }
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    )}
            </div>
        </main>
    );
}