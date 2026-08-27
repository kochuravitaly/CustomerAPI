import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attributeService, ProductAttributeDto } from '../../services/attribute.service';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AdminAttributes: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
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

    useEffect(() => {
        const saved = localStorage.getItem('adminAttributeSearchHistory');
        if (saved) setSearchHistory(JSON.parse(saved));
    }, []);

    useEffect(() => {
        if (typeFromUrl) {
            setActiveTab(typeFromUrl);
        }
    }, [typeFromUrl]);

    const { data: materials, isLoading: materialsLoading } = useQuery({
        queryKey: ['materials'],
        queryFn: async () => (await attributeService.getMaterials()).data,
    });

    const { data: styles, isLoading: stylesLoading } = useQuery({
        queryKey: ['styles'],
        queryFn: async () => (await attributeService.getStyles()).data,
    });

    const { data: occasions, isLoading: occasionsLoading } = useQuery({
        queryKey: ['occasions'],
        queryFn: async () => (await attributeService.getOccasions()).data,
    });

    const { data: patterns, isLoading: patternsLoading } = useQuery({
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
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Failed to delete');
            setDeleteConfirm(null);
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
        { id: 'materials' as const, label: 'Materials' },
        { id: 'styles' as const, label: 'Styles' },
        { id: 'occasions' as const, label: 'Occasions' },
        { id: 'patterns' as const, label: 'Patterns' },
    ];

    let filteredList = getCurrentList().filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortDirection === 'asc') {
        filteredList = [...filteredList].sort((a, b) => a.name.localeCompare(b.name));
    } else {
        filteredList = [...filteredList].sort((a, b) => b.name.localeCompare(a.name));
    }

    return (
        <div className="admin-attributes">
            <button onClick={() => navigate('/admin')} className="btn btn-outline back-btn">← Back</button>

            <div className="admin-header">
                <h2>Manage Attributes</h2>
                <Link to={`/admin/attributes/new?type=${activeTab}`} className="btn btn-primary">+ Add {activeTab.slice(0, -1)}</Link>
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
                    placeholder={`Search ${activeTab}...`}
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
                    <label>Sort:</label>
                    <select value={sortDirection} onChange={(e) => setSortDirection(e.target.value)} className="sort-select">
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </div>
            </div>

            {getLoading() ? (
                <LoadingSpinner />
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Actions</th>
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
                                            <Link to={`/admin/attributes/${item.id}/edit?type=${activeTab}`} className="btn btn-small btn-outline">Edit</Link>
                                            <button onClick={() => setDeleteConfirm(item.id)} className="btn btn-small btn-danger">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredList.length === 0 && (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'center', padding: '20px' }}>
                                        No {activeTab} found
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
                        <h3>Delete {activeTab.slice(0, -1)}</h3>
                        <p>Are you sure you want to delete this item?</p>
                        <div className="modal-actions">
                            <button onClick={() => deleteMutation.mutate({ type: activeTab, id: deleteConfirm })} className="btn btn-danger">Delete</button>
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