import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { homeSectionService, HomeSectionResponseDto } from '../../services/homeSection.service';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

export const AdminHomeSections: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t, language } = useLanguage();
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('title');
    const [sortDirection, setSortDirection] = useState('asc');
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('adminHomeSectionSearchHistory');
        if (saved) setSearchHistory(JSON.parse(saved));
    }, []);

    const { data: sections, isLoading, error: sectionsError } = useQuery({
        queryKey: ['home-sections'],
        queryFn: async () => (await homeSectionService.getAll()).data,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => homeSectionService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['home-sections'] });
            setDeleteConfirm(null);
            setDeletingId(null);
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Failed to delete');
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
        localStorage.setItem('adminHomeSectionSearchHistory', JSON.stringify(updated));
    };

    const handleHistoryClick = (term: string) => {
        setSearchInput(term);
        setSearchTerm(term);
        setShowSearch(false);
    };

    const clearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('adminHomeSectionSearchHistory');
    };

    if (isLoading) return <LoadingSpinner />;

    if (sectionsError) {
        return <div className="error-text">Failed to load home sections</div>;
    }

    let filteredSections = sections?.filter(s => {
        const title = s.titleTranslations?.[language] || s.title;
        return title.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (filteredSections) {
        filteredSections = [...filteredSections].sort((a, b) => {
            const titleA = a.titleTranslations?.[language] || a.title;
            const titleB = b.titleTranslations?.[language] || b.title;
            if (sortBy === 'title') {
                return sortDirection === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
            }
            if (sortBy === 'productsToShow') {
                return sortDirection === 'asc' ? a.productsToShow - b.productsToShow : b.productsToShow - a.productsToShow;
            }
            return 0;
        });
    }

    return (
        <div className="admin-home-sections">
            <button onClick={() => navigate('/admin')} className="btn btn-outline back-btn">← {t.admin.back}</button>

            <div className="admin-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '15px', margin: 0, lineHeight: '1' }}>{t.admin.manageHomeSections}</h2>
                <Link to="/admin/home-sections/new" className="btn btn-primary btn-small">+ {t.admin.addSection}</Link>
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
                        <option value="title">{t.admin.titleField}</option>
                        <option value="productsToShow">{t.admin.productsToShow}</option>
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
                            <th>{t.admin.titleField}</th>
                            <th>{t.admin.products}</th>
                            <th>{t.admin.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSections?.map((section: HomeSectionResponseDto) => (
                            <tr key={section.id} style={{ opacity: deletingId === section.id ? 0.5 : 1 }}>
                                <td>{section.id}</td>
                                <td>
                                    <Link to={`/admin/home-sections/${section.id}/edit`} className="product-row-link">
                                        {section.titleTranslations?.[language] || section.title}
                                    </Link>
                                </td>
                                <td>{section.productsToShow}</td>
                                <td>
                                    <div className="action-buttons">
                                        <Link to={`/admin/home-sections/${section.id}/edit`} className="btn btn-small btn-outline">{t.admin.edit}</Link>
                                        <button
                                            onClick={() => setDeleteConfirm(section.id)}
                                            className="btn btn-small btn-danger"
                                            disabled={deletingId === section.id}
                                        >
                                            {t.admin.delete}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredSections?.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>{t.admin.noSections}</td>
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