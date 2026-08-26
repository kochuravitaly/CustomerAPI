import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../../services/product.service';
import { ProductResponseDto } from '../../types/product';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Pagination } from '../../components/Pagination';

export const AdminProducts: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
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

    return (
        <div className="admin-products">
            <button onClick={() => navigate('/admin')} className="btn btn-outline back-btn">← Back</button>
            <h2>Manage Products</h2>

            <form onSubmit={handleSearch} className="admin-search-bar-full">
                <input
                    type="text"
                    placeholder="Search products..."
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
                        <span>History</span>
                        <button onClick={clearHistory} className="btn-link">Clear</button>
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
                    <label>Filter by:</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
                        <option value="name">Name</option>
                        <option value="price">Price</option>
                        <option value="stockQuantity">Stock</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>Sort:</label>
                    <select value={sortDirection} onChange={(e) => setSortDirection(e.target.value)} className="sort-select">
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </div>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productsData?.items.map((product: ProductResponseDto) => {
                            const mainImage = product.images.find(img => img.isMain) || product.images[0];
                            return (
                                <tr key={product.id}>
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
                                            {product.name}
                                        </Link>
                                    </td>
                                    <td>{product.categoryName}</td>
                                    <td>${product.price.toFixed(2)}</td>
                                    <td>{product.stockQuantity}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <Link to={`/admin/products/${product.id}/edit`} className="btn btn-small btn-outline">Edit</Link>
                                            <button onClick={() => setDeleteConfirm(product.id)} className="btn btn-small btn-danger">Delete</button>
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
                        <h3>Confirm Delete</h3>
                        <p>Are you sure?</p>
                        <div className="modal-actions">
                            <button onClick={() => deleteMutation.mutate(deleteConfirm)} className="btn btn-danger">Delete</button>
                            <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};