import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { ProductCard } from '../components/ProductCard';
import { FilterModal, FilterSection } from '../components/FilterModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useLanguage } from '../context/LanguageContext';

export const SimilarProducts: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
    const [query, setQuery] = useState({ page: 1, pageSize: 50, sortBy: 'createdAt', sortDirection: 'desc' });

    const { data: productsData, isLoading } = useQuery({
        queryKey: ['similar-products-page', id, query],
        queryFn: async () => {
            const response = await productService.getSimilarProducts(Number(id), query);
            return response.data;
        },
        enabled: !!id,
    });

    const { data: colors } = useQuery({
        queryKey: ['all-colors-for-filter'],
        queryFn: async () => {
            const response = await productService.getAll({ page: 1, pageSize: 100 });
            const allColors = new Map<string, string>();
            response.data.items.forEach(product => {
                product.images.forEach(img => {
                    if (img.colorId) {
                        allColors.set(String(img.colorId), '');
                    }
                });
            });
            return Array.from(allColors.keys());
        },
    });

    const priceRanges = [
        { label: 'Under $25', value: '0-25' },
        { label: '$25 - $50', value: '25-50' },
        { label: '$50 - $100', value: '50-100' },
        { label: '$100+', value: '100-999999' },
    ];

    const handleApplyFilters = () => {
        const newQuery: any = { ...query, page: 1 };

        if (selectedPrices.length > 0) {
            const minPrices = selectedPrices.map(p => Number(p.split('-')[0]));
            const maxPrices = selectedPrices.map(p => Number(p.split('-')[1]));
            newQuery.minPrice = Math.min(...minPrices);
            newQuery.maxPrice = Math.max(...maxPrices);
        } else {
            newQuery.minPrice = undefined;
            newQuery.maxPrice = undefined;
        }

        newQuery.sortBy = sortBy;
        newQuery.sortDirection = sortDirection;

        setQuery(newQuery);
        setIsFilterOpen(false);
    };

    const handleClearFilters = () => {
        setSelectedPrices([]);
        setSortBy('createdAt');
        setSortDirection('desc');
        setQuery({ page: 1, pageSize: 50, sortBy: 'createdAt', sortDirection: 'desc' });
        setIsFilterOpen(false);
    };

    const filterSections: FilterSection[] = [
        {
            id: 'sort',
            title: t.search.sortBy || 'Sort By',
            type: 'sort',
            options: [
                { label: t.search.newest || 'Newest', value: 'createdAt' },
                { label: t.search.priceLowHigh || 'Price: Low to High', value: 'price-asc' },
                { label: t.search.priceHighLow || 'Price: High to Low', value: 'price-desc' },
                { label: t.search.name || 'Name', value: 'name' },
            ],
            selectedValues: [],
            onToggle: () => { },
        },
        {
            id: 'price',
            title: 'Price',
            type: 'checkbox',
            options: priceRanges,
            selectedValues: selectedPrices,
            onToggle: (value) => {
                setSelectedPrices(prev =>
                    prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
                );
            },
        },
    ];

    return (
        <div className="similar-products-page">
            <button onClick={() => navigate(-1)} className="btn btn-outline back-btn">← {t.product.back}</button>
            <h1>{t.product.similarProducts || 'Similar Products'}</h1>

            <button onClick={() => setIsFilterOpen(true)} className="btn btn-outline">
                {t.search.filters || 'Filters'} ▾
            </button>

            {isLoading ? (
                <LoadingSpinner />
            ) : productsData && productsData.items.length > 0 ? (
                <div className="products-grid">
                    {productsData.items.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <p className="no-results">{t.admin.noItems}</p>
            )}

            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
                sections={filterSections}
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSortChange={(newSort) => {
                    if (newSort === 'price-asc') {
                        setSortBy('price');
                        setSortDirection('asc');
                    } else if (newSort === 'price-desc') {
                        setSortBy('price');
                        setSortDirection('desc');
                    } else {
                        setSortBy(newSort);
                        setSortDirection('desc');
                    }
                }}
                onDirectionChange={setSortDirection}
            />
        </div>
    );
};