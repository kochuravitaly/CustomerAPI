import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flashSaleService, FlashSaleResponseDto } from '../../services/coupon.service';
import { productService, categoryService } from '../../services/product.service';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

export const AdminFlashSale: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t, language } = useLanguage();
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('startsAt');
    const [sortDirection, setSortDirection] = useState('asc');
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('adminFlashSaleSearchHistory');
        if (saved) setSearchHistory(JSON.parse(saved));
    }, []);

    const { data: flashSales, isLoading, error: flashSalesError } = useQuery({
        queryKey: ['flash-sales'],
        queryFn: async () => (await flashSaleService.getAll()).data,
    });

    const { data: products } = useQuery({
        queryKey: ['products-list', language],
        queryFn: async () => {
            const response = await productService.getAll({ page: 1, pageSize: 100 });
            return response.data.items;
        },
    });

    const { data: categories } = useQuery({
        queryKey: ['categories', language],
        queryFn: async () => (await categoryService.getAll()).data,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => flashSaleService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
            setDeleteConfirm(null);
            setDeletingId(null);
        },
        onError: (err: any) => {
            setError(err.response?.data || t.common.error);
            setDeleteConfirm(null);
            setDeletingId(null);
            setShowErrorModal(true);
        },
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchInput.trim()) return;
        setSearchTerm(searchInput);
        setShowSearch(false);
        const updated = [searchInput, ...searchHistory.filter(h => h !== searchInput)].slice(0, 10);
        setSearchHistory(updated);
        localStorage.setItem('adminFlashSaleSearchHistory', JSON.stringify(updated));
    };

    const handleHistoryClick = (term: string) => {
        setSearchInput(term);
        setSearchTerm(term);
        setShowSearch(false);
    };

    const clearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('adminFlashSaleSearchHistory');
    };

    const getProductNames = (productIdsJson: string) => {
        try {
            const ids = JSON.parse(productIdsJson) as number[];
            if (ids.length === 0) return t.admin.allProducts;
            return ids.map(id => {
                const product = products?.find(p => p.id === id);
                return product?.nameTranslations?.[language] || product?.name || `#${id}`;
            }).join(', ');
        } catch { return t.admin.allProducts; }
    };

    const getCategoryNames = (categoryIdsJson: string) => {
        try {
            const ids = JSON.parse(categoryIdsJson) as number[];
            if (ids.length === 0) return t.admin.allCategories;
            return ids.map(id => {
                const category = categories?.find(c => c.id === id);
                return category?.nameTranslations?.[language] || category?.name || `#${id}`;
            }).join(', ');
        } catch { return t.admin.allCategories; }
    };

    if (isLoading) return <LoadingSpinner />;

    if (flashSalesError) {
        return <div className="error-text">Failed to load flash sales</div>;
    }

    let filteredFlashSales = flashSales?.filter(fs => {
        const productNames = getProductNames(fs.productIdsJson || '[]');
        return productNames.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (filteredFlashSales) {
        filteredFlashSales = [...filteredFlashSales].sort((a, b) => {
            if (sortBy === 'startsAt') {
                return sortDirection === 'asc' ? new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime() : new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
            }
            if (sortBy === 'endsAt') {
                return sortDirection === 'asc' ? new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime() : new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime();
            }
            if (sortBy === 'discountPercentage') {
                return sortDirection === 'asc' ? a.discountPercentage - b.discountPercentage : b.discountPercentage - a.discountPercentage;
            }
            return 0;
        });
    }

    return (
        <div className="admin-flash-sale">
            <button onClick={() => navigate('/admin')} className="btn btn-outline back-btn">← {t.admin.back}</button>

            <div className="admin-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '15px', margin: 0, lineHeight: '1' }}>{t.admin.manageFlashSales}</h2>
                <Link to="/admin/flash-sale/new" className="btn btn-primary btn-small">+ {t.admin.addFlashSale}</Link>
            </div>

            <form onSubmit={handleSearch} className="admin-search-bar-full">
                <input
                    type="text"
                    placeholder={t.admin.search}
                    value={searchInput}
                    onChange={(e) => { setSearchInput(e.target.value); setShowSearch(true); }}
                    onFocus={() => setShowSearch(true)}
                    className="search-input"
                />
                <button type="submit" className="search-submit-btn">🔍</button>
            </form>

            {showSearch && searchHistory.length > 0 && (
                <div className="search-history-dropdown">
                    <div className="search-history-header">
                        <span>{t.admin.searchHistory}</span>
                        <button onClick={clearHistory} className="btn-link">{t.admin.clear}</button>
                    </div>
                    {searchHistory.map((term, index) => (
                        <button key={index} onClick={() => handleHistoryClick(term)} className="search-history-item">
                            🕐 {term}
                        </button>
                    ))}
                </div>
            )}

            <div className="admin-filter-row">
                <div className="filter-group">
                    <label>{t.admin.filterBy}</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                        <option value="startsAt">{t.admin.startsAt}</option>
                        <option value="endsAt">{t.admin.endsAt}</option>
                        <option value="discountPercentage">{t.admin.discountPercentage}</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>{t.admin.sort}</label>
                    <select value={sortDirection} onChange={(e) => setSortDirection(e.target.value)} className="sort-select">
                        <option value="asc">{t.admin.ascending}</option>
                        <option value="desc">{t.admin.descending}</option>
                    </select>
                </div>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>{t.admin.discountPercentage}</th>
                            <th>{t.admin.startsAt}</th>
                            <th>{t.admin.endsAt}</th>
                            <th>{t.admin.products}</th>
                            <th>{t.admin.categories}</th>
                            <th>{t.admin.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFlashSales?.map((fs: FlashSaleResponseDto) => (
                            <tr key={fs.id} style={{ opacity: deletingId === fs.id ? 0.5 : 1 }}>
                                <td>{fs.id}</td>
                                <td>-{fs.discountPercentage}%</td>
                                <td>{new Date(fs.startsAt).toLocaleString()}</td>
                                <td>{new Date(fs.endsAt).toLocaleString()}</td>
                                <td style={{ fontSize: '12px' }}>{getProductNames(fs.productIdsJson || '[]')}</td>
                                <td style={{ fontSize: '12px' }}>{getCategoryNames(fs.categoryIdsJson || '[]')}</td>
                                <td>
                                    <div className="action-buttons">
                                        <Link to={`/admin/flash-sale/${fs.id}/edit`} className="btn btn-small btn-outline">{t.admin.edit}</Link>
                                        <button
                                            onClick={() => setDeleteConfirm(fs.id)}
                                            className="btn btn-small btn-danger"
                                            disabled={deletingId === fs.id}
                                        >
                                            {t.admin.delete}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredFlashSales?.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>{t.admin.noFlashSales}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{t.admin.delete}</h3>
                        <p>{t.admin.confirmDelete}</p>
                        <div className="modal-actions">
                            <button
                                onClick={() => {
                                    setDeletingId(deleteConfirm);
                                    deleteMutation.mutate(deleteConfirm);
                                }}
                                className="btn btn-danger"
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? '...' : t.admin.delete}
                            </button>
                            <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline">{t.admin.cancel}</button>
                        </div>
                    </div>
                </div>
            )}

            {showErrorModal && (
                <div className="modal-overlay" onClick={() => setShowErrorModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{t.admin.error}</h3>
                        <p>{error}</p>
                        <div className="modal-actions">
                            <button onClick={() => setShowErrorModal(false)} className="btn btn-primary">{t.admin.ok}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};