import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../../services/product.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../../types/product';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AdminCategories: React.FC = () => {
    const queryClient = useQueryClient();
    const [editingCategory, setEditingCategory] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [error, setError] = useState('');

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
        onError: (err: any) => {
            setError(err.response?.data || 'Failed to create category');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateCategoryDto }) =>
            categoryService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setEditingCategory(null);
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Failed to update category');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => categoryService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Failed to delete category');
        },
    });

    if (isLoading) return <LoadingSpinner />;

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        createMutation.mutate({
            name: newName,
            description: newDescription || undefined,
        });
    };

    const handleUpdate = (id: number) => {
        if (!editName.trim()) return;
        updateMutation.mutate({
            id,
            data: {
                name: editName,
                description: editDescription || undefined,
            },
        });
    };

    return (
        <div className="admin-categories">
            <h1>Manage Categories</h1>

            {error && <div className="alert alert-error">{error}</div>}

            {/* Add New Category */}
            <div className="add-category-form">
                <h2>Add New Category</h2>
                <form onSubmit={handleCreate} className="category-form">
                    <input
                        type="text"
                        placeholder="Category name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="search-input"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Description (optional)"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        className="search-input"
                    />
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={createMutation.isPending}
                    >
                        Add Category
                    </button>
                </form>
            </div>

            {/* Categories List */}
            <div className="categories-list">
                <h2>All Categories</h2>
                <div className="category-items">
                    {categories?.map((category) => (
                        <div key={category.id} className="category-item">
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
                                        placeholder="Description"
                                    />
                                    <button
                                        onClick={() => handleUpdate(category.id)}
                                        className="btn btn-primary btn-small"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setEditingCategory(null)}
                                        className="btn btn-outline btn-small"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <div className="category-display">
                                    <div className="category-info">
                                        <h3>{category.name}</h3>
                                        {category.description && <p>{category.description}</p>}
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
                                        <button
                                            onClick={() => deleteMutation.mutate(category.id)}
                                            className="btn btn-danger btn-small"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};