import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { ProductQueryDto } from '../types/product';
import { ProductCard } from '../components/ProductCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Pagination } from '../components/Pagination';
import { SearchSuggestions } from '../components/SearchSuggestions';
import { useLanguage } from '../context/LanguageContext';

export const Search: React.FC = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();

    const [searchInput, setSearchInput] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const [showHistory, setShowHistory] = useState(true);
    const [activePanel, setActivePanel] = useState<'filters' | 'sort' | null>(null);
    const [priceError, setPriceError] = useState('');
    const [focusTrigger, setFocusTrigger] = useState(0);
    const [suggestionsEnabled, setSuggestionsEnabled] = useState(false);

    const [query, setQuery] = useState<ProductQueryDto>({
        search: '',
        page: 1,
        pageSize: 20,
        sortBy: 'createdAt',
        sortDirection: 'desc',
    });

    const [priceRange, setPriceRange] = useState({ min: '', max: '' });

    useEffect(() => {
        const saved = localStorage.getItem('searchHistory');
        if (saved) {
            setHistory(JSON.parse(saved));
        }
    }, []);

    const { data: productsData, isLoading, error: productsError } = useQuery({
        queryKey: ['search', query],
        queryFn: async () => {
            const response = await productService.getAll(query);
            return response.data;
        },
        enabled: hasSearched,
    });

    const performSearch = (term: string) => {
        const updatedHistory = [term, ...history.filter(h => h !== term)].slice(0, 10);
        setHistory(updatedHistory);
        localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));

        setQuery({ ...query, search: term, page: 1 });
        setHasSearched(true);
        setShowHistory(false);
        setSuggestionsEnabled(false);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchInput.trim()) return;
        performSearch(searchInput);
    };

    const handleSuggestionClick = (name: string) => {
        setSearchInput(name);
        performSearch(name);
    };

    const handleHistoryClick = (term: string) => {
        setSearchInput(term);
        performSearch(term);
    };

    const handleClearHistory = () => {
        setHistory([]);
        localStorage.removeItem('searchHistory');
    };

    const handlePriceFilter = () => {
        setPriceError('');
        const min = priceRange.min ? Number(priceRange.min) : undefined;
        const max = priceRange.max ? Number(priceRange.max) : undefined;

        if (min !== undefined && max !== undefined && min > max) {
            setPriceError('Minimum price cannot be greater than maximum price');
            return;
        }

        setQuery({
            ...query,
            minPrice: min,
            maxPrice: max,
            page: 1,
        });
        setActivePanel(null);
    };

    const handleSortChange = (sortBy: string) => {
        setQuery({ ...query, sortBy, sortDirection: sortBy === 'price' ? 'asc' : 'desc' });
        setActivePanel(null);
    };

    const handlePageChange = (page: number) => {
        setQuery({ ...query, page });
        window.scrollTo(0, 0);
    };

    return (
        <div className="search-page">
            {!hasSearched ? (
                <>
                    <div className="search-header" style={{ position: 'relative' }}>
                        <button onClick={() => navigate(-1)} className="search-back-btn">←</button>
                        <form onSubmit={handleSearch} className="search-header-form" style={{ position: 'relative', flex: 1 }}>
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setSearchInput(value);
                                    setShowHistory(value.trim().length < 1);
                                    setSuggestionsEnabled(true);
                                }}
                                onFocus={() => {
                                    setFocusTrigger(prev => prev + 1);
                                    setSuggestionsEnabled(true);
                                }}
                                placeholder={t.search.placeholder}
                                className="search-header-input"
                                autoFocus
                            />
                            <SearchSuggestions
                                searchInput={searchInput}
                                onSuggestionClick={handleSuggestionClick}
                                focusTrigger={focusTrigger}
                                enabled={suggestionsEnabled}
                            />
                        </form>
                        <button onClick={handleSearch} className="search-submit-btn">🔍</button>
                    </div>

                    {showHistory && history.length > 0 && searchInput.trim().length === 0 && (
                        <div className="search-history">
                            <div className="search-history-header">
                                <span>History</span>
                                <button onClick={handleClearHistory} className="btn-link">Clear</button>
                            </div>
                            {history.map((term, index) => (
                                <button key={index} onClick={() => handleHistoryClick(term)} className="search-history-item">
                                    <span>🕐</span> {term}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="search-empty">
                        <p className="search-empty-icon">🔍</p>
                        <p>{t.search.placeholder}</p>
                    </div>
                </>
            ) : (
                <>
                    <div className="search-results-header">
                        <button onClick={() => {
                            setHasSearched(false);
                            setSearchInput('');
                            setShowHistory(true);
                            setSuggestionsEnabled(false);
                        }} className="search-back-btn">←</button>
                        <button onClick={() => navigate('/')} className="search-logo-btn">CheyenneShop</button>
                        <div className="search-header-icons">
                            <button onClick={() => navigate('/profile')} className="search-header-icon-link">👤</button>
                            <button onClick={() => navigate('/cart')} className="search-header-icon-link">🛒</button>
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="search-header-form" style={{ position: 'relative' }}>
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => {
                                setSearchInput(e.target.value);
                                setSuggestionsEnabled(true);
                            }}
                            onFocus={() => {
                                setFocusTrigger(prev => prev + 1);
                                setSuggestionsEnabled(true);
                            }}
                            placeholder={t.search.placeholder}
                            className="search-header-input"
                        />
                        <SearchSuggestions
                            searchInput={searchInput}
                            onSuggestionClick={handleSuggestionClick}
                            focusTrigger={focusTrigger}
                            enabled={suggestionsEnabled}
                        />
                        <button type="submit" className="search-submit-btn">🔍</button>
                    </form>

                    {activePanel && (
                        <div className="search-overlay" onClick={() => setActivePanel(null)} />
                    )}

                    <div className="search-controls">
                        <button
                            onClick={() => setActivePanel(activePanel === 'filters' ? null : 'filters')}
                            className="btn btn-outline btn-small"
                        >
                            Filters ▾
                        </button>
                        <button
                            onClick={() => setActivePanel(activePanel === 'sort' ? null : 'sort')}
                            className="btn btn-outline btn-small"
                        >
                            Sort By ▾
                        </button>
                    </div>

                    {activePanel === 'filters' && (
                        <div className="search-panel">
                            <div className="price-inputs">
                                <input
                                    type="number"
                                    placeholder={t.search.min}
                                    value={priceRange.min}
                                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                    className="price-input"
                                />
                                <span>-</span>
                                <input
                                    type="number"
                                    placeholder={t.search.max}
                                    value={priceRange.max}
                                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                    className="price-input"
                                />
                                <button onClick={handlePriceFilter} className="btn btn-primary btn-small">Apply</button>
                            </div>
                            {priceError && <div className="error-text">{priceError}</div>}
                        </div>
                    )}

                    {activePanel === 'sort' && (
                        <div className="search-panel">
                            <button onClick={() => handleSortChange('createdAt')} className="sort-option">{t.search.newest}</button>
                            <button onClick={() => handleSortChange('price')} className="sort-option">{t.search.priceLowHigh}</button>
                            <button onClick={() => handleSortChange('name')} className="sort-option">{t.search.name}</button>
                        </div>
                    )}

                    <p className="search-results-count">{productsData?.totalCount || 0} {t.search.results}</p>

                    {isLoading ? (
                        <LoadingSpinner />
                    ) : productsError ? (
                        <div className="error-text">Failed to load search results</div>
                    ) : (
                        <>
                            <div className="products-grid">
                                {productsData?.items.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                            {productsData && productsData.items.length === 0 && (
                                <p className="no-results">{t.search.noResults}</p>
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
                </>
            )}
        </div>
    );
};