import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flashSaleService, FlashSaleResponseDto } from '../../services/coupon.service';
import { productService } from '../../services/product.service';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AdminFlashSale: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        productId: '',
        discountPercentage: '',
        startsAt: '',
        endsAt: '',
    });

    const { data: flashSales, isLoading } = useQuery({
        queryKey: ['flash-sales'],
        queryFn: async () => (await flashSaleService.getAll()).data,
    });

    const { data: products } = useQuery({
        queryKey: ['products-list'],
        queryFn: async () => {
            const response = await productService.getAll({ page: 1, pageSize: 100 });
            return response.data.items;
        },
    });

    const createMutation = useMutation({
        mutationFn: () => flashSaleService.create({
            productId: Number(form.productId),
            discountPercentage: Number(form.discountPercentage),
            startsAt: new Date(form.startsAt).toISOString(),
            endsAt: new Date(form.endsAt).toISOString(),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
            setForm({ productId: '', discountPercentage: '', startsAt: '', endsAt: '' });
        },
        onError: (err: any) => setError(err.response?.data || 'Failed'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => flashSaleService.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flash-sales'] }),
    });

    return (
        <div className="admin-flash-sale">
            <button onClick={() => navigate('/admin')} className="btn btn-outline back-btn">← Back</button>
            <h1>Flash Sale</h1>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="admin-form">
                <div className="form-row">
                    <div className="form-group">
                        <label>Product</label>
                        <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
                            <option value="">Select product</option>
                            {products?.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Discount %</label>
                        <input type="number" value={form.discountPercentage} onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })} required />
                    </div>
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
                <button type="submit" className="btn btn-primary">Create Flash Sale</button>
            </form>

            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <div className="attribute-list">
                    {flashSales?.map((fs: FlashSaleResponseDto) => (
                        <div key={fs.id} className="attribute-item">
                            <div>
                                <strong>{fs.productName}</strong>
                                <span style={{ marginLeft: 8 }}>-{fs.discountPercentage}%</span>
                                <span style={{ marginLeft: 8, fontSize: 12, color: '#71717A' }}>
                                    Ends: {new Date(fs.endsAt).toLocaleString()}
                                </span>
                            </div>
                            <button onClick={() => deleteMutation.mutate(fs.id)} className="btn btn-danger btn-small">Delete</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};