import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../../services/product.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../../types/product';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

export const AdminCategoryForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t, language } = useLanguage();
    const [error, setError] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [nameError, setNameError] = useState('');

    const { data: category, isLoading } = useQuery({
        queryKey: ['category', id, language],
        queryFn: async () => (await categoryService.getById(Number(id))).data,
        enabled: isEdit,
    });

    useEffect(() => {
        if (category) {
            setName(category.nameTranslations?.[language] || category.name);
            setDescription(category.descriptionTranslations?.[language] || category.description || '');
        }
    }, [category, language]);

    const createMutation = useMutation({
        mutationFn: (data: CreateCategoryDto) => categoryService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            navigate('/admin/categories');
        },
        onError: (err: any) => setError(err.response?.data || t.common.error),
    });

    const updateMutation = useMutation({
        mutationFn: (data: UpdateCategoryDto) => categoryService.update(Number(id), data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            navigate('/admin/categories');
        },
        onError: (err: any) => setError(err.response?.data || t.common.error),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setNameError('');

        if (!name.trim()) {
            setNameError('Name is required');
            return;
        }

        if (isEdit) {
            updateMutation.mutate({ name, description: description || undefined });
        } else {
            createMutation.mutate({ name, description: description || undefined });
        }
    };

    if (isLoading && isEdit) return <LoadingSpinner />;

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="admin-form-page">
            <button onClick={() => navigate('/admin/categories')} className="btn btn-outline back-btn">← {t.admin.back}</button>
            <h1>{isEdit ? t.admin.editCategory : t.admin.addCategory}</h1>

            {error && <div className="alert alert-error">{error}</div>}
            {nameError && <div className="error-text">{nameError}</div>}

            <form onSubmit={handleSubmit} className="admin-form" noValidate>
                <div className="form-group">
                    <label>{t.admin.name}</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={nameError ? 'input-error' : ''}
                    />
                </div>
                <div className="form-group">
                    <label>{t.admin.description} ({t.admin.optional})</label>
                    <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? '...' : isEdit ? t.admin.update : t.admin.create}
                    </button>
                    <button type="button" onClick={() => navigate('/admin/categories')} className="btn btn-outline">{t.admin.cancel}</button>
                </div>
            </form>
        </div>
    );
};