import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponService, CouponResponseDto } from '../../services/coupon.service';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const AdminCoupons: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        code: '',
        discountType: 0,
        discountValue: '',
        minOrderAmount: '',
        expiryDate: '',
        usageLimit: '',
    });

    const { data: coupons, isLoading } = useQuery({
        queryKey: ['coupons'],
        queryFn: async () => (await couponService.getCoupons()).data,
    });

    const createMutation = useMutation({
        mutationFn: () => couponService.createCoupon({
            code: form.code,
            discountType: form.discountType,
            discountValue: Number(form.discountValue),
            minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
            expiryDate: form.expiryDate || undefined,
            usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
            setForm({ code: '', discountType: 0, discountValue: '', minOrderAmount: '', expiryDate: '', usageLimit: '' });
        },
        onError: (err: any) => setError(err.response?.data || 'Failed'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => couponService.deleteCoupon(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate();
    };

    return (
        <div className="admin-coupons">
            <button onClick={() => navigate('/admin')} className="btn btn-outline back-btn">← Back</button>
            <h1>Coupons</h1>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="admin-form">
                <div className="form-row">
                    <div className="form-group">
                        <label>Code</label>
                        <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Discount Type</label>
                        <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: Number(e.target.value) })}>
                            <option value={0}>Percentage (%)</option>
                            <option value={1}>Fixed Amount ($)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Discount Value</label>
                        <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} required />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Min Order Amount</label>
                        <input type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Expiry Date</label>
                        <input type="datetime-local" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>Usage Limit</label>
                        <input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
                    </div>
                </div>
                <button type="submit" className="btn btn-primary">Create Coupon</button>
            </form>

            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <div className="attribute-list">
                    {coupons?.map((coupon: CouponResponseDto) => (
                        <div key={coupon.id} className="attribute-item">
                            <div>
                                <strong>{coupon.code}</strong>
                                <span style={{ marginLeft: 8 }}>
                                    {coupon.discountType === 0 ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}
                                </span>
                                <span style={{ marginLeft: 8, fontSize: 12, color: '#71717A' }}>
                                    Used: {coupon.timesUsed}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}
                                </span>
                            </div>
                            <button onClick={() => deleteMutation.mutate(coupon.id)} className="btn btn-danger btn-small">Delete</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};