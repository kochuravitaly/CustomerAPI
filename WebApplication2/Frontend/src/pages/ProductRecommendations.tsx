import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { FilterModal, FilterSection } from '../components/FilterModal';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const ProductRecommendations: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const { formatPrice } = useCurrency();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortBy, setSortBy] = useState('timesBought');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
    const [selectedTimesBought, setSelectedTimesBought] = useState<string[]>([]);
    const [query, setQuery] = useState<{ sortBy?: string; sortDirection?: string; minPrice?: number; maxPrice?: number; minTimesBought?: number }>({
        sortBy: 'timesBought',
        sortDirection: 'desc',
    });

    const { data: recommendations, isLoading } = useQuery({
        queryKey: ['all-recommendations', id, query],
        queryFn: async () => (await productService.getAllRecommendations(Number(id), query)).data,
        enabled: !!id,
    });

    const priceRanges = [
        { label: 'Under $25', value: '0-25' },
        { label: '$25 - $50', value: '25-50' },
        { label: '$50 - $100', value: '50-100' },
        { label: '$100+', value: '100-999999' },
    ];

    const timesBoughtRanges = [
        { label: '2+ times', value: '2' },
        { label: '3+ times', value: '3' },
        { label: '5+ times', value: '5' },
    ];

    const handleApplyFilters = () => {
        const newQuery: any = {};

        if (selectedPrices.length > 0) {
            const minPrices = selectedPrices.map(p => Number(p.split('-')[0]));
            const maxPrices = selectedPrices.map(p => Number(p.split('-')[1]));
            newQuery.minPrice = Math.min(...minPrices);
            newQuery.maxPrice = Math.max(...maxPrices);
        }

        if (selectedTimesBought.length > 0) {
            const minTimes = selectedTimesBought.map(t => Number(t));
            newQuery.minTimesBought = Math.min(...minTimes);
        }

        newQuery.sortBy = sortBy;
        newQuery.sortDirection = sortDirection;

        setQuery(newQuery);
        setIsFilterOpen(false);
    };

    const handleClearFilters = () => {
        setSelectedPrices([]);
        setSelectedTimesBought([]);
        setSortBy('timesBought');
        setSortDirection('desc');
        setQuery({ sortBy: 'timesBought', sortDirection: 'desc' });
        setIsFilterOpen(false);
    };

    const filterSections: FilterSection[] = [
        {
            id: 'sort',
            title: t.search.sortBy || 'Sort By',
            type: 'sort',
            options: [
                { label: t.product.boughtTogether || 'Bought Together', value: 'timesBought' },
                { label: t.search.priceLowHigh || 'Price: Low to High', value: 'price' },
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
        {
            id: 'timesBought',
            title: t.product.boughtTogether || 'Times Bought Together',
            type: 'checkbox',
            options: timesBoughtRanges,
            selectedValues: selectedTimesBought,
            onToggle: (value) => {
                setSelectedTimesBought(prev =>
                    prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
                );
            },
        },
    ];

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="recommendations-page">
            <button onClick={() => navigate(-1)} className="btn btn-outline back-btn">← {t.product.back}</button>
            <h1>{t.product.customersAlsoBought || 'Customers Also Bought'}</h1>

            <button onClick={() => setIsFilterOpen(true)} className="btn btn-outline" style={{ marginBottom: '16px' }}>
                {t.search.filters || 'Filters'} ▾
            </button>

            {recommendations && recommendations.length > 0 ? (
                <div className="products-grid">
                    {recommendations.map((rec) => (
                        <Link key={rec.productId} to={`/products/${rec.productId}`} className="product-card">
                            <div className="product-image">
                                {rec.imageUrl && (
                                    <img src={`${(import.meta as any).env?.VITE_API_URL}${rec.imageUrl}`} alt={rec.productNameTranslations?.[language] || rec.productName} />
                                )}
                            </div>
                            <div className="product-info">
                                <h3 className="product-name">{rec.productNameTranslations?.[language] || rec.productName}</h3>
                                <div className="product-price">{formatPrice(rec.price)}</div>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    {t.product.boughtTogether || 'Bought together'}: {rec.timesBoughtTogether}x
                                </span>
                            </div>
                        </Link>
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
                    setSortBy(newSort);
                    if (newSort === 'price') {
                        setSortDirection('asc');
                    } else {
                        setSortDirection('desc');
                    }
                }}
                onDirectionChange={setSortDirection}
            />
        </div>
    );
};