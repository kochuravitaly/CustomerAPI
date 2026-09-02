import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attributeService } from '../../services/attribute.service';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

export const AdminAttributeForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'materials';
    const isEdit = !!id;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t } = useLanguage();
    const [error, setError] = useState('');
    const [name, setName] = useState('');
    const [nameError, setNameError] = useState('');

    const getList = async () => {
        switch (type) {
            case 'materials': return (await attributeService.getMaterials()).data;
            case 'styles': return (await attributeService.getStyles()).data;
            case 'occasions': return (await attributeService.getOccasions()).data;
            case 'patterns': return (await attributeService.getPatterns()).data;
            default: return [];
        }
    };

    const { data: items, isLoading } = useQuery({
        queryKey: [type],
        queryFn: getList,
    });

    useEffect(() => {
        if (isEdit && items) {
            const item = items.find(i => i.id === Number(id));
            if (item) setName(item.name);
        }
    }, [items, id, isEdit]);

    const updateMutation = useMutation({
        mutationFn: async () => {
            switch (type) {
                case 'materials': return await attributeService.updateMaterial(Number(id), name);
                case 'styles': return await attributeService.updateStyle(Number(id), name);
                case 'occasions': return await attributeService.updateOccasion(Number(id), name);
                case 'patterns': return await attributeService.updatePattern(Number(id), name);
                default: throw new Error('Unknown');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [type] });
            navigate(`/admin/attributes?type=${type}`);
        },
        onError: (err: any) => setError(err.response?.data || 'Failed to update'),
    });

    const createMutation = useMutation({
        mutationFn: (name: string) => {
            switch (type) {
                case 'materials': return attributeService.createMaterial(name);
                case 'styles': return attributeService.createStyle(name);
                case 'occasions': return attributeService.createOccasion(name);
                case 'patterns': return attributeService.createPattern(name);
                default: throw new Error('Unknown');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [type] });
            navigate(`/admin/attributes?type=${type}`);
        },
        onError: (err: any) => setError(err.response?.data || 'Failed to create'),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setNameError('');

        if (!name.trim()) {
            setNameError('Name is required');
            return;
        }

        if (isEdit) {
            updateMutation.mutate();
        } else {
            createMutation.mutate(name);
        }
    };

    if (isLoading && isEdit) return <LoadingSpinner />;

    const typeLabel = type === 'materials' ? t.admin.materials.slice(0, -1) :
        type === 'styles' ? t.admin.styles.slice(0, -1) :
            type === 'occasions' ? t.admin.occasions.slice(0, -1) :
                t.admin.patterns.slice(0, -1);

    const isSubmitting = updateMutation.isPending || createMutation.isPending;

    return (
        <div className="admin-form-page">
            <button onClick={() => navigate(`/admin/attributes?type=${type}`)} className="btn btn-outline back-btn">← {t.admin.back}</button>
            <h1>{isEdit ? `${t.admin.edit} ${typeLabel}` : `${t.admin.addAttribute} ${typeLabel}`}</h1>

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
                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? '...' : isEdit ? t.admin.update : t.admin.create}
                    </button>
                    <button type="button" onClick={() => navigate(`/admin/attributes?type=${type}`)} className="btn btn-outline">{t.admin.cancel}</button>
                </div>
            </form>
        </div>
    );
};