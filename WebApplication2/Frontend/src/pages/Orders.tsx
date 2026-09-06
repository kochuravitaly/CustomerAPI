import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { paymentService } from '../services/payment.service';
import { OrderStatus } from '../types/order';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

const getStatusColor = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.Pending: return 'status-pending';
        case OrderStatus.Paid: return 'status-paid';
        case OrderStatus.Shipped: return 'status-shipped';
        case OrderStatus.Delivered: return 'status-delivered';
        case OrderStatus.Canceled: return 'status-canceled';
        default: return '';
    }
};

const getStatusLabel = (status: OrderStatus, t: any) => {
    switch (status) {
        case OrderStatus.Pending: return t.orders.pending;
        case OrderStatus.Paid: return t.orders.paid;
        case OrderStatus.Shipped: return t.orders.shipped;
        case OrderStatus.Delivered: return t.orders.delivered;
        case OrderStatus.Canceled: return t.orders.canceled;
        default: return OrderStatus[status] || 'Unknown';
    }
};

export const Orders: React.FC = () => {
    const { t, language } = useLanguage();
    const { formatPrice } = useCurrency();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [reorderingId, setReorderingId] = useState<string | null>(null);

    const { data: orders, isLoading, error } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const response = await orderService.getMyOrders();
            return response.data;
        },
    });

    const handleBuyAgain = async (orderId: string) => {
        setReorderingId(orderId);
        try {
            await orderService.reorder(orderId);
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            navigate('/cart');
        } catch (err: any) {
            alert(err.response?.data || 'Failed to reorder');
            setReorderingId(null);
        }
    };

    const payOrderMutation = useMutation({
        mutationFn: async (orderId: string) => {
            const response = await paymentService.create({ orderId });
            window.location.href = response.data.paymentUrl;
        },
        onError: (err: any) => {
            alert(err.response?.data || 'Failed to create payment');
        },
    });

    const downloadInvoice = async (orderId: string) => {
        const lang = localStorage.getItem('language') || 'en';
        const token = localStorage.getItem('accessToken');
        const url = `${(import.meta as any).env?.VITE_API_URL || 'https://cheyenneshop.ru'}/api/orders/${orderId}/invoice?language=${lang}`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `invoice-${orderId.substring(0, 8)}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Invoice error:', error);
            alert('Failed to download invoice');
        }
    };

    if (isLoading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="orders-page">
                <button onClick={() => navigate(-1)} className="btn btn-outline back-btn">← {t.admin.back}</button>
                <div className="alert alert-error">Failed to load orders</div>
            </div>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="empty-orders-page">
                <button onClick={() => navigate(-1)} className="btn btn-outline back-btn">← {t.admin.back}</button>
                <div className="empty-icon">📦</div>
                <h2>{t.orders.empty}</h2>
                <Link to="/products" className="btn btn-primary">
                    {t.cart.startShopping}
                </Link>
            </div>
        );
    }

    return (
        <div className="orders-page">
            <button onClick={() => navigate(-1)} className="btn btn-outline back-btn">← {t.admin.back}</button>

            <div className="orders-list">
                {orders.map((order) => (
                    <div key={order.id} className="order-card">
                        <div className="order-header">
                            <div className="order-id">
                                <span>{t.orders.orderId}:</span>
                                <code>{order.id.substring(0, 8)}...</code>
                            </div>

                            <div className={`order-status ${getStatusColor(order.status)}`}>
                                {getStatusLabel(order.status, t)}
                            </div>
                        </div>

                        <div className="order-details">
                            <div className="order-date">
                                <span>{t.orders.placedOn}:</span>
                                <strong>{new Date(order.createdAt).toLocaleDateString()}</strong>
                            </div>

                            <div className="order-total">
                                <span>{t.cart.total}:</span>
                                <strong>{formatPrice(order.totalAmount)}</strong>
                            </div>
                        </div>

                        {order.items && order.items.length > 0 ? (
                            <div className="order-items">
                                {order.items.map((item) => (
                                    <div key={item.productId} className="order-item">
                                        <div className="order-item-info">
                                            <Link to={`/products/${item.productId}`} className="order-item-name">
                                                {item.productName}
                                            </Link>
                                            <span className="order-item-quantity" style={{ marginLeft: '8px' }}>x{item.quantity}</span>
                                        </div>
                                        <div className="order-item-total">
                                            {formatPrice(item.total)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-items">{t.admin.noItems}</div>
                        )}

                        <div className="order-actions" style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {order.status === OrderStatus.Pending && (
                                <button
                                    onClick={() => payOrderMutation.mutate(order.id)}
                                    className="btn btn-primary btn-small"
                                    disabled={payOrderMutation.isPending}
                                >
                                    {payOrderMutation.isPending ? '...' : t.orders.payNow}
                                </button>
                            )}
                            <button
                                onClick={() => handleBuyAgain(order.id)}
                                className="btn btn-outline btn-small"
                                disabled={reorderingId === order.id}
                            >
                                {reorderingId === order.id ? '...' : t.orders.buyAgain}
                            </button>
                            {(order.status === OrderStatus.Paid ||
                                order.status === OrderStatus.Shipped ||
                                order.status === OrderStatus.Delivered) && (
                                    <button
                                        onClick={() => downloadInvoice(order.id)}
                                        className="btn btn-outline btn-small"
                                    >
                                        {t.orders.downloadInvoice}
                                    </button>
                                )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};