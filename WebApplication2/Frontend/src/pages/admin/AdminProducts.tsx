import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService, categoryService } from '../../services/product.service';
import { ProductResponseDto } from '../../types/product';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Pagination } from '../../components/Pagination';
import { useLanguage } from '../../context/LanguageContext';

export const AdminProducts: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t, language } = useLanguage();
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('adminSearchHistory');
        if (saved) setSearchHistory(JSON.parse(saved));
    }, []);

    const { data: productsData, isLoading } = useQuery({
        queryKey: ['admin-products', page, searchTerm, sortBy, sortDirection],
        queryFn: async () => {
            const response = await productService.getAll({
                page,
                pageSize: 10,
                search: searchTerm || undefined,
                sortBy,
                sortDirection,
            });
            return response.data;
        },
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await categoryService.getAll()).data,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => productService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            setDeleteConfirm(null);
        },
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchInput.trim()) return;
        setSearchTerm(searchInput);
        setPage(1);
        setShowSearch(false);
        const updated = [searchInput, ...searchHistory.filter(h => h !== searchInput)].slice(0, 10);
        setSearchHistory(updated);
        localStorage.setItem('adminSearchHistory', JSON.stringify(updated));
    };

    const handleHistoryClick = (term: string) => {
        setSearchInput(term);
        setSearchTerm(term);
        setPage(1);
        setShowSearch(false);
    };

    const clearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('adminSearchHistory');
    };

    if (isLoading) return <LoadingSpinner />;

    const getTranslatedCategoryName = (product: ProductResponseDto) => {
        const category = categories?.find(c => c.id === product.categoryId);
        return category?.nameTranslations?.[language] || product.categoryName;
    };

    return (
        <div className="admin-products">
            <button onClick={() => navigate('/admin')} className="btn btn-outline back-btn">← {t.admin.back}</button>

            <div className="admin-header">
                <h2>{t.admin.manageProducts}</h2>
                <Link to="/admin/products/new" className="btn btn-primary">+ {t.admin.addProduct}</Link>
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
                        <option value="name">{t.admin.name}</option>
                        <option value="price">{t.admin.price}</option>
                        <option value="stockQuantity">{t.admin.stock}</option>
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
                            <th>{t.admin.image}</th>
                            <th>{t.admin.name}</th>
                            <th>{t.admin.category}</th>
                            <th>{t.admin.price}</th>
                            <th>{t.admin.stock}</th>
                            <th>{t.admin.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productsData?.items.map((product: ProductResponseDto) => {
                            const mainImage = product.images.find(img => img.isMain) || product.images[0];
                            return (
                                <tr key={product.id}>
                                    <td>{product.id}</td>
                                    <td>
                                        <Link to={`/products/${product.id}`} className="product-row-link">
                                            {mainImage ? (
                                                <img
                                                    src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${product.id}/images/${mainImage.id}`}
                                                    alt={product.name}
                                                    className="admin-product-thumbnail"
                                                />
                                            ) : (
                                                <div className="admin-thumbnail-placeholder">🛍️</div>
                                            )}
                                        </Link>
                                    </td>
                                    <td>
                                        <Link to={`/products/${product.id}`} className="product-row-link">
                                            {product.nameTranslations?.[language] || product.name}
                                        </Link>
                                    </td>
                                    <td>{getTranslatedCategoryName(product)}</td>
                                    <td>${product.price.toFixed(2)}</td>
                                    <td>{product.stockQuantity}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <Link to={`/admin/products/${product.id}/edit`} className="btn btn-small btn-outline">{t.admin.edit}</Link>
                                            <button onClick={() => setDeleteConfirm(product.id)} className="btn btn-small btn-danger">{t.admin.delete}</button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="admin-pagination">
                {productsData && (
                    <Pagination
                        currentPage={productsData.page}
                        totalPages={productsData.totalPages}
                        onPageChange={setPage}
                    />
                )}
            </div>

            {deleteConfirm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>{t.admin.confirmDelete}</h3>
                        <p>{t.admin.confirmDelete}</p>
                        <div className="modal-actions">
                            <button onClick={() => deleteMutation.mutate(deleteConfirm)} className="btn btn-danger">{t.admin.delete}</button>
                            <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline">{t.admin.cancel}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};