import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { homeSectionService, HomeSectionResponseDto } from '../../services/homeSection.service';
import { attributeService } from '../../services/attribute.service';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AdminHomeSections: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [error, setError] = useState('');
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

    const { data: sections, isLoading } = useQuery({
        queryKey: ['home-sections'],
        queryFn: async () => (await homeSectionService.getAll()).data,
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

    const createMutation = useMutation({
        mutationFn: () => {
            const filters: any = {};
            if (form.gender !== '') filters.gender = Number(form.gender);
            if (form.season !== '') filters.season = Number(form.season);
            if (form.ageGroup !== '') filters.ageGroup = Number(form.ageGroup);
            if (form.materialId !== '') filters.materialId = Number(form.materialId);
            if (form.styleId !== '') filters.styleId = Number(form.styleId);
            if (form.occasionId !== '') filters.occasionId = Number(form.occasionId);
            if (form.patternId !== '') filters.patternId = Number(form.patternId);

            return homeSectionService.create({
                title: form.title,
                displayOrder: sections ? sections.length + 1 : 1,
                productsToShow: Number(form.productsToShow),
                filterJson: JSON.stringify(filters),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['home-sections'] });
            setForm({
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
        },
        onError: (err: any) => setError(err.response?.data || 'Failed'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => homeSectionService.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['home-sections'] }),
    });

    return (
        <div className="admin-home-sections">
            <button onClick={() => navigate('/admin')} className="btn btn-outline back-btn">← Back</button>
            <h2>Homepage Sections</h2>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="admin-form">
                <div className="form-group">
                    <label>Section Title</label>
                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="For Him, Gym Time, etc." required />
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

                <div className="form-row">
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
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Material</label>
                        <select value={form.materialId} onChange={(e) => setForm({ ...form, materialId: e.target.value })}>
                            <option value="">Any</option>
                            {materials?.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Style</label>
                        <select value={form.styleId} onChange={(e) => setForm({ ...form, styleId: e.target.value })}>
                            <option value="">Any</option>
                            {styles?.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Occasion</label>
                        <select value={form.occasionId} onChange={(e) => setForm({ ...form, occasionId: e.target.value })}>
                            <option value="">Any</option>
                            {occasions?.map((o) => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Pattern</label>
                        <select value={form.patternId} onChange={(e) => setForm({ ...form, patternId: e.target.value })}>
                            <option value="">Any</option>
                            {patterns?.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button type="submit" className="btn btn-primary">Create Section</button>
            </form>

            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <div className="attribute-list">
                    {sections?.map((section: HomeSectionResponseDto) => (
                        <div key={section.id} className="attribute-item">
                            <div>
                                <strong>{section.title}</strong>
                                <span style={{ marginLeft: 8, fontSize: 12, color: '#71717A' }}>
                                    Products: {section.productsToShow}
                                </span>
                            </div>
                            <button onClick={() => deleteMutation.mutate(section.id)} className="btn btn-danger btn-small">Delete</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};