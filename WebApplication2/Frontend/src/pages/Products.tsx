import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService, categoryService } from '../services/product.service';
import { ProductQueryDto } from '../types/product';
import { ProductCard } from '../components/ProductCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Pagination } from '../components/Pagination';

export const Products: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [query, setQuery] = useState<ProductQueryDto>({
        search: searchParams.get('search') || '',
        categoryId: searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined,
        minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
        maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortDirection: searchParams.get('sortDirection') || 'desc',
        page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
        pageSize: 12,
    });

    const [searchInput, setSearchInput] = useState(query.search || '');
    const [priceRange, setPriceRange] = useState({
        min: query.minPrice?.toString() || '',
        max: query.maxPrice?.toString() || '',
    });

    const { data: productsData, isLoading } = useQuery({
        queryKey: ['products', query],
        queryFn: async () => {
            const response = await productService.getAll(query);
            return response.data;
        },
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await categoryService.getAll();
            return response.data;
        },
    });

    const updateQuery = (newQuery: Partial<ProductQueryDto>) => {
        const updated = { ...query, ...newQuery, page: newQuery.page || 1 };
        setQuery(updated);

        // Update URL params
        const params: any = {};
        if (updated.search) params.search = updated.search;
        if (updated.categoryId) params.categoryId = updated.categoryId;
        if (updated.minPrice) params.minPrice = updated.minPrice;
        if (updated.maxPrice) params.maxPrice = updated.maxPrice;
        if (updated.sortBy !== 'createdAt') params.sortBy = updated.sortBy;
        if (updated.sortDirection !== 'desc') params.sortDirection = updated.sortDirection;
        if (updated.page > 1) params.page = updated.page;
        setSearchParams(params);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateQuery({ search: searchInput });
    };

    const handleCategoryChange = (categoryId: number | undefined) => {
        updateQuery({ categoryId });
    };

    const handlePriceFilter = () => {
        updateQuery({
            minPrice: priceRange.min ? Number(priceRange.min) : undefined,
            maxPrice: priceRange.max ? Number(priceRange.max) : undefined,
        });
    };

    const handleSortChange = (sortBy: string) => {
        updateQuery({ sortBy, sortDirection: sortBy === 'price' ? 'asc' : 'desc' });
    };

    const handlePageChange = (page: number) => {
        updateQuery({ page });
    };

    return (
        <div className="products-page">
            <div className="products-header">
                <h1>Products</h1>
                <p>{productsData?.totalCount || 0} products found</p>
            </div>

            <div className="products-layout">
                {/* Sidebar Filters */}
                <aside className="filters-sidebar">
                    <div className="filter-section">
                        <h3>Search</h3>
                        <form onSubmit={handleSearch} className="search-form">
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search products..."
                                className="search-input"
                            />
                            <button type="submit" className="btn btn-primary">
                                Search
                            </button>
                        </form>
                    </div>

                    <div className="filter-section">
                        <h3>Categories</h3>
                        <div className="category-list">
                            <button
                                onClick={() => handleCategoryChange(undefined)}
                                className={`category-filter ${!query.categoryId ? 'active' : ''}`}
                            >
                                All Categories
                            </button>
                            {categories?.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => handleCategoryChange(category.id)}
                                    className={`category-filter ${query.categoryId === category.id ? 'active' : ''}`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="filter-section">
                        <h3>Price Range</h3>
                        <div className="price-inputs">
                            <input
                                type="number"
                                placeholder="Min"
                                value={priceRange.min}
                                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                className="price-input"
                            />
                            <span>to</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={priceRange.max}
                                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                className="price-input"
                            />
                        </div>
                        <button onClick={handlePriceFilter} className="btn btn-outline btn-block">
                            Apply Price Filter
                        </button>
                    </div>

                    <div className="filter-section">
                        <h3>Sort By</h3>
                        <select
                            value={query.sortBy}
                            onChange={(e) => handleSortChange(e.target.value)}
                            className="sort-select"
                        >
                            <option value="createdAt">Newest</option>
                            <option value="price">Price: Low to High</option>
                            <option value="name">Name</option>
                        </select>
                    </div>
                </aside>

                {/* Products Grid */}
                <div className="products-content">
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : (
                        <>
                            <div className="products-grid">
                                {productsData?.items.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>

                            {productsData && productsData.items.length === 0 && (
                                <div className="no-products">
                                    <p>No products found</p>
                                </div>
                            )}

                            {productsData && (
                                <Pagination
                                    currentPage={productsData.page}
                                    totalPages={productsData.totalPages}
                                    onPageChange={handlePageChange}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};