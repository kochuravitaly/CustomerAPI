import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const PaymentSuccess: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const orderId = searchParams.get('order_id');
        if (orderId) {
            navigate(`/order-confirmation/${orderId}`, { replace: true });
        } else {
            navigate('/orders', { replace: true });
        }
    }, [searchParams, navigate]);

    return (
        <div className="confirmation-page">
            <LoadingSpinner />
        </div>
    );
};