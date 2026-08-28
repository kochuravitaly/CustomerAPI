import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { homeSectionService } from '../../services/homeSection.service';
import { attributeService } from '../../services/attribute.service';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AdminHomeSectionForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [error, setError] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [form, setForm] = useState({
        title: '',
        productsToShow: 4,
        gender: '',
        season: '',
        ageGroup: '',
        materialId: '',
        styleId: '',
        occasionId: '',
        patternId: '',
    });

    const { data: sections } = useQuery({
        queryKey: ['home-sections'],
        queryFn: async () => (await homeSectionService.getAll()).data,
        enabled: isEdit,
    });

    const { data: materials } = useQuery({
        queryKey: ['materials'],
        queryFn: async () => (await attributeService.getMaterials()).data,
    });

    const { data: styles } = useQuery({
        queryKey: ['styles'],
        queryFn: async () => (await attributeService.getStyles()).data,
    });

    const { data: occasions } = useQuery({
        queryKey: ['occasions'],
        queryFn: async () => (await attributeService.getOccasions()).data,
    });

    const { data: patterns } = useQuery({
        queryKey: ['patterns'],
        queryFn: async () => (await attributeService.getPatterns()).data,
    });

    useEffect(() => {
        if (isEdit && sections) {
            const section = sections.find(s => s.id === Number(id));
            if (section) {
                try {
                    const filters = JSON.parse(section.filterJson);
                    setForm({
                        title: section.title,
                        productsToShow: section.productsToShow,
                        gender: filters.gender !== undefined ? String(filters.gender) : '',
                        season: filters.season !== undefined ? String(filters.season) : '',
                        ageGroup: filters.ageGroup !== undefined ? String(filters.ageGroup) : '',
                        materialId: filters.materialId !== undefined ? String(filters.materialId) : '',
                        styleId: filters.styleId !== undefined ? String(filters.styleId) : '',
                        occasionId: filters.occasionId !== undefined ? String(filters.occasionId) : '',
                        patternId: filters.patternId !== undefined ? String(filters.patternId) : '',
                    });
                } catch {
                    setForm({
                        title: section.title,
                        productsToShow: section.productsToShow,
                        gender: '', season: '', ageGroup: '',
                        materialId: '', styleId: '', occasionId: '', patternId: '',
                    });
                }
            }
        }
    }, [sections, id, isEdit]);

    const buildFilters = () => {
        const filters: any = {};
        if (form.gender !== '') filters.gender = Number(form.gender);
        if (form.season !== '') filters.season = Number(form.season);
        if (form.ageGroup !== '') filters.ageGroup = Number(form.ageGroup);
        if (form.materialId !== '') filters.materialId = Number(form.materialId);
        if (form.styleId !== '') filters.styleId = Number(form.styleId);
        if (form.occasionId !== '') filters.occasionId = Number(form.occasionId);
        if (form.patternId !== '') filters.patternId = Number(form.patternId);
        return filters;
    };

    const hasFilter = form.gender !== '' || form.season !== '' || form.ageGroup !== '' ||
        form.materialId !== '' || form.styleId !== '' || form.occasionId !== '' || form.patternId !== '';

    const createMutation = useMutation({
        mutationFn: () => homeSectionService.create({
            title: form.title,
            displayOrder: sections ? sections.length + 1 : 1,
            productsToShow: Number(form.productsToShow),
            filterJson: JSON.stringify(buildFilters()),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['home-sections'] });
            navigate('/admin/home-sections');
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Failed to create');
            setShowErrorModal(true);
        },
    });

    const updateMutation = useMutation({
        mutationFn: () => homeSectionService.update(Number(id), {
            title: form.title,
            displayOrder: 0,
            productsToShow: Number(form.productsToShow),
            filterJson: JSON.stringify(buildFilters()),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['home-sections'] });
            navigate('/admin/home-sections');
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Failed to update');
            setShowErrorModal(true);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) {
            setError('Title is required');
            setShowErrorModal(true);
            return;
        }

        if (!hasFilter) {
            setError('At least one filter must be selected');
            setShowErrorModal(true);
            return;
        }

        if (isEdit) {
            updateMutation.mutate();
        } else {
            createMutation.mutate();
        }
    };

    if (isEdit && !sections) return <LoadingSpinner />;

    return (
        <div className="admin-form-page">
            <button onClick={() => navigate('/admin/home-sections')} className="btn btn-outline back-btn">← Back</button>
            <h1>{isEdit ? 'Edit Section' : 'Add New Section'}</h1>

            <form onSubmit={handleSubmit} className="admin-form">
                <div className="form-group">
                    <label>Section Title</label>
                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>

                <div className="form-group">
                    <label>Products to Show</label>
                    <select value={form.productsToShow} onChange={(e) => setForm({ ...form, productsToShow: Number(e.target.value) })}>
                        <option value={2}>2</option>
                        <option value={4}>4</option>
                        <option value={6}>6</option>
                        <option value={8}>8</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Gender</label>
                    <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                        <option value="">Any</option>
                        <option value={0}>Unisex</option>
                        <option value={1}>Men</option>
                        <option value={2}>Women</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Season</label>
                    <select value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>
                        <option value="">Any</option>
                        <option value={0}>All Season</option>
                        <option value={1}>Summer</option>
                        <option value={2}>Winter</option>
                        <option value={3}>Autumn</option>
                        <option value={4}>Spring</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Age Group</label>
                    <select value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}>
                        <option value="">Any</option>
                        <option value={0}>Adult</option>
                        <option value={1}>Baby</option>
                        <option value={2}>Kids</option>
                        <option value={3}>Teen</option>
                        <option value={4}>Senior</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Material</label>
                    <select value={form.materialId} onChange={(e) => setForm({ ...form, materialId: e.target.value })}>
                        <option value="">Any</option>
                        {materials?.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label>Style</label>
                    <select value={form.styleId} onChange={(e) => setForm({ ...form, styleId: e.target.value })}>
                        <option value="">Any</option>
                        {styles?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label>Occasion</label>
                    <select value={form.occasionId} onChange={(e) => setForm({ ...form, occasionId: e.target.value })}>
                        <option value="">Any</option>
                        {occasions?.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label>Pattern</label>
                    <select value={form.patternId} onChange={(e) => setForm({ ...form, patternId: e.target.value })}>
                        <option value="">Any</option>
                        {patterns?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                        {isEdit ? 'Update Section' : 'Create Section'}
                    </button>
                    <button type="button" onClick={() => navigate('/admin/home-sections')} className="btn btn-outline">Cancel</button>
                </div>
            </form>

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