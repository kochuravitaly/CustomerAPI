import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { OrderStatus } from '../types/order';
import { LoadingSpinner } from '../components/LoadingSpinner';

const getStatusColor = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.Pending:
            return 'status-pending';
        case OrderStatus.Paid:
            return 'status-paid';
        case OrderStatus.Shipped:
            return 'status-shipped';
        case OrderStatus.Delivered:
            return 'status-delivered';
        case OrderStatus.Canceled:
            return 'status-canceled';
        default:
            return '';
    }
};

const getStatusLabel = (status: OrderStatus) => {
    return OrderStatus[status] || 'Unknown';
};

export const Orders: React.FC = () => {
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
                <h1>My Orders</h1>
                <div className="alert alert-error">Failed to load orders</div>
            </div>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="empty-orders-page">
                <div className="empty-icon">📦</div>
                <h2>No orders yet</h2>
                <p>When you place an order, it will appear here.</p>
                <Link to="/products" className="btn btn-primary">
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="orders-page">
            <h1>My Orders</h1>

            <div className="orders-list">
                {orders.map((order) => (
                    <div key={order.id} className="order-card">
                        <div className="order-header">
                            <div className="order-id">
                                <span>Order ID:</span>
                                <code>{order.id.substring(0, 8)}...</code>
                            </div>

                            <div className={`order-status ${getStatusColor(order.status)}`}>
                                {getStatusLabel(order.status)}
                            </div>
                        </div>

                        <div className="order-details">
                            <div className="order-date">
                                <span>Placed on:</span>
                                <strong>{new Date(order.createdAt).toLocaleDateString()}</strong>
                            </div>

                            <div className="order-total">
                                <span>Total:</span>
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