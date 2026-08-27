import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flashSaleService, FlashSaleResponseDto } from '../../services/coupon.service';
import { productService, categoryService } from '../../services/product.service';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AdminFlashSale: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('startsAt');
    const [sortDirection, setSortDirection] = useState('asc');
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('adminFlashSaleSearchHistory');
        if (saved) setSearchHistory(JSON.parse(saved));
    }, []);

    const { data: flashSales, isLoading } = useQuery({
        queryKey: ['flash-sales'],
        queryFn: async () => (await flashSaleService.getAll()).data,
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
        mutationFn: (id: number) => flashSaleService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
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
            if (ids.length === 0) return 'All Products';
            return ids.map(id => products?.find(p => p.id === id)?.name || `#${id}`).join(', ');
        } catch { return 'All Products'; }
    };

    const getCategoryNames = (categoryIdsJson: string) => {
        try {
            const ids = JSON.parse(categoryIdsJson) as number[];
            if (ids.length === 0) return 'All Categories';
            return ids.map(id => categories?.find(c => c.id === id)?.name || `#${id}`).join(', ');
        } catch { return 'All Categories'; }
    };

    if (isLoading) return <LoadingSpinner />;

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
            <button onClick={() => navigate('/admin')} className="btn btn-outline back-btn">← Back</button>

            <div className="admin-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '15px', margin: 0, lineHeight: '1' }}>Manage Flash Sales</h2>
                <Link to="/admin/flash-sale/new" className="btn btn-primary btn-small">+ Add Flash Sale</Link>
            </div>

            <form onSubmit={handleSearch} className="admin-search-bar-full">
                <input
                    type="text"
                    placeholder="Search flash sales..."
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
                        <option value="startsAt">Starts At</option>
                        <option value="endsAt">Ends At</option>
                        <option value="discountPercentage">Discount</option>
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
                            <th>ID</th>
                            <th>Discount</th>
                            <th>Starts</th>
                            <th>Ends</th>
                            <th>Products</th>
                            <th>Categories</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFlashSales?.map((fs: FlashSaleResponseDto) => (
                            <tr key={fs.id}>
                                <td>{fs.id}</td>
                                <td>-{fs.discountPercentage}%</td>
                                <td>{new Date(fs.startsAt).toLocaleString()}</td>
                                <td>{new Date(fs.endsAt).toLocaleString()}</td>
                                <td style={{ fontSize: '12px' }}>{getProductNames(fs.productIdsJson || '[]')}</td>
                                <td style={{ fontSize: '12px' }}>{getCategoryNames(fs.categoryIdsJson || '[]')}</td>
                                <td>
                                    <div className="action-buttons">
                                        <Link to={`/admin/flash-sale/${fs.id}/edit`} className="btn btn-small btn-outline">Edit</Link>
                                        <button onClick={() => setDeleteConfirm(fs.id)} className="btn btn-small btn-danger">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredFlashSales?.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>No flash sales found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete Flash Sale</h3>
                        <p>Are you sure?</p>
                        <div className="modal-actions">
                            <button onClick={() => deleteMutation.mutate(deleteConfirm)} className="btn btn-danger">Delete</button>
                            <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {showErrorModal && (
                <div className="modal-overlay" onClick={() => setShowErrorModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Error</h3>
                        <p>{error}</p>
                        <div className="modal-actions">
                            <button onClick={() => setShowErrorModal(false)} className="btn btn-primary">OK</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};