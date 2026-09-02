import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { couponService } from '../../services/coupon.service';
import { productService, categoryService } from '../../services/product.service';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useLanguage } from '../../context/LanguageContext';

export const AdminCouponForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t, language } = useLanguage();
    const [error, setError] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
    const [formErrors, setFormErrors] = useState<{ code?: string; discountValue?: string }>({});
    const [form, setForm] = useState({
        code: '',
        discountType: 0,
        discountValue: '',
        minOrderAmount: '',
        expiryDate: '',
        usageLimit: '',
    });

    const { data: coupons, isLoading: couponsLoading } = useQuery({
        queryKey: ['coupons'],
        queryFn: async () => (await couponService.getCoupons()).data,
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
        if (isEdit && coupons) {
            const coupon = coupons.find(c => c.id === Number(id));
            if (coupon) {
                setForm({
                    code: coupon.code,
                    discountType: coupon.discountType,
                    discountValue: String(coupon.discountValue),
                    minOrderAmount: coupon.minOrderAmount ? String(coupon.minOrderAmount) : '',
                    expiryDate: coupon.expiryDate
                        ? (() => {
                            const utcDate = new Date(coupon.expiryDate);
                            const localDate = new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000));
                            return localDate.toISOString().slice(0, 16);
                        })()
                        : '',
                    usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
                });
                try { setSelectedProductIds(JSON.parse(coupon.productIdsJson || '[]')); } catch { setSelectedProductIds([]); }
                try { setSelectedCategoryIds(JSON.parse(coupon.categoryIdsJson || '[]')); } catch { setSelectedCategoryIds([]); }
            }
        }
    }, [coupons, id, isEdit]);

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
        mutationFn: () => couponService.createCoupon({
            code: form.code.toUpperCase(),
            discountType: form.discountType,
            discountValue: Number(form.discountValue),
            minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
            expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined,
            usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
            productIdsJson: JSON.stringify(selectedProductIds),
            categoryIdsJson: JSON.stringify(selectedCategoryIds),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
            navigate('/admin/coupons');
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Failed to create coupon');
            setShowErrorModal(true);
        },
    });

    const updateMutation = useMutation({
        mutationFn: () => couponService.updateCoupon(Number(id), {
            code: form.code.toUpperCase(),
            discountType: form.discountType,
            discountValue: Number(form.discountValue),
            minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
            expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined,
            usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
            productIdsJson: JSON.stringify(selectedProductIds),
            categoryIdsJson: JSON.stringify(selectedCategoryIds),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
            navigate('/admin/coupons');
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Failed to update coupon');
            setShowErrorModal(true);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});

        const newErrors: { code?: string; discountValue?: string } = {};

        if (!form.code.trim()) {
            newErrors.code = 'Code is required';
        }
        if (!form.discountValue) {
            newErrors.discountValue = 'Discount value is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setFormErrors(newErrors);
            return;
        }

        if (isEdit) updateMutation.mutate();
        else createMutation.mutate();
    };

    if (couponsLoading && isEdit) return <LoadingSpinner />;

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="admin-form-page">
            <button onClick={() => navigate('/admin/coupons')} className="btn btn-outline back-btn">← {t.admin.back}</button>
            <h1>{isEdit ? t.admin.updateCoupon : t.admin.createCoupon}</h1>

            <form onSubmit={handleSubmit} className="admin-form" noValidate>
                <div className="form-group">
                    <label>{t.admin.couponCode}</label>
                    <input
                        type="text"
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                        className={formErrors.code ? 'input-error' : ''}
                    />
                    {formErrors.code && <span className="error-text">{formErrors.code}</span>}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>{t.admin.discountType}</label>
                        <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: Number(e.target.value) })}>
                            <option value={0}>{t.admin.percentage}</option>
                            <option value={1}>{t.admin.fixedAmount}</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{t.admin.discountValue}</label>
                        <input
                            type="number"
                            value={form.discountValue}
                            onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                            className={formErrors.discountValue ? 'input-error' : ''}
                        />
                        {formErrors.discountValue && <span className="error-text">{formErrors.discountValue}</span>}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>{t.admin.minOrderAmount} ({t.admin.optional})</label>
                        <input type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>{t.admin.expiryDate} ({t.admin.optional})</label>
                        <input type="datetime-local" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>{t.admin.usageLimit} ({t.admin.optional})</label>
                        <input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
                    </div>
                </div>

                <div className="form-group">
                    <label>{t.admin.specificProducts} ({t.admin.optional})</label>
                    <div className="multi-select-tags" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {products?.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => toggleProduct(p.id)}
                                className={`size-btn ${selectedProductIds.includes(p.id) ? 'active' : ''}`}
                            >
                                {p.nameTranslations?.[language] || p.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label>{t.admin.specificCategories} ({t.admin.optional})</label>
                    <div className="multi-select-tags">
                        {categories?.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => toggleCategory(c.id)}
                                className={`size-btn ${selectedCategoryIds.includes(c.id) ? 'active' : ''}`}
                            >
                                {c.nameTranslations?.[language] || c.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? '...' : isEdit ? t.admin.updateCoupon : t.admin.createCoupon}
                    </button>
                    <button type="button" onClick={() => navigate('/admin/coupons')} className="btn btn-outline">{t.admin.cancel}</button>
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