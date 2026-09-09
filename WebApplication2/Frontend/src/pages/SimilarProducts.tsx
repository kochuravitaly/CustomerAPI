import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { ProductCard } from '../components/ProductCard';
import { FilterBar } from '../components/FilterBar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useLanguage } from '../context/LanguageContext';
import { FilterState } from '../types/filter';

export const SimilarProducts: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [filters, setFilters] = useState<FilterState>(() => {
        const saved = localStorage.getItem(`similar_products_filters_${id}`);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return { sortBy: 'createdAt', sortDirection: 'desc' };
            }
        }
        return { sortBy: 'createdAt', sortDirection: 'desc' };
    });

    useEffect(() => {
        if (id) {
            localStorage.setItem(`similar_products_filters_${id}`, JSON.stringify(filters));
        }
    }, [id, filters]);

    const buildQueryParams = () => {
        const params: any = {
            page: 1,
            pageSize: 50,
            sortBy: filters.sortBy || 'createdAt',
            sortDirection: filters.sortDirection || 'desc',
        };

        if (filters.minPrice !== undefined) params.minPrice = filters.minPrice;
        if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
        if (filters.minRating !== undefined) params.minRating = filters.minRating;

        if (filters.colorIds && filters.colorIds.length > 0) {
            params.colorIds = filters.colorIds;
        }

        if (filters.sizes && filters.sizes.length > 0) {
            params.sizes = filters.sizes;
        }

        if (filters.materialIds && filters.materialIds.length > 0) {
            params.materialIds = filters.materialIds;
        }

        if (filters.styleIds && filters.styleIds.length > 0) {
            params.styleIds = filters.styleIds;
        }

        return params;
    };

    const { data: productsData, isLoading } = useQuery({
        queryKey: ['similar-products-page', id, filters],
        queryFn: async () => {
            const params = buildQueryParams();
            const response = await productService.getSimilarProducts(Number(id), params);
            return response.data;
        },
        enabled: !!id,
    });

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="similar-products-page">
            <button onClick={() => navigate(-1)} className="btn btn-outline back-btn">← {t.product.back}</button>
            <h1>{t.product.similarProducts || 'Similar Products'}</h1>

            <FilterBar filters={filters} onFiltersChange={setFilters} />

            {productsData && productsData.items.length > 0 ? (
                <div className="products-grid">
                    {productsData.items.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <p className="no-results">{t.admin.noItems}</p>
            )}
        </div>
    );
};