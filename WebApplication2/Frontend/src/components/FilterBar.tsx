import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { filterService } from '../services/filter.service';
import { FilterState } from '../types/filter';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

interface FilterBarProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
}

type SheetType = 'sort' | 'price' | 'color' | 'size' | 'rating' | 'material' | 'style' | null;

const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFiltersChange }) => {
    const { t, language } = useLanguage();
    const { currency, rates } = useCurrency();
    const [activeSheet, setActiveSheet] = useState<SheetType>(null);
    const [customMinPrice, setCustomMinPrice] = useState('');
    const [customMaxPrice, setCustomMaxPrice] = useState('');
    const [tempFilters, setTempFilters] = useState<FilterState>(filters);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const { data: filterOptions } = useQuery({
        queryKey: ['filter-options'],
        queryFn: async () => (await filterService.getOptions()).data,
    });

    useEffect(() => {
        if (activeSheet) {
            document.body.style.overflow = 'hidden';
            setTempFilters(filters);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [activeSheet]);

    const openSheet = (sheet: SheetType) => setActiveSheet(sheet);
    const closeSheet = () => setActiveSheet(null);

    const applyTempFilters = () => {
        onFiltersChange(tempFilters);
        closeSheet();
    };

    const toggleTempArray = (key: keyof FilterState, value: any) => {
        const current = (tempFilters[key] as any[]) || [];
        const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
        setTempFilters({ ...tempFilters, [key]: updated } as FilterState);
    };

    const resetFilter = (key: keyof FilterState) => {
        const newFilters = { ...filters };
        if (key === 'minPrice') {
            delete newFilters.minPrice;
            delete newFilters.maxPrice;
        } else if (key === 'sortBy') {
            newFilters.sortBy = 'createdAt';
            newFilters.sortDirection = 'desc';
        } else {
            delete newFilters[key];
        }
        onFiltersChange(newFilters);
    };

    const clearAll = () => {
        onFiltersChange({
            sortBy: 'createdAt',
            sortDirection: 'desc',
            minPrice: undefined,
            maxPrice: undefined,
            colorIds: undefined,
            sizes: undefined,
            genders: undefined,
            materialIds: undefined,
            styleIds: undefined,
            minRating: undefined,
        });
        setShowClearConfirm(false);
    };

    const applySort = (sortBy: string, sortDirection: 'asc' | 'desc') => {
        onFiltersChange({ ...filters, sortBy, sortDirection });
        closeSheet();
    };

    const sortedSizes = (filterOptions?.sizes || []).sort((a, b) => {
        const indexA = sizeOrder.indexOf(a.name.toUpperCase());
        const indexB = sizeOrder.indexOf(b.name.toUpperCase());
        if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    const uniqueColors = filterOptions?.colors.filter((color, index, self) =>
        index === self.findIndex(c => c.name.toLowerCase() === color.name.toLowerCase())
    ) || [];

    const isSortActive = filters.sortBy !== 'createdAt' || filters.sortDirection !== 'desc';
    const isPriceAllSelected = filters.minPrice === undefined && filters.maxPrice === undefined;

    const hasActiveFilters = () => {
        return (filters.colorIds && filters.colorIds.length > 0) ||
            (filters.sizes && filters.sizes.length > 0) ||
            (filters.materialIds && filters.materialIds.length > 0) ||
            (filters.styleIds && filters.styleIds.length > 0) ||
            filters.minRating !== undefined ||
            filters.minPrice !== undefined ||
            filters.maxPrice !== undefined ||
            isSortActive;
    };

    const getPricePresets = () => {
        const symbol = currency === 'RUB' ? '₽' : currency === 'EUR' ? '€' : '£';
        const rate = rates[currency] || 1;
        const formatDisplay = (rubAmount: number) => Math.round(rubAmount / rate);

        return [
            { label: t.product.allPrices || 'All Prices', value: 'all', min: null, max: null },
            { label: `${t.product.under || 'Under'} ${symbol}${formatDisplay(2000)}`, value: '0-2000', min: 0, max: 2000 },
            { label: `${symbol}${formatDisplay(2000)} - ${symbol}${formatDisplay(5000)}`, value: '2000-5000', min: 2000, max: 5000 },
            { label: `${symbol}${formatDisplay(5000)} - ${symbol}${formatDisplay(10000)}`, value: '5000-10000', min: 5000, max: 10000 },
            { label: `${symbol}${formatDisplay(10000)}+`, value: '10000-999999', min: 10000, max: null },
        ];
    };

    const pricePresets = getPricePresets();

    const getSortLabel = () => {
        switch (`${filters.sortBy}-${filters.sortDirection}`) {
            case 'createdAt-desc': return t.search.newest || 'Newest';
            case 'price-asc': return t.search.priceLowHigh || 'Price: Low to High';
            case 'price-desc': return t.search.priceHighLow || 'Price: High to Low';
            case 'rating-desc': return t.product.topRated || 'Top Rated';
            default: return t.search.sortBy || 'Sort';
        }
    };

    const getPriceLabel = () => {
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            const symbol = currency === 'RUB' ? '₽' : currency === 'EUR' ? '€' : '£';
            const rate = rates[currency] || 1;
            const min = filters.minPrice !== undefined ? `${symbol}${Math.round(filters.minPrice / rate)}` : symbol;
            const max = filters.maxPrice !== undefined ? `${symbol}${Math.round(filters.maxPrice / rate)}` : '∞';
            return `${min} - ${max}`;
        }
        return t.product.price || 'Price';
    };

    const getRatingLabel = () => {
        if (filters.minRating) return `${filters.minRating}★ ${t.product.andUp || '& up'}`;
        return t.product.rating || 'Rating';
    };

    const applyPricePreset = (value: string) => {
        const preset = pricePresets.find(p => p.value === value);
        if (!preset) return;
        setTempFilters({
            ...tempFilters,
            minPrice: preset.min ?? undefined,
            maxPrice: preset.max ?? undefined,
        });
    };

    const applyCustomPrice = () => {
        const newFilters: any = { ...tempFilters };

        if (customMinPrice) {
            newFilters.minPrice = currency === 'RUB'
                ? Number(customMinPrice)
                : Math.round(Number(customMinPrice) / (rates[currency] || 1));
        } else {
            delete newFilters.minPrice;
        }

        if (customMaxPrice) {
            newFilters.maxPrice = currency === 'RUB'
                ? Number(customMaxPrice)
                : Math.round(Number(customMaxPrice) / (rates[currency] || 1));
        } else {
            delete newFilters.maxPrice;
        }

        setTempFilters(newFilters);
    };

    return (
        <>
            <div className="filter-bar-scroll" style={{ overflowX: 'auto', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div style={{ display: 'flex', gap: '8px', padding: '4px 0', alignItems: 'center' }}>
                    {hasActiveFilters() && (
                        <button
                            className="btn btn-outline filter-btn"
                            onClick={() => setShowClearConfirm(true)}
                            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                        >
                            {t.common.clear || 'Clear'}
                        </button>
                    )}

                    {isSortActive && (
                        <button className="btn btn-outline filter-btn filter-btn-active" onClick={() => openSheet('sort')}>
                            {getSortLabel()}
                            <span onClick={(e) => { e.stopPropagation(); resetFilter('sortBy'); }} style={{ marginLeft: '6px', fontWeight: 'bold', cursor: 'pointer' }}>✕</span>
                        </button>
                    )}

                    {!isPriceAllSelected && (
                        <button className="btn btn-outline filter-btn filter-btn-active" onClick={() => openSheet('price')}>
                            {getPriceLabel()}
                            <span onClick={(e) => { e.stopPropagation(); resetFilter('minPrice'); }} style={{ marginLeft: '6px', fontWeight: 'bold', cursor: 'pointer' }}>✕</span>
                        </button>
                    )}

                    {filters.minRating !== undefined && (
                        <button className="btn btn-outline filter-btn filter-btn-active" onClick={() => openSheet('rating')}>
                            {getRatingLabel()}
                            <span onClick={(e) => { e.stopPropagation(); resetFilter('minRating'); }} style={{ marginLeft: '6px', fontWeight: 'bold', cursor: 'pointer' }}>✕</span>
                        </button>
                    )}

                    {filters.colorIds && filters.colorIds.length > 0 && (
                        <button className="btn btn-outline filter-btn filter-btn-active" onClick={() => openSheet('color')}>
                            {t.product.color || 'Color'}
                            <span onClick={(e) => { e.stopPropagation(); resetFilter('colorIds'); }} style={{ marginLeft: '6px', fontWeight: 'bold', cursor: 'pointer' }}>✕</span>
                        </button>
                    )}

                    {filters.sizes && filters.sizes.length > 0 && (
                        <button className="btn btn-outline filter-btn filter-btn-active" onClick={() => openSheet('size')}>
                            {t.product.size || 'Size'}
                            <span onClick={(e) => { e.stopPropagation(); resetFilter('sizes'); }} style={{ marginLeft: '6px', fontWeight: 'bold', cursor: 'pointer' }}>✕</span>
                        </button>
                    )}

                    {filters.materialIds && filters.materialIds.length > 0 && (
                        <button className="btn btn-outline filter-btn filter-btn-active" onClick={() => openSheet('material')}>
                            {t.product.material || 'Material'}
                            <span onClick={(e) => { e.stopPropagation(); resetFilter('materialIds'); }} style={{ marginLeft: '6px', fontWeight: 'bold', cursor: 'pointer' }}>✕</span>
                        </button>
                    )}

                    {filters.styleIds && filters.styleIds.length > 0 && (
                        <button className="btn btn-outline filter-btn filter-btn-active" onClick={() => openSheet('style')}>
                            {t.product.style || 'Style'}
                            <span onClick={(e) => { e.stopPropagation(); resetFilter('styleIds'); }} style={{ marginLeft: '6px', fontWeight: 'bold', cursor: 'pointer' }}>✕</span>
                        </button>
                    )}

                    {!isSortActive && (
                        <button className="btn btn-outline filter-btn" onClick={() => openSheet('sort')}>
                            {getSortLabel()} ▾
                        </button>
                    )}

                    {isPriceAllSelected && (
                        <button className="btn btn-outline filter-btn" onClick={() => openSheet('price')}>
                            {getPriceLabel()} ▾
                        </button>
                    )}

                    {filters.minRating === undefined && (
                        <button className="btn btn-outline filter-btn" onClick={() => openSheet('rating')}>
                            {getRatingLabel()} ▾
                        </button>
                    )}

                    {(!filters.colorIds || filters.colorIds.length === 0) && (
                        <button className="btn btn-outline filter-btn" onClick={() => openSheet('color')}>
                            {t.product.color || 'Color'} ▾
                        </button>
                    )}

                    {(!filters.sizes || filters.sizes.length === 0) && (
                        <button className="btn btn-outline filter-btn" onClick={() => openSheet('size')}>
                            {t.product.size || 'Size'} ▾
                        </button>
                    )}

                    {(!filters.materialIds || filters.materialIds.length === 0) && (
                        <button className="btn btn-outline filter-btn" onClick={() => openSheet('material')}>
                            {t.product.material || 'Material'} ▾
                        </button>
                    )}

                    {(!filters.styleIds || filters.styleIds.length === 0) && (
                        <button className="btn btn-outline filter-btn" onClick={() => openSheet('style')}>
                            {t.product.style || 'Style'} ▾
                        </button>
                    )}
                </div>
            </div>

            {showClearConfirm && (
                <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{t.common.clearFilters || 'Clear all filters?'}</h3>
                        <div className="modal-actions">
                            <button onClick={clearAll} className="btn btn-danger">
                                {t.common.clear || 'Clear'}
                            </button>
                            <button onClick={() => setShowClearConfirm(false)} className="btn btn-outline">
                                {t.admin.cancel || 'Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeSheet && (
                <div className="filter-bottom-sheet-overlay" onClick={closeSheet}>
                    <div className="filter-bottom-sheet" onClick={(e) => e.stopPropagation()}>
                        <div className="filter-bottom-sheet-header">
                            <h3>
                                {activeSheet === 'sort' && (t.search.sortBy || 'Sort By')}
                                {activeSheet === 'price' && (t.product.price || 'Price')}
                                {activeSheet === 'rating' && (t.product.rating || 'Rating')}
                                {activeSheet === 'color' && (t.product.color || 'Color')}
                                {activeSheet === 'size' && (t.product.size || 'Size')}
                                {activeSheet === 'material' && (t.product.material || 'Material')}
                                {activeSheet === 'style' && (t.product.style || 'Style')}
                            </h3>
                            <button className="filter-bottom-sheet-close" onClick={closeSheet}>✕</button>
                        </div>

                        {activeSheet === 'sort' && (
                            <>
                                <button className={`filter-bottom-sheet-option ${filters.sortBy === 'createdAt' && filters.sortDirection === 'desc' ? 'active' : ''}`} onClick={() => applySort('createdAt', 'desc')}>
                                    {t.search.newest || 'Newest'}
                                </button>
                                <button className={`filter-bottom-sheet-option ${filters.sortBy === 'price' && filters.sortDirection === 'asc' ? 'active' : ''}`} onClick={() => applySort('price', 'asc')}>
                                    {t.search.priceLowHigh || 'Price: Low to High'}
                                </button>
                                <button className={`filter-bottom-sheet-option ${filters.sortBy === 'price' && filters.sortDirection === 'desc' ? 'active' : ''}`} onClick={() => applySort('price', 'desc')}>
                                    {t.search.priceHighLow || 'Price: High to Low'}
                                </button>
                                <button className={`filter-bottom-sheet-option ${filters.sortBy === 'rating' ? 'active' : ''}`} onClick={() => applySort('rating', 'desc')}>
                                    {t.product.topRated || 'Top Rated'}
                                </button>
                            </>
                        )}

                        {activeSheet === 'price' && (
                            <>
                                <button
                                    className={`filter-bottom-sheet-option ${tempFilters.minPrice === undefined && tempFilters.maxPrice === undefined ? 'active' : ''}`}
                                    onClick={() => setTempFilters({ ...tempFilters, minPrice: undefined, maxPrice: undefined })}
                                >
                                    {t.product.allPrices || 'All Prices'}
                                </button>
                                {pricePresets.slice(1).map((preset) => (
                                    <button
                                        key={preset.value}
                                        className={`filter-bottom-sheet-option ${tempFilters.minPrice === preset.min && tempFilters.maxPrice === preset.max ? 'active' : ''}`}
                                        onClick={() => applyPricePreset(preset.value)}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                                <div className="filter-price-inputs">
                                    <input
                                        type="number"
                                        placeholder={t.search.min || 'Min'}
                                        value={customMinPrice}
                                        onChange={(e) => setCustomMinPrice(e.target.value)}
                                    />
                                    <span>-</span>
                                    <input
                                        type="number"
                                        placeholder={t.search.max || 'Max'}
                                        value={customMaxPrice}
                                        onChange={(e) => setCustomMaxPrice(e.target.value)}
                                    />
                                    <button onClick={applyCustomPrice} className="btn btn-primary btn-small">{t.search.apply || 'Apply'}</button>
                                </div>
                                <button onClick={applyTempFilters} className="btn btn-primary btn-block" style={{ marginTop: '8px' }}>
                                    {t.search.apply || 'Apply'}
                                </button>
                            </>
                        )}

                        {activeSheet === 'rating' && (
                            <>
                                <button className={`filter-bottom-sheet-option ${!tempFilters.minRating ? 'active' : ''}`} onClick={() => setTempFilters({ ...tempFilters, minRating: undefined })}>
                                    {t.product.anyRating || 'Any Rating'}
                                </button>
                                <button className={`filter-bottom-sheet-option ${tempFilters.minRating === 3 ? 'active' : ''}`} onClick={() => setTempFilters({ ...tempFilters, minRating: 3 })}>
                                    3★ {t.product.andUp || '& up'}
                                </button>
                                <button className={`filter-bottom-sheet-option ${tempFilters.minRating === 4 ? 'active' : ''}`} onClick={() => setTempFilters({ ...tempFilters, minRating: 4 })}>
                                    4★ {t.product.andUp || '& up'}
                                </button>
                                <button className={`filter-bottom-sheet-option ${tempFilters.minRating === 4.5 ? 'active' : ''}`} onClick={() => setTempFilters({ ...tempFilters, minRating: 4.5 })}>
                                    4.5★ {t.product.andUp || '& up'}
                                </button>
                                <button onClick={applyTempFilters} className="btn btn-primary btn-block" style={{ marginTop: '8px' }}>
                                    {t.search.apply || 'Apply'}
                                </button>
                            </>
                        )}

                        {activeSheet === 'color' && uniqueColors.length > 0 && (
                            <>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px' }}>
                                    {uniqueColors.map((color) => (
                                        <button
                                            key={color.id}
                                            onClick={() => toggleTempArray('colorIds', color.id)}
                                            className={`filter-word-btn ${(tempFilters.colorIds || []).includes(color.id) ? 'active' : ''}`}
                                        >
                                            {color.nameTranslations?.[language] || color.name}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={applyTempFilters} className="btn btn-primary btn-block" style={{ marginTop: '8px' }}>
                                    {t.search.apply || 'Apply'}
                                </button>
                            </>
                        )}

                        {activeSheet === 'size' && sortedSizes.length > 0 && (
                            <>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px' }}>
                                    {sortedSizes.map((size) => (
                                        <button
                                            key={size.name}
                                            onClick={() => toggleTempArray('sizes', size.name)}
                                            className={`filter-word-btn ${(tempFilters.sizes || []).includes(size.name) ? 'active' : ''}`}
                                        >
                                            {size.name}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={applyTempFilters} className="btn btn-primary btn-block" style={{ marginTop: '8px' }}>
                                    {t.search.apply || 'Apply'}
                                </button>
                            </>
                        )}

                        {activeSheet === 'material' && filterOptions?.materials && filterOptions.materials.length > 0 && (
                            <>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px' }}>
                                    {filterOptions.materials.map((material) => (
                                        <button
                                            key={material.id}
                                            onClick={() => toggleTempArray('materialIds', material.id)}
                                            className={`filter-word-btn ${(tempFilters.materialIds || []).includes(material.id) ? 'active' : ''}`}
                                        >
                                            {material.nameTranslations?.[language] || material.name}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={applyTempFilters} className="btn btn-primary btn-block" style={{ marginTop: '8px' }}>
                                    {t.search.apply || 'Apply'}
                                </button>
                            </>
                        )}

                        {activeSheet === 'style' && filterOptions?.styles && filterOptions.styles.length > 0 && (
                            <>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px' }}>
                                    {filterOptions.styles.map((style) => (
                                        <button
                                            key={style.id}
                                            onClick={() => toggleTempArray('styleIds', style.id)}
                                            className={`filter-word-btn ${(tempFilters.styleIds || []).includes(style.id) ? 'active' : ''}`}
                                        >
                                            {style.nameTranslations?.[language] || style.name}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={applyTempFilters} className="btn btn-primary btn-block" style={{ marginTop: '8px' }}>
                                    {t.search.apply || 'Apply'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};