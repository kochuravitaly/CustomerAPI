import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { OrderStatus } from '../types/order';
import { useLanguage } from '../context/LanguageContext';
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
    const { t } = useLanguage();
    const navigate = useNavigate();

    const { data: orders, isLoading, error } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const response = await orderService.getMyOrders();
            return response.data;
        },
    });

    if (isLoading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="orders-page">
                <button onClick={() => navigate(-1)} className="btn btn-outline back-btn">← {t.admin.back}</button>
                <h1>{t.orders.title}</h1>
                <div className="alert alert-error">{t.common.error}</div>
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
            <h1>{t.orders.title}</h1>

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
                                <strong>${order.totalAmount.toFixed(2)}</strong>
                            </div>
                        </div>

                        <div className="order-items">
                            {order.items.map((item) => (
                                <div key={item.productId} className="order-item">
                                    <div className="order-item-info">
                                        <span className="order-item-name">{item.productName}</span>
                                        <span className="order-item-quantity">x{item.quantity}</span>
                                    </div>
                                    <div className="order-item-total">
                                        ${item.total.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};