import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attributeService, ProductAttributeDto } from '../../services/attribute.service';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AdminAttributes: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'materials' | 'styles' | 'occasions' | 'patterns'>('materials');
    const [newName, setNewName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');

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

    const createMutation = useMutation({
        mutationFn: ({ type, name }: { type: string; name: string }) => {
            switch (type) {
                case 'materials': return attributeService.createMaterial(name);
                case 'styles': return attributeService.createStyle(name);
                case 'occasions': return attributeService.createOccasion(name);
                case 'patterns': return attributeService.createPattern(name);
                default: throw new Error('Unknown');
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [variables.type] });
            setNewName('');
        },
        onError: (err: any) => setError(err.response?.data || 'Failed'),
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

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        createMutation.mutate({ type: activeTab, name: newName });
    };

    const filteredList = getCurrentList().filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tabs = [
        { id: 'materials' as const, label: 'Materials' },
        { id: 'styles' as const, label: 'Styles' },
        { id: 'occasions' as const, label: 'Occasions' },
        { id: 'patterns' as const, label: 'Patterns' },
    ];

    return (
        <div className="admin-attributes">
            <button onClick={() => navigate('/admin')} className="btn btn-outline back-btn">← Back</button>

            <h2>Manage Attributes</h2>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="admin-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                        className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="admin-search-row">
                <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            <form onSubmit={handleCreate} className="add-attribute-form">
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={`Add new ${activeTab.slice(0, -1)}...`}
                    className="search-input"
                />
                <button type="submit" className="btn btn-primary">Add</button>
            </form>

            {getLoading() ? (
                <LoadingSpinner />
            ) : (
                <div className="attribute-list">
                    {filteredList.map((item) => (
                        <div key={item.id} className="attribute-item">
                            <span>{item.name}</span>
                            <button
                                onClick={() => deleteMutation.mutate({ type: activeTab, id: item.id })}
                                className="btn btn-danger btn-small"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                    {filteredList.length === 0 && (
                        <p className="no-items">No {activeTab} found</p>
                    )}
                </div>
            )}
        </div>
    );
};