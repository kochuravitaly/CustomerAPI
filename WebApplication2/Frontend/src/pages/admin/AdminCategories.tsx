import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../../services/product.service';
import { CategoryResponseDto } from '../../types/product';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AdminCategories: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('adminCategorySearchHistory');
        if (saved) setSearchHistory(JSON.parse(saved));
    }, []);

    const { data: categories, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await categoryService.getAll()).data,
    });

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await categoryService.delete(deleteConfirm);
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setDeleteConfirm(null);
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.response?.data || 'Cannot delete this category because it has products. Remove products first.';
            setError(typeof errorMessage === 'string' ? errorMessage : 'Cannot delete this category because it has products. Remove products first.');
            setDeleteConfirm(null);
            setShowErrorModal(true);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchInput.trim()) return;
        setSearchTerm(searchInput);
        setShowSearch(false);
        const updated = [searchInput, ...searchHistory.filter(h => h !== searchInput)].slice(0, 10);
        setSearchHistory(updated);
        localStorage.setItem('adminCategorySearchHistory', JSON.stringify(updated));
    };

    const handleHistoryClick = (term: string) => {
        setSearchInput(term);
        setSearchTerm(term);
        setShowSearch(false);
    };

    const clearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('adminCategorySearchHistory');
    };

    if (isLoading) return <LoadingSpinner />;

    let filteredCategories = categories?.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (filteredCategories) {
        filteredCategories = [...filteredCategories].sort((a, b) => {
            if (sortBy === 'name') {
                return sortDirection === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            }
            if (sortBy === 'description') {
                const descA = a.description || '';
                const descB = b.description || '';
                return sortDirection === 'asc'
                    ? descA.localeCompare(descB)
                    : descB.localeCompare(descA);
            }
            return 0;
        });
    }

    return (
        <div className="admin-categories">
            <button onClick={() => navigate('/admin')} className="btn btn-outline back-btn">← Back</button>

            <div className="admin-header">
                <h2>Manage Categories</h2>
                <Link to="/admin/categories/new" className="btn btn-primary">+ Add Category</Link>
            </div>

            <form onSubmit={handleSearch} className="admin-search-bar-full">
                <input
                    type="text"
                    placeholder="Search categories..."
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
                        <option value="description">Description</option>
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
                            <th>Name</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCategories?.map((category: CategoryResponseDto) => (
                            <tr key={category.id}>
                                <td>{category.id}</td>
                                <td>
                                    <Link to={`/categories?categoryId=${category.id}`} className="product-row-link">
                                        {category.name}
                                    </Link>
                                </td>
                                <td>{category.description || '—'}</td>
                                <td>
                                    <div className="action-buttons">
                                        <Link to={`/admin/categories/${category.id}/edit`} className="btn btn-small btn-outline">Edit</Link>
                                        <button onClick={() => setDeleteConfirm(category.id)} className="btn btn-small btn-danger">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredCategories?.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>No categories found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete Category</h3>
                        <p>Are you sure you want to delete this category?</p>
                        <div className="modal-actions">
                            <button onClick={handleDelete} className="btn btn-danger">Delete</button>
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