import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../../services/product.service';
import { CategoryResponseDto } from '../../types/product';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

export const AdminCategories: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t, language } = useLanguage();
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('adminCategorySearchHistory');
        if (saved) setSearchHistory(JSON.parse(saved));
    }, []);

    const { data: categories, isLoading, error: categoriesError } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await categoryService.getAll()).data,
    });

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        setDeletingId(deleteConfirm);
        try {
            await categoryService.delete(deleteConfirm);
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setDeleteConfirm(null);
            setDeletingId(null);
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || err?.response?.data || 'Cannot delete this category because it has products. Remove products first.';
            setError(typeof errorMessage === 'string' ? errorMessage : 'Cannot delete this category because it has products. Remove products first.');
            setDeleteConfirm(null);
            setDeletingId(null);
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

    if (categoriesError) {
        return <div className="error-text">Failed to load categories</div>;
    }

    const getCategoryName = (category: CategoryResponseDto) => {
        return category.nameTranslations?.[language] || category.name;
    };

    const getCategoryDescription = (category: CategoryResponseDto) => {
        return category.descriptionTranslations?.[language] || category.description || '—';
    };

    let filteredCategories = categories?.filter(c => {
        const name = getCategoryName(c);
        const description = getCategoryDescription(c);
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            description.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (filteredCategories) {
        filteredCategories = [...filteredCategories].sort((a, b) => {
            if (sortBy === 'name') {
                return sortDirection === 'asc'
                    ? getCategoryName(a).localeCompare(getCategoryName(b))
                    : getCategoryName(b).localeCompare(getCategoryName(a));
            }
            if (sortBy === 'description') {
                const descA = getCategoryDescription(a);
                const descB = getCategoryDescription(b);
                return sortDirection === 'asc'
                    ? descA.localeCompare(descB)
                    : descB.localeCompare(descA);
            }
            return 0;
        });
    }

    return (
        <div className="admin-categories">
            <button onClick={() => navigate('/admin')} className="btn btn-outline back-btn">← {t.admin.back}</button>

            <div className="admin-header">
                <h2>{t.admin.manageCategories}</h2>
                <Link to="/admin/categories/new" className="btn btn-primary">+ {t.admin.addCategory}</Link>
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
                        <option value="description">{t.admin.description}</option>
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
                            <th>{t.admin.name}</th>
                            <th>{t.admin.description}</th>
                            <th>{t.admin.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCategories?.map((category: CategoryResponseDto) => (
                            <tr key={category.id} style={{ opacity: deletingId === category.id ? 0.5 : 1 }}>
                                <td>{category.id}</td>
                                <td>
                                    <Link to={`/categories?categoryId=${category.id}`} className="product-row-link">
                                        {getCategoryName(category)}
                                    </Link>
                                </td>
                                <td>{getCategoryDescription(category)}</td>
                                <td>
                                    <div className="action-buttons">
                                        <Link to={`/admin/categories/${category.id}/edit`} className="btn btn-small btn-outline">{t.admin.edit}</Link>
                                        <button
                                            onClick={() => setDeleteConfirm(category.id)}
                                            className="btn btn-small btn-danger"
                                            disabled={deletingId === category.id}
                                        >
                                            {t.admin.delete}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredCategories?.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>{t.admin.noItems}</td>
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
                            <button onClick={handleDelete} className="btn btn-danger" disabled={deletingId !== null}>
                                {deletingId !== null ? '...' : t.admin.delete}
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