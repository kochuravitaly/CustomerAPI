import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { paymentService } from '../services/payment.service';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Checkout: React.FC = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);

    const createOrderMutation = useMutation({
        mutationFn: () => orderService.create(),
        onSuccess: async (response) => {
            const order = response.data;
            await handlePayment(order.id);
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Failed to create order');
            setProcessing(false);
        },
    });

    const createPaymentMutation = useMutation({
        mutationFn: (orderId: string) =>
            paymentService.create({ orderId }),
        onSuccess: (response) => {
            // Redirect to payment page
            window.location.href = response.data.paymentUrl;
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Failed to create payment');
            setProcessing(false);
        },
    });

    const handlePayment = async (orderId: string) => {
        createPaymentMutation.mutate(orderId);
    };

    const handlePlaceOrder = () => {
        setProcessing(true);
        setError('');
        createOrderMutation.mutate();
    };

    if (processing) {
        return (
            <div className="checkout-page">
                <LoadingSpinner />
                <p className="processing-text">Processing your order...</p>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <h1>Checkout</h1>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="checkout-container">
                <div className="checkout-info">
                    <h2>Order Summary</h2>
                    <p>Your order will be created and you'll be redirected to payment.</p>

                    <div className="checkout-details">
                        <h3>What happens next?</h3>
                        <ol>
                            <li>Click "Place Order" to create your order</li>
                            <li>You'll be redirected to YooKassa payment page</li>
                            <li>Complete the payment</li>
                            <li>Your order will be confirmed</li>
                        </ol>
                    </div>
                </div>

                <div className="checkout-actions">
                    <button
                        onClick={handlePlaceOrder}
                        className="btn btn-primary btn-large btn-block"
                        disabled={createOrderMutation.isPending}
                    >
                        {createOrderMutation.isPending ? 'Creating Order...' : 'Place Order'}
                    </button>

                    <button
                        onClick={() => navigate('/cart')}
                        className="btn btn-outline btn-block"
                    >
                        Back to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};