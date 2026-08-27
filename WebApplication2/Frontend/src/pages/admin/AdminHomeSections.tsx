import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { homeSectionService, HomeSectionResponseDto } from '../../services/homeSection.service';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AdminHomeSections: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('title');
    const [sortDirection, setSortDirection] = useState('asc');
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('adminHomeSectionSearchHistory');
        if (saved) setSearchHistory(JSON.parse(saved));
    }, []);

    const { data: sections, isLoading } = useQuery({
        queryKey: ['home-sections'],
        queryFn: async () => (await homeSectionService.getAll()).data,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => homeSectionService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['home-sections'] });
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

    let filteredSections = sections?.filter(s =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredSections) {
        filteredSections = [...filteredSections].sort((a, b) => {
            if (sortBy === 'title') {
                return sortDirection === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
            }
            if (sortBy === 'productsToShow') {
                return sortDirection === 'asc' ? a.productsToShow - b.productsToShow : b.productsToShow - a.productsToShow;
            }
            return 0;
        });
    }

    return (
        <div className="admin-home-sections">
            <button onClick={() => navigate('/admin')} className="btn btn-outline back-btn">← Back</button>

            <div className="admin-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '15px', margin: 0, lineHeight: '1' }}>Manage Homepage Sections</h2>
                <Link to="/admin/home-sections/new" className="btn btn-primary btn-small">+ Add Section</Link>
            </div>

            <form onSubmit={handleSearch} className="admin-search-bar-full">
                <input
                    type="text"
                    placeholder="Search sections..."
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
                        <option value="title">Title</option>
                        <option value="productsToShow">Products Count</option>
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
                            <th>Title</th>
                            <th>Products</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSections?.map((section: HomeSectionResponseDto) => (
                            <tr key={section.id}>
                                <td>{section.id}</td>
                                <td>
                                    <Link to={`/admin/home-sections/${section.id}/edit`} className="product-row-link">
                                        {section.title}
                                    </Link>
                                </td>
                                <td>{section.productsToShow}</td>
                                <td>
                                    <div className="action-buttons">
                                        <Link to={`/admin/home-sections/${section.id}/edit`} className="btn btn-small btn-outline">Edit</Link>
                                        <button onClick={() => setDeleteConfirm(section.id)} className="btn btn-small btn-danger">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredSections?.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>No sections found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete Section</h3>
                        <p>Are you sure you want to delete this section?</p>
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