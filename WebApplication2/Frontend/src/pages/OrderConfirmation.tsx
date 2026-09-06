import React from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

const getStatusLabel = (status: number, t: any) => {
    switch (status) {
        case 0: return t.orders.pending;
        case 1: return t.orders.paid;
        case 2: return t.orders.shipped;
        case 3: return t.orders.delivered;
        case 4: return t.orders.canceled;
        default: return 'Unknown';
    }
};

const getStatusColor = (status: number) => {
    switch (status) {
        case 0: return 'status-pending';
        case 1: return 'status-paid';
        case 2: return 'status-shipped';
        case 3: return 'status-delivered';
        case 4: return 'status-canceled';
        default: return '';
    }
};

export const OrderConfirmation: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { formatPrice } = useCurrency();

    const urlOrderId = searchParams.get('order_id') || orderId;

    const { data: orders } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => (await orderService.getMyOrders()).data,
        enabled: !urlOrderId,
    });

    const { data: order, isLoading } = useQuery({
        queryKey: ['order', urlOrderId],
        queryFn: async () => (await orderService.getById(urlOrderId!)).data,
        enabled: !!urlOrderId,
    });

    const displayOrder = order || orders?.[0];

    if (isLoading) return <LoadingSpinner />;

    if (!displayOrder) {
        return (
            <div className="confirmation-page">
                <h1>{t.confirmation.notFound}</h1>
                <Link to="/orders" className="btn btn-primary">{t.orders.title}</Link>
            </div>
        );
    }

    return (
        <div className="confirmation-page">
            <div className="confirmation-success">
                <div className="success-icon">✅</div>
                <h1>{t.confirmation.thankYou}</h1>
                <p>{t.confirmation.orderNumber}: <strong>{displayOrder.id.substring(0, 8).toUpperCase()}</strong></p>
            </div>

            <div className="confirmation-details">
                <h2>{t.confirmation.orderDetails}</h2>

                <div className="confirmation-items">
                    {displayOrder.items.map((item) => (
                        <div key={item.productId} className="confirmation-item">
                            <span>{item.productName}</span>
                            <span>x{item.quantity}</span>
                            <span>{formatPrice(item.total)}</span>
                        </div>
                    ))}
                </div>

                <div className="confirmation-total">
                    <span>{t.cart.total}:</span>
                    <strong>{formatPrice(displayOrder.totalAmount)}</strong>
                </div>

                <div className="confirmation-status">
                    <span className={`order-status ${getStatusColor(displayOrder.status)}`}>
                        {getStatusLabel(displayOrder.status, t)}
                    </span>
                </div>
            </div>

            <div className="confirmation-actions">
                <Link to="/orders" className="btn btn-primary">{t.orders.title}</Link>
                <Link to="/" className="btn btn-outline">{t.cart.startShopping}</Link>
            </div>
        </div>
    );
};