import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attributeService, ProductAttributeDto } from '../../services/attribute.service';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

export const AdminAttributes: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t } = useLanguage();
    const [searchParams] = useSearchParams();
    const typeFromUrl = searchParams.get('type') as 'materials' | 'styles' | 'occasions' | 'patterns' | null;

    const [activeTab, setActiveTab] = useState<'materials' | 'styles' | 'occasions' | 'patterns'>(
        typeFromUrl || 'materials'
    );
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [sortDirection, setSortDirection] = useState('asc');
    const [error, setError] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('adminAttributeSearchHistory');
        if (saved) setSearchHistory(JSON.parse(saved));
    }, []);

    useEffect(() => {
        if (typeFromUrl) {
            setActiveTab(typeFromUrl);
        }
    }, [typeFromUrl]);

    const { data: materials, isLoading: materialsLoading, error: materialsError } = useQuery({
        queryKey: ['materials'],
        queryFn: async () => (await attributeService.getMaterials()).data,
    });

    const { data: styles, isLoading: stylesLoading, error: stylesError } = useQuery({
        queryKey: ['styles'],
        queryFn: async () => (await attributeService.getStyles()).data,
    });

    const { data: occasions, isLoading: occasionsLoading, error: occasionsError } = useQuery({
        queryKey: ['occasions'],
        queryFn: async () => (await attributeService.getOccasions()).data,
    });

    const { data: patterns, isLoading: patternsLoading, error: patternsError } = useQuery({
        queryKey: ['patterns'],
        queryFn: async () => (await attributeService.getPatterns()).data,
    });

    const deleteMutation = useMutation({
        mutationFn: ({ type, id }: { type: string; id: number }) => {
            switch (type) {
                case 'materials': return attributeService.deleteMaterial(id);
                case 'styles': return attributeService.deleteStyle(id);
                case 'occasions': return attributeService.deleteOccasion(id);
                case 'patterns': return attributeService.deletePattern(id);
                default: throw new Error('Unknown');
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [variables.type] });
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

    const getCurrentList = (): ProductAttributeDto[] => {
        switch (activeTab) {
            case 'materials': return materials || [];
            case 'styles': return styles || [];
            case 'occasions': return occasions || [];
            case 'patterns': return patterns || [];
            default: return [];
        }
    };

    const getLoading = () => {
        switch (activeTab) {
            case 'materials': return materialsLoading;
            case 'styles': return stylesLoading;
            case 'occasions': return occasionsLoading;
            case 'patterns': return patternsLoading;
            default: return false;
        }
    };

    const getQueryError = () => {
        switch (activeTab) {
            case 'materials': return materialsError;
            case 'styles': return stylesError;
            case 'occasions': return occasionsError;
            case 'patterns': return patternsError;
            default: return null;
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchInput.trim()) return;
        setSearchTerm(searchInput);
        setShowSearch(false);
        const updated = [searchInput, ...searchHistory.filter(h => h !== searchInput)].slice(0, 10);
        setSearchHistory(updated);
        localStorage.setItem('adminAttributeSearchHistory', JSON.stringify(updated));
    };

    const handleHistoryClick = (term: string) => {
        setSearchInput(term);
        setSearchTerm(term);
        setShowSearch(false);
    };

    const clearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('adminAttributeSearchHistory');
    };

    const tabs = [
        { id: 'materials' as const, label: t.admin.materials },
        { id: 'styles' as const, label: t.admin.styles },
        { id: 'occasions' as const, label: t.admin.occasions },
        { id: 'patterns' as const, label: t.admin.patterns },
    ];

    let filteredList = getCurrentList().filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortDirection === 'asc') {
        filteredList = [...filteredList].sort((a, b) => a.name.localeCompare(b.name));
    } else {
        filteredList = [...filteredList].sort((a, b) => b.name.localeCompare(a.name));
    }

    const queryError = getQueryError();

    return (
        <div className="admin-attributes">
            <button onClick={() => navigate('/admin')} className="btn btn-outline back-btn">← {t.admin.back}</button>

            <div className="admin-header">
                <h2>{t.admin.manageAttributes}</h2>
                <Link to={`/admin/attributes/new?type=${activeTab}`} className="btn btn-primary">+ {t.admin.addAttribute}</Link>
            </div>

            <div className="admin-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSearchInput(''); setSearchTerm(''); }}
                        className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSearch} className="admin-search-bar-full">
                <input
                    type="text"
                    placeholder={`${t.admin.search}`}
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
                    <label>{t.admin.sort}</label>
                    <select value={sortDirection} onChange={(e) => setSortDirection(e.target.value)} className="sort-select">
                        <option value="asc">{t.admin.ascending}</option>
                        <option value="desc">{t.admin.descending}</option>
                    </select>
                </div>
            </div>

            {queryError ? (
                <div className="error-text">Failed to load data</div>
            ) : getLoading() ? (
                <LoadingSpinner />
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>{t.admin.name}</th>
                                <th>{t.admin.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredList.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.id}</td>
                                    <td>
                                        <Link to={`/admin/attributes/${item.id}/edit?type=${activeTab}`} className="product-row-link">
                                            {item.name}
                                        </Link>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <Link to={`/admin/attributes/${item.id}/edit?type=${activeTab}`} className="btn btn-small btn-outline">{t.admin.edit}</Link>
                                            <button
                                                onClick={() => setDeleteConfirm(item.id)}
                                                className="btn btn-small btn-danger"
                                                disabled={deletingId === item.id}
                                            >
                                                {t.admin.delete}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredList.length === 0 && (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'center', padding: '20px' }}>
                                        {t.admin.noItems}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{t.admin.delete}</h3>
                        <p>{t.admin.confirmDelete}</p>
                        <div className="modal-actions">
                            <button
                                onClick={() => {
                                    setDeletingId(deleteConfirm);
                                    deleteMutation.mutate({ type: activeTab, id: deleteConfirm });
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