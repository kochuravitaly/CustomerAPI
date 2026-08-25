import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../../services/product.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../../types/product';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AdminCategories: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [editingCategory, setEditingCategory] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const { data: categories, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await categoryService.getAll();
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateCategoryDto) => categoryService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setNewName('');
            setNewDescription('');
        },
        onError: (err: any) => setError(err.response?.data || 'Failed'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateCategoryDto }) =>
            categoryService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setEditingCategory(null);
        },
        onError: (err: any) => setError(err.response?.data || 'Failed'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => categoryService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
        onError: (err: any) => setError(err.response?.data || 'Failed'),
    });

    if (isLoading) return <LoadingSpinner />;

    const filteredCategories = categories?.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        createMutation.mutate({ name: newName, description: newDescription || undefined });
    };

    const handleUpdate = (id: number) => {
        if (!editName.trim()) return;
        updateMutation.mutate({
            id,
            data: { name: editName, description: editDescription || undefined },
        });
    };

    return (
        <div className="admin-categories">
            <button onClick={() => navigate('/admin')} className="btn btn-outline back-btn">← Back</button>

            <h2>Manage Categories</h2>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="admin-search-row">
                <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            <form onSubmit={handleCreate} className="add-attribute-form">
                <input
                    type="text"
                    placeholder="New category name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="search-input"
                />
                <input
                    type="text"
                    placeholder="Description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="search-input"
                />
                <button type="submit" className="btn btn-primary">Add</button>
            </form>

            <div className="attribute-list">
                {filteredCategories?.map((category) => (
                    <div key={category.id} className="attribute-item">
                        {editingCategory === category.id ? (
                            <div className="category-edit-form">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="search-input"
                                />
                                <input
                                    type="text"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="search-input"
                                />
                                <button onClick={() => handleUpdate(category.id)} className="btn btn-primary btn-small">Save</button>
                                <button onClick={() => setEditingCategory(null)} className="btn btn-outline btn-small">Cancel</button>
                            </div>
                        ) : (
                            <div className="category-display">
                                <div>
                                    <strong>{category.name}</strong>
                                    {category.description && (
                                        <span style={{ marginLeft: 8, fontSize: 12, color: '#71717A' }}>{category.description}</span>
                                    )}
                                </div>
                                <div className="category-actions">
                                    <button
                                        onClick={() => {
                                            setEditingCategory(category.id);
                                            setEditName(category.name);
                                            setEditDescription(category.description || '');
                                        }}
                                        className="btn btn-outline btn-small"
                                    >
                                        Edit
                                    </button>
                                    <button onClick={() => deleteMutation.mutate(category.id)} className="btn btn-danger btn-small">Delete</button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};