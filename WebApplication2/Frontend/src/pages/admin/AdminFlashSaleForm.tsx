import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { flashSaleService } from '../../services/coupon.service';
import { productService, categoryService } from '../../services/product.service';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AdminFlashSaleForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [error, setError] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
    const [form, setForm] = useState({
        discountPercentage: '',
        startsAt: '',
        endsAt: '',
    });

    const { data: flashSales } = useQuery({
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
        if (!form.discountPercentage || !form.startsAt || !form.endsAt) return;
        if (isEdit) updateMutation.mutate();
        else createMutation.mutate();
    };

    return (
        <div className="admin-form-page">
            <button onClick={() => navigate('/admin/flash-sale')} className="btn btn-outline back-btn">← Back</button>
            <h1>{isEdit ? 'Edit Flash Sale' : 'Add New Flash Sale'}</h1>

            <form onSubmit={handleSubmit} className="admin-form">
                <div className="form-group">
                    <label>Discount Percentage</label>
                    <input type="number" min="1" max="99" value={form.discountPercentage} onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })} required />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Starts At</label>
                        <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Ends At</label>
                        <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} required />
                    </div>
                </div>

                <div className="form-group">
                    <label>Specific Products (optional)</label>
                    <p style={{ fontSize: '12px', color: '#71717A', marginTop: '-4px', marginBottom: '8px' }}>Empty = all products</p>
                    <div className="multi-select-tags" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {products?.map((p) => (
                            <button key={p.id} type="button" onClick={() => toggleProduct(p.id)} className={`size-btn ${selectedProductIds.includes(p.id) ? 'active' : ''}`}>
                                {p.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label>Specific Categories (optional)</label>
                    <p style={{ fontSize: '12px', color: '#71717A', marginTop: '-4px', marginBottom: '8px' }}>Empty = all categories</p>
                    <div className="multi-select-tags">
                        {categories?.map((c) => (
                            <button key={c.id} type="button" onClick={() => toggleCategory(c.id)} className={`size-btn ${selectedCategoryIds.includes(c.id) ? 'active' : ''}`}>
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                        {isEdit ? 'Update Flash Sale' : 'Create Flash Sale'}
                    </button>
                    <button type="button" onClick={() => navigate('/admin/flash-sale')} className="btn btn-outline">Cancel</button>
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