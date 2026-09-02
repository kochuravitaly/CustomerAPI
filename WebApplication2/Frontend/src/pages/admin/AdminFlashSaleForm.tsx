import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { flashSaleService } from '../../services/coupon.service';
import { productService, categoryService } from '../../services/product.service';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

export const AdminFlashSaleForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t, language } = useLanguage();
    const [error, setError] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
    const [formErrors, setFormErrors] = useState<{ discountPercentage?: string; startsAt?: string; endsAt?: string }>({});
    const [form, setForm] = useState({
        discountPercentage: '',
        startsAt: '',
        endsAt: '',
    });

    const { data: flashSales, isLoading: flashSalesLoading } = useQuery({
        queryKey: ['flash-sales'],
        queryFn: async () => (await flashSaleService.getAll()).data,
        enabled: isEdit,
    });

    const { data: products } = useQuery({
        queryKey: ['products-list'],
        queryFn: async () => {
            const response = await productService.getAll({ page: 1, pageSize: 100 });
            return response.data.items;
        },
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await categoryService.getAll()).data,
    });

    useEffect(() => {
        if (isEdit && flashSales) {
            const flashSale = flashSales.find(fs => fs.id === Number(id));
            if (flashSale) {
                setForm({
                    discountPercentage: String(flashSale.discountPercentage),
                    startsAt: new Date(flashSale.startsAt).toISOString().slice(0, 16),
                    endsAt: new Date(flashSale.endsAt).toISOString().slice(0, 16),
                });
                try { setSelectedProductIds(JSON.parse(flashSale.productIdsJson || '[]')); } catch { setSelectedProductIds([]); }
                try { setSelectedCategoryIds(JSON.parse(flashSale.categoryIdsJson || '[]')); } catch { setSelectedCategoryIds([]); }
            }
        }
    }, [flashSales, id, isEdit]);

    const toggleProduct = (productId: number) => {
        setSelectedProductIds(prev =>
            prev.includes(productId) ? prev.filter(p => p !== productId) : [...prev, productId]
        );
    };

    const toggleCategory = (categoryId: number) => {
        setSelectedCategoryIds(prev =>
            prev.includes(categoryId) ? prev.filter(c => c !== categoryId) : [...prev, categoryId]
        );
    };

    const createMutation = useMutation({
        mutationFn: () => flashSaleService.create({
            discountPercentage: Number(form.discountPercentage),
            startsAt: new Date(form.startsAt).toISOString(),
            endsAt: new Date(form.endsAt).toISOString(),
            productIdsJson: JSON.stringify(selectedProductIds),
            categoryIdsJson: JSON.stringify(selectedCategoryIds),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
            navigate('/admin/flash-sale');
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Failed to create');
            setShowErrorModal(true);
        },
    });

    const updateMutation = useMutation({
        mutationFn: () => flashSaleService.update(Number(id), {
            discountPercentage: Number(form.discountPercentage),
            startsAt: new Date(form.startsAt).toISOString(),
            endsAt: new Date(form.endsAt).toISOString(),
            productIdsJson: JSON.stringify(selectedProductIds),
            categoryIdsJson: JSON.stringify(selectedCategoryIds),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
            navigate('/admin/flash-sale');
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Failed to update');
            setShowErrorModal(true);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});

        const newErrors: { discountPercentage?: string; startsAt?: string; endsAt?: string } = {};

        if (!form.discountPercentage) {
            newErrors.discountPercentage = 'Discount percentage is required';
        }
        if (!form.startsAt) {
            newErrors.startsAt = 'Start date is required';
        }
        if (!form.endsAt) {
            newErrors.endsAt = 'End date is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setFormErrors(newErrors);
            return;
        }

        if (isEdit) updateMutation.mutate();
        else createMutation.mutate();
    };

    if (flashSalesLoading && isEdit) return <LoadingSpinner />;

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="admin-form-page">
            <button onClick={() => navigate('/admin/flash-sale')} className="btn btn-outline back-btn">← {t.admin.back}</button>
            <h1>{isEdit ? t.admin.updateFlashSale : t.admin.createFlashSale}</h1>

            <form onSubmit={handleSubmit} className="admin-form" noValidate>
                <div className="form-group">
                    <label>{t.admin.discountPercentage}</label>
                    <input
                        type="number"
                        min="1"
                        max="99"
                        value={form.discountPercentage}
                        onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })}
                        className={formErrors.discountPercentage ? 'input-error' : ''}
                    />
                    {formErrors.discountPercentage && <span className="error-text">{formErrors.discountPercentage}</span>}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>{t.admin.startsAt}</label>
                        <input
                            type="datetime-local"
                            value={form.startsAt}
                            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                            className={formErrors.startsAt ? 'input-error' : ''}
                        />
                        {formErrors.startsAt && <span className="error-text">{formErrors.startsAt}</span>}
                    </div>
                    <div className="form-group">
                        <label>{t.admin.endsAt}</label>
                        <input
                            type="datetime-local"
                            value={form.endsAt}
                            onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                            className={formErrors.endsAt ? 'input-error' : ''}
                        />
                        {formErrors.endsAt && <span className="error-text">{formErrors.endsAt}</span>}
                    </div>
                </div>

                <div className="form-group">
                    <label>{t.admin.specificProducts} ({t.admin.optional})</label>
                    <div className="multi-select-tags" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {products?.map((p) => (
                            <button key={p.id} type="button" onClick={() => toggleProduct(p.id)} className={`size-btn ${selectedProductIds.includes(p.id) ? 'active' : ''}`}>
                                {p.nameTranslations?.[language] || p.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label>{t.admin.specificCategories} ({t.admin.optional})</label>
                    <div className="multi-select-tags">
                        {categories?.map((c) => (
                            <button key={c.id} type="button" onClick={() => toggleCategory(c.id)} className={`size-btn ${selectedCategoryIds.includes(c.id) ? 'active' : ''}`}>
                                {c.nameTranslations?.[language] || c.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? '...' : isEdit ? t.admin.updateFlashSale : t.admin.createFlashSale}
                    </button>
                    <button type="button" onClick={() => navigate('/admin/flash-sale')} className="btn btn-outline">{t.admin.cancel}</button>
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