import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponService, CouponResponseDto, formatExpiryDate } from '../../services/coupon.service';
import { productService, categoryService } from '../../services/product.service';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

export const AdminCoupons: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t } = useLanguage();
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('code');
    const [sortDirection, setSortDirection] = useState('asc');
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('adminCouponSearchHistory');
        if (saved) setSearchHistory(JSON.parse(saved));
    }, []);

    const { data: coupons, isLoading } = useQuery({
        queryKey: ['coupons'],
        queryFn: async () => (await couponService.getCoupons()).data,
    });

    const { data: products } = useQuery({
        queryKey: ['products-list'],
        queryFn: async () => {
            const response = await productService.getAll({ page: 1, pageSize: 100 });
            return response.data.items;
        },
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await categoryService.getAll()).data,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => couponService.deleteCoupon(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
            setDeleteConfirm(null);
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Failed to delete');
            setDeleteConfirm(null);
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
        localStorage.setItem('adminCouponSearchHistory', JSON.stringify(updated));
    };

    const handleHistoryClick = (term: string) => {
        setSearchInput(term);
        setSearchTerm(term);
        setShowSearch(false);
    };

    const clearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('adminCouponSearchHistory');
    };

    if (isLoading) return <LoadingSpinner />;

    let filteredCoupons = coupons?.filter(c =>
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredCoupons) {
        filteredCoupons = [...filteredCoupons].sort((a, b) => {
            const aVal = a[sortBy as keyof CouponResponseDto];
            const bVal = b[sortBy as keyof CouponResponseDto];

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }

            const aStr = String(aVal || '');
            const bStr = String(bVal || '');
            return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
        });
    }

    const getProductNames = (productIdsJson: string) => {
        try {
            const ids = JSON.parse(productIdsJson) as number[];
            if (ids.length === 0) return t.admin.allProducts;
            return ids.map(id => products?.find(p => p.id === id)?.name || `#${id}`).join(', ');
        } catch { return t.admin.allProducts; }
    };

    const getCategoryNames = (categoryIdsJson: string) => {
        try {
            const ids = JSON.parse(categoryIdsJson) as number[];
            if (ids.length === 0) return t.admin.allCategories;
            return ids.map(id => categories?.find(c => c.id === id)?.name || `#${id}`).join(', ');
        } catch { return t.admin.allCategories; }
    };

    return (
        <div className="admin-coupons">
            <button onClick={() => navigate('/admin')} className="btn btn-outline back-btn">← {t.admin.back}</button>

            <div className="admin-header" style={{ marginBottom: '16px' }}>
                <h2>{t.admin.manageCoupons}</h2>
                <Link to="/admin/coupons/new" className="btn btn-primary">+ {t.admin.addCoupon}</Link>
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
                        <option value="code">{t.admin.code}</option>
                        <option value="discountValue">{t.admin.discountValue}</option>
                        <option value="timesUsed">{t.admin.used}</option>
                        <option value="expiryDate">{t.admin.expiry}</option>
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
                            <th>{t.admin.code}</th>
                            <th>{t.admin.discountValue}</th>
                            <th>{t.admin.expiry}</th>
                            <th>{t.admin.products}</th>
                            <th>{t.admin.categories}</th>
                            <th>{t.admin.used}</th>
                            <th>{t.admin.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCoupons?.map((coupon: CouponResponseDto) => (
                            <tr key={coupon.id}>
                                <td>{coupon.id}</td>
                                <td>
                                    <Link to={`/admin/coupons/${coupon.id}/edit`} className="product-row-link">
                                        {coupon.code}
                                    </Link>
                                </td>
                                <td>
                                    {coupon.discountType === 0 ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                                </td>
                                <td>{formatExpiryDate(coupon.expiryDate)}</td>
                                <td style={{ fontSize: '12px' }}>{getProductNames(coupon.productIdsJson || '[]')}</td>
                                <td style={{ fontSize: '12px' }}>{getCategoryNames(coupon.categoryIdsJson || '[]')}</td>
                                <td>{coupon.timesUsed}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}</td>
                                <td>
                                    <div className="action-buttons">
                                        <Link to={`/admin/coupons/${coupon.id}/edit`} className="btn btn-small btn-outline">{t.admin.edit}</Link>
                                        <button onClick={() => setDeleteConfirm(coupon.id)} className="btn btn-small btn-danger">{t.admin.delete}</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredCoupons?.length === 0 && (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>{t.admin.noCoupons}</td>
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
                            <button onClick={() => deleteMutation.mutate(deleteConfirm)} className="btn btn-danger">{t.admin.delete}</button>
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