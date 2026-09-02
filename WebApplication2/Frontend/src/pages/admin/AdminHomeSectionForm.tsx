import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { homeSectionService } from '../../services/homeSection.service';
import { attributeService } from '../../services/attribute.service';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

export const AdminHomeSectionForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t, language } = useLanguage();
    const [error, setError] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [titleError, setTitleError] = useState('');
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

    const { data: sections, isLoading: sectionsLoading } = useQuery({
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
                        title: section.titleTranslations?.[language] || section.title,
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
                        title: section.titleTranslations?.[language] || section.title,
                        productsToShow: section.productsToShow,
                        gender: '', season: '', ageGroup: '',
                        materialId: '', styleId: '', occasionId: '', patternId: '',
                    });
                }
            }
        }
    }, [sections, id, isEdit, language]);

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
            setError(err.response?.data || t.common.error);
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
            setError(err.response?.data || t.common.error);
            setShowErrorModal(true);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTitleError('');

        if (!form.title.trim()) {
            setTitleError('Title is required');
            return;
        }

        if (!hasFilter) {
            setError('At least one filter is required');
            setShowErrorModal(true);
            return;
        }

        if (isEdit) {
            updateMutation.mutate();
        } else {
            createMutation.mutate();
        }
    };

    if (sectionsLoading && isEdit) return <LoadingSpinner />;

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="admin-form-page">
            <button onClick={() => navigate('/admin/home-sections')} className="btn btn-outline back-btn">← {t.admin.back}</button>
            <h1>{isEdit ? t.admin.updateSection : t.admin.createSection}</h1>

            <form onSubmit={handleSubmit} className="admin-form" noValidate>
                <div className="form-group">
                    <label>{t.admin.titleField}</label>
                    <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className={titleError ? 'input-error' : ''}
                    />
                    {titleError && <span className="error-text">{titleError}</span>}
                </div>

                <div className="form-group">
                    <label>{t.admin.productsToShow}</label>
                    <select value={form.productsToShow} onChange={(e) => setForm({ ...form, productsToShow: Number(e.target.value) })}>
                        <option value={2}>2</option>
                        <option value={4}>4</option>
                        <option value={6}>6</option>
                        <option value={8}>8</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>{t.product.gender}</label>
                    <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                        <option value="">{t.admin.any}</option>
                        <option value={0}>{t.product.unisex}</option>
                        <option value={1}>{t.product.men}</option>
                        <option value={2}>{t.product.women}</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>{t.product.season}</label>
                    <select value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>
                        <option value="">{t.admin.any}</option>
                        <option value={0}>{t.product.allSeason}</option>
                        <option value={1}>{t.product.summer}</option>
                        <option value={2}>{t.product.winter}</option>
                        <option value={3}>{t.product.autumn}</option>
                        <option value={4}>{t.product.spring}</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>{t.product.ageGroup}</label>
                    <select value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}>
                        <option value="">{t.admin.any}</option>
                        <option value={0}>{t.product.adult}</option>
                        <option value={1}>{t.product.baby}</option>
                        <option value={2}>{t.product.kids}</option>
                        <option value={3}>{t.product.teen}</option>
                        <option value={4}>{t.product.senior}</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>{t.product.material}</label>
                    <select value={form.materialId} onChange={(e) => setForm({ ...form, materialId: e.target.value })}>
                        <option value="">{t.admin.any}</option>
                        {materials?.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label>{t.product.style}</label>
                    <select value={form.styleId} onChange={(e) => setForm({ ...form, styleId: e.target.value })}>
                        <option value="">{t.admin.any}</option>
                        {styles?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label>{t.product.occasion}</label>
                    <select value={form.occasionId} onChange={(e) => setForm({ ...form, occasionId: e.target.value })}>
                        <option value="">{t.admin.any}</option>
                        {occasions?.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label>{t.product.pattern}</label>
                    <select value={form.patternId} onChange={(e) => setForm({ ...form, patternId: e.target.value })}>
                        <option value="">{t.admin.any}</option>
                        {patterns?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? '...' : isEdit ? t.admin.updateSection : t.admin.createSection}
                    </button>
                    <button type="button" onClick={() => navigate('/admin/home-sections')} className="btn btn-outline">{t.admin.cancel}</button>
                </div>
            </form>

            {showErrorModal && (
                <div className="modal-overlay" onClick={() => setShowErrorModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{t.admin.error}</h3>
                        <p>{error}</p>
                        <div className="modal-actions">
                            <button onClick={() => setShowErrorModal(false)} className="btn btn-primary">{t.admin.ok}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};