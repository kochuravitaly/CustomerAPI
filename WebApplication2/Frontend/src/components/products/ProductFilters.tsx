import type { ProductQuery } from "../../types/products";

interface ProductFiltersProps {
    filters: ProductQuery;
    categories: {
        id: number;
        name: string;
    }[];
    onChange: (filters: ProductQuery) => void;
}

export default function ProductFilters({
    filters,
    categories,
    onChange
}: ProductFiltersProps) {
    return (
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={filters.search ?? ""}
                    onChange={event =>
                        onChange({
                            ...filters,
                            search: event.target.value
                        })
                    }
                    className="rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-900"
                />

                <select
                    value={filters.categoryId ?? ""}
                    onChange={event =>
                        onChange({
                            ...filters,
                            categoryId: event.target.value
                                ? Number(event.target.value)
                                : undefined
                        })
                    }
                    className="rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-900"
                >
                    <option value="">All categories</option>

                    {categories.map(category => (
                        <option
                            key={category.id}
                            value={category.id}
                        >
                            {category.name}
                        </option>
                    ))}
                </select>

                <input
                    type="number"
                    placeholder="Min price"
                    value={filters.minPrice ?? ""}
                    onChange={event =>
                        onChange({
                            ...filters,
                            minPrice: event.target.value
                                ? Number(event.target.value)
                                : undefined
                        })
                    }
                    className="rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-900"
                />

                <input
                    type="number"
                    placeholder="Max price"
                    value={filters.maxPrice ?? ""}
                    onChange={event =>
                        onChange({
                            ...filters,
                            maxPrice: event.target.value
                                ? Number(event.target.value)
                                : undefined
                        })
                    }
                    className="rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-900"
                />

                <select
                    value={`${filters.sortBy ?? "createdAt"}-${filters.sortDirection ?? "desc"}`}
                    onChange={event => {
                        const [sortBy, sortDirection] =
                            event.target.value.split("-");

                        onChange({
                            ...filters,
                            sortBy,
                            sortDirection
                        });
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-900"
                >
                    <option value="createdAt-desc">
                        Newest
                    </option>

                    <option value="createdAt-asc">
                        Oldest
                    </option>

                    <option value="name-asc">
                        Name A-Z
                    </option>

                    <option value="name-desc">
                        Name Z-A
                    </option>

                    <option value="price-asc">
                        Price low-high
                    </option>

                    <option value="price-desc">
                        Price high-low
                    </option>

                    <option value="stock-desc">
                        Stock high-low
                    </option>

                    <option value="stock-asc">
                        Stock low-high
                    </option>
                </select>
            </div>
        </div>
    );
}