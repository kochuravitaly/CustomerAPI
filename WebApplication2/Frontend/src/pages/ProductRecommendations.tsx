import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { ProductCard } from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ProductResponseDto } from '../types/product';

export const ProductRecommendations: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const { currency, rates } = useCurrency();

    const [query, setQuery] = useState<{ sortBy?: string; sortDirection?: string; minPrice?: number; maxPrice?: number }>(() => {
        const saved = localStorage.getItem(`recommendations_filters_${id}`);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return { sortBy: 'timesBought', sortDirection: 'desc' };
            }
        }
        return { sortBy: 'timesBought', sortDirection: 'desc' };
    });

    const [sortBy, setSortBy] = useState<'timesBought' | 'price-asc' | 'price-desc'>(() => {
        const saved = localStorage.getItem(`recommendations_filters_${id}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.sortBy === 'price' && parsed.sortDirection === 'asc') return 'price-asc';
                if (parsed.sortBy === 'price' && parsed.sortDirection === 'desc') return 'price-desc';
                return 'timesBought';
            } catch {
                return 'timesBought';
            }
        }
        return 'timesBought';
    });

    const [priceRange, setPriceRange] = useState<string>(() => {
        const saved = localStorage.getItem(`recommendations_filters_${id}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.minPrice !== undefined || parsed.maxPrice !== undefined) {
                    if (parsed.minPrice === 0 && parsed.maxPrice === 2000) return '0-2000';
                    if (parsed.minPrice === 2000 && parsed.maxPrice === 5000) return '2000-5000';
                    if (parsed.minPrice === 5000 && parsed.maxPrice === 10000) return '5000-10000';
                    if (parsed.minPrice === 10000) return '10000-999999';
                    return 'custom';
                }
                return 'all';
            } catch {
                return 'all';
            }
        }
        return 'all';
    });

    const [showSortSheet, setShowSortSheet] = useState(false);
    const [showPriceSheet, setShowPriceSheet] = useState(false);
    const [customMinPrice, setCustomMinPrice] = useState('');
    const [customMaxPrice, setCustomMaxPrice] = useState('');

    useEffect(() => {
        if (id) {
            localStorage.setItem(`recommendations_filters_${id}`, JSON.stringify(query));
        }
    }, [id, query]);

    useEffect(() => {
        if (showSortSheet || showPriceSheet) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showSortSheet, showPriceSheet]);

    const { data: recommendations, isLoading } = useQuery({
        queryKey: ['all-recommendations', id, query],
        queryFn: async () => (await productService.getAllRecommendations(Number(id), query)).data,
        enabled: !!id,
    });

    const getPricePresets = () => {
        switch (currency) {
            case 'RUB':
                return [
                    { label: t.product.allPrices || 'Все цены', value: 'all', min: null, max: null },
                    { label: 'До 2,000₽', value: '0-2000', min: 0, max: 2000 },
                    { label: '2,000₽ - 5,000₽', value: '2000-5000', min: 2000, max: 5000 },
                    { label: '5,000₽ - 10,000₽', value: '5000-10000', min: 5000, max: 10000 },
                    { label: '10,000₽+', value: '10000-999999', min: 10000, max: null },
                ];
            case 'EUR':
                return [
                    { label: t.product.allPrices || 'Alle Preise', value: 'all', min: null, max: null },
                    { label: 'Unter €20', value: '0-1800', min: 0, max: 1800 },
                    { label: '€20 - €50', value: '1800-4500', min: 1800, max: 4500 },
                    { label: '€50 - €100', value: '4500-9000', min: 4500, max: 9000 },
                    { label: '€100+', value: '9000-999999', min: 9000, max: null },
                ];
            case 'GBP':
                return [
                    { label: t.product.allPrices || 'All Prices', value: 'all', min: null, max: null },
                    { label: 'Under £20', value: '0-2100', min: 0, max: 2100 },
                    { label: '£20 - £50', value: '2100-5300', min: 2100, max: 5300 },
                    { label: '£50 - £100', value: '5300-10500', min: 5300, max: 10500 },
                    { label: '£100+', value: '10500-999999', min: 10500, max: null },
                ];
            default:
                return [{ label: t.product.allPrices || 'All Prices', value: 'all', min: null, max: null }];
        }
    };

    const pricePresets = getPricePresets();

    const getCurrencySymbol = () => {
        switch (currency) {
            case 'RUB': return '₽';
            case 'EUR': return '€';
            case 'GBP': return '£';
            default: return '';
        }
    };

    const applySort = (newSortBy: 'timesBought' | 'price-asc' | 'price-desc') => {
        const newQuery: any = { ...query };

        if (newSortBy === 'price-asc') {
            newQuery.sortBy = 'price';
            newQuery.sortDirection = 'asc';
        } else if (newSortBy === 'price-desc') {
            newQuery.sortBy = 'price';
            newQuery.sortDirection = 'desc';
        } else {
            newQuery.sortBy = 'timesBought';
            newQuery.sortDirection = 'desc';
        }

        setSortBy(newSortBy);
        setQuery(newQuery);
        setShowSortSheet(false);
    };

    const applyPricePreset = (value: string) => {
        setPriceRange(value);
        const newQuery: any = { ...query };

        if (value === 'all') {
            delete newQuery.minPrice;
            delete newQuery.maxPrice;
        } else {
            const preset = pricePresets.find(p => p.value === value);
            if (preset) {
                if (preset.min !== null) newQuery.minPrice = preset.min;
                if (preset.max !== null) newQuery.maxPrice = preset.max;
            }
        }

        setQuery(newQuery);
        setShowPriceSheet(false);
    };

    const applyCustomPrice = () => {
        const newQuery: any = { ...query };

        if (customMinPrice) {
            const minInRub = currency === 'RUB'
                ? Number(customMinPrice)
                : Math.round(Number(customMinPrice) / rates[currency]);
            newQuery.minPrice = minInRub;
        } else {
            delete newQuery.minPrice;
        }

        if (customMaxPrice) {
            const maxInRub = currency === 'RUB'
                ? Number(customMaxPrice)
                : Math.round(Number(customMaxPrice) / rates[currency]);
            newQuery.maxPrice = maxInRub;
        } else {
            delete newQuery.maxPrice;
        }

        setPriceRange('custom');
        setQuery(newQuery);
        setShowPriceSheet(false);
    };

    const getSortLabel = () => {
        switch (sortBy) {
            case 'timesBought': return t.product.boughtTogether || 'Bought Together';
            case 'price-asc': return t.search.priceLowHigh || 'Price: Low to High';
            case 'price-desc': return t.search.priceHighLow || 'Price: High to Low';
            default: return 'Sort';
        }
    };

    const getPriceLabel = () => {
        if (priceRange === 'custom') {
            const symbol = getCurrencySymbol();
            const min = customMinPrice ? `${symbol}${customMinPrice}` : symbol;
            const max = customMaxPrice ? `${symbol}${customMaxPrice}` : '∞';
            return `${min} - ${max}`;
        }
        const preset = pricePresets.find(p => p.value === priceRange);
        if (preset && preset.value !== 'all') return preset.label;
        return pricePresets[0].label;
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="recommendations-page">
            <button onClick={() => navigate(-1)} className="btn btn-outline back-btn">← {t.product.back}</button>
            <h1>{t.product.customersAlsoBought || 'Customers Also Bought'}</h1>

            <div className="filter-bar-scroll" style={{ overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div style={{ display: 'flex', gap: '8px', padding: '4px 0', alignItems: 'center' }}>
                    <button className="btn btn-outline filter-btn" onClick={() => { setShowSortSheet(true); setShowPriceSheet(false); }}>
                        {getSortLabel()} ▾
                    </button>
                    <button className="btn btn-outline filter-btn" onClick={() => { setShowPriceSheet(true); setShowSortSheet(false); }}>
                        {getPriceLabel()} ▾
                    </button>
                </div>
            </div>

            {showSortSheet && (
                <div className="filter-bottom-sheet-overlay" onClick={() => setShowSortSheet(false)}>
                    <div className="filter-bottom-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="filter-bottom-sheet-header">
                            <h3>{t.search.sortBy || 'Sort By'}</h3>
                            <button className="filter-bottom-sheet-close" onClick={() => setShowSortSheet(false)}>✕</button>
                        </div>
                        <button className={`filter-bottom-sheet-option ${sortBy === 'timesBought' ? 'active' : ''}`} onClick={() => applySort('timesBought')}>
                            {t.product.boughtTogether || 'Bought Together'}
                        </button>
                        <button className={`filter-bottom-sheet-option ${sortBy === 'price-asc' ? 'active' : ''}`} onClick={() => applySort('price-asc')}>
                            {t.search.priceLowHigh || 'Price: Low to High'}
                        </button>
                        <button className={`filter-bottom-sheet-option ${sortBy === 'price-desc' ? 'active' : ''}`} onClick={() => applySort('price-desc')}>
                            {t.search.priceHighLow || 'Price: High to Low'}
                        </button>
                    </div>
                </div>
            )}

            {showPriceSheet && (
                <div className="filter-bottom-sheet-overlay" onClick={() => setShowPriceSheet(false)}>
                    <div className="filter-bottom-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="filter-bottom-sheet-header">
                            <h3>{t.product.price || 'Price'}</h3>
                            <button className="filter-bottom-sheet-close" onClick={() => setShowPriceSheet(false)}>✕</button>
                        </div>
                        {pricePresets.map((preset) => (
                            <button
                                key={preset.value}
                                className={`filter-bottom-sheet-option ${priceRange === preset.value ? 'active' : ''}`}
                                onClick={() => applyPricePreset(preset.value)}
                            >
                                {preset.label}
                            </button>
                        ))}
                        <div className="filter-price-inputs">
                            <input
                                type="number"
                                placeholder={t.product.minPrice || 'Min'}
                                value={customMinPrice}
                                onChange={(e) => setCustomMinPrice(e.target.value)}
                            />
                            <span>-</span>
                            <input
                                type="number"
                                placeholder={t.product.maxPrice || 'Max'}
                                value={customMaxPrice}
                                onChange={(e) => setCustomMaxPrice(e.target.value)}
                            />
                            <button onClick={applyCustomPrice} className="btn btn-primary btn-small">{t.search.apply || 'Apply'}</button>
                        </div>
                    </div>
                </div>
            )}

            {recommendations && recommendations.length > 0 ? (
                <div className="products-grid">
                    {recommendations.map((rec) => {
                        const productForCard: ProductResponseDto = {
                            id: rec.productId,
                            name: rec.productNameTranslations?.[language] || rec.productName,
                            description: rec.productDescriptionTranslations?.[language] || rec.productDescription || '',
                            price: rec.price,
                            stockQuantity: rec.stockQuantity || 0,
                            categoryId: 0,
                            categoryName: '',
                            createdAt: '',
                            updatedAt: '',
                            images: rec.images || [],
                            nameTranslations: rec.productNameTranslations,
                            descriptionTranslations: rec.productDescriptionTranslations,
                        };

                        return (
                            <ProductCard
                                key={rec.productId}
                                product={productForCard}
                                extraInfo={
                                    <span>
                                        {t.product.boughtTogether || 'Bought together'}: {rec.timesBoughtTogether}x
                                    </span>
                                }
                            />
                        );
                    })}
                </div>
            ) : (
                <p className="no-results">{t.admin.noItems}</p>
            )}
        </div>
    );
};