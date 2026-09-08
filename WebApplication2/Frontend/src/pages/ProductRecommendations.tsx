import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const ProductRecommendations: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const { currency, formatPrice, rates } = useCurrency();

    const [sortBy, setSortBy] = useState<'timesBought' | 'price-asc' | 'price-desc'>('timesBought');
    const [showSortSheet, setShowSortSheet] = useState(false);
    const [priceRange, setPriceRange] = useState<string>('all');
    const [showPriceSheet, setShowPriceSheet] = useState(false);
    const [customMinPrice, setCustomMinPrice] = useState('');
    const [customMaxPrice, setCustomMaxPrice] = useState('');

    const [query, setQuery] = useState<{ sortBy?: string; sortDirection?: string; minPrice?: number; maxPrice?: number }>({
        sortBy: 'timesBought',
        sortDirection: 'desc',
    });

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
                    { label: t.product.under25 || 'До 2,000₽', value: '0-2000', min: 0, max: 2000 },
                    { label: t.product.price25to50 || '2,000₽ - 5,000₽', value: '2000-5000', min: 2000, max: 5000 },
                    { label: t.product.price50to100 || '5,000₽ - 10,000₽', value: '5000-10000', min: 5000, max: 10000 },
                    { label: t.product.price100plus || '10,000₽+', value: '10000-999999', min: 10000, max: null },
                ];
            case 'EUR':
                return [
                    { label: t.product.allPrices || 'Alle Preise', value: 'all', min: null, max: null },
                    { label: t.product.under25 || 'Unter €20', value: '0-1800', min: 0, max: 1800 },
                    { label: t.product.price25to50 || '€20 - €50', value: '1800-4500', min: 1800, max: 4500 },
                    { label: t.product.price50to100 || '€50 - €100', value: '4500-9000', min: 4500, max: 9000 },
                    { label: t.product.price100plus || '€100+', value: '9000-999999', min: 9000, max: null },
                ];
            case 'GBP':
                return [
                    { label: t.product.allPrices || 'All Prices', value: 'all', min: null, max: null },
                    { label: t.product.under25 || 'Under £20', value: '0-2100', min: 0, max: 2100 },
                    { label: t.product.price25to50 || '£20 - £50', value: '2100-5300', min: 2100, max: 5300 },
                    { label: t.product.price50to100 || '£50 - £100', value: '5300-10500', min: 5300, max: 10500 },
                    { label: t.product.price100plus || '£100+', value: '10500-999999', min: 10500, max: null },
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

            <div className="reviews-filters">
                <button className="btn btn-outline btn-small" onClick={() => { setShowSortSheet(true); setShowPriceSheet(false); }}>
                    {getSortLabel()} ▾
                </button>
                <button className="btn btn-outline btn-small" onClick={() => { setShowPriceSheet(true); setShowSortSheet(false); }}>
                    {getPriceLabel()} ▾
                </button>
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
        </div>
    );
};