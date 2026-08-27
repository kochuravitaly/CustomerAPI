import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../../services/product.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../../types/product';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AdminCategoryForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [error, setError] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const { data: category, isLoading } = useQuery({
        queryKey: ['category', id],
        queryFn: async () => (await categoryService.getById(Number(id))).data,
        enabled: isEdit,
    });

    useEffect(() => {
        if (category) {
            setName(category.name);
            setDescription(category.description || '');
        }
    }, [category]);

    const createMutation = useMutation({
        mutationFn: (data: CreateCategoryDto) => categoryService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            navigate('/admin/categories');
        },
        onError: (err: any) => setError(err.response?.data || 'Failed to create category'),
    });

    const updateMutation = useMutation({
        mutationFn: (data: UpdateCategoryDto) => categoryService.update(Number(id), data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            navigate('/admin/categories');
        },
        onError: (err: any) => setError(err.response?.data || 'Failed to update category'),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        if (isEdit) {
            updateMutation.mutate({ name, description: description || undefined });
        } else {
            createMutation.mutate({ name, description: description || undefined });
        }
    };

    if (isLoading && isEdit) return <LoadingSpinner />;

    return (
        <div className="admin-form-page">
            <button onClick={() => navigate('/admin/categories')} className="btn btn-outline back-btn">← Back</button>
            <h1>{isEdit ? 'Edit Category' : 'Add New Category'}</h1>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="admin-form">
                <div className="form-group">
                    <label>Category Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Description (optional)</label>
                    <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                        {isEdit ? 'Update Category' : 'Create Category'}
                    </button>
                    <button type="button" onClick={() => navigate('/admin/categories')} className="btn btn-outline">Cancel</button>
                </div>
            </form>
        </div>
    );
};