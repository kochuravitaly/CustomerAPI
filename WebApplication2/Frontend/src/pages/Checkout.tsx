import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { paymentService } from '../services/payment.service';
import { cartService } from '../services/cart.service';
import { useLanguage } from '../context/LanguageContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Checkout: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);

    const { data: cart } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => (await cartService.getCart()).data,
    });

    const createOrderMutation = useMutation({
        mutationFn: () => orderService.create(),
        onSuccess: async (response) => {
            const order = response.data;
            createPaymentMutation.mutate(order.id);
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
            window.location.href = response.data.paymentUrl;
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Failed to create payment');
            setProcessing(false);
        },
    });

    const handlePlaceOrder = () => {
        if (!cart || cart.cartItems.length === 0) {
            setError('Cart is empty');
            return;
        }
        setProcessing(true);
        setError('');
        createOrderMutation.mutate();
    };

    if (processing) {
        return (
            <div className="checkout-page">
                <LoadingSpinner />
                <p className="processing-text">Processing...</p>
                {error && <div className="alert alert-error">{error}</div>}
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <h1>{t.cart.checkout}</h1>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="checkout-container">
                <div className="checkout-info">
                    <h2>{t.cart.orderSummary}</h2>

                    {cart && cart.cartItems.length > 0 && (
                        <div className="checkout-items">
                            {cart.cartItems.map((item) => (
                                <div key={item.productId} className="checkout-item">
                                    <span>{item.productName}</span>
                                    <span>${item.total.toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="checkout-total">
                                <strong>{t.cart.total}: ${cart.total.toFixed(2)}</strong>
                            </div>
                        </div>
                    )}

                    <div className="checkout-details">
                        <h3>What happens next?</h3>
                        <ol>
                            <li>{t.checkout.step1}</li>
                            <li>{t.checkout.step2}</li>
                            <li>{t.checkout.step3}</li>
                            <li>{t.checkout.step4}</li>
                        </ol>
                    </div>
                </div>

                <div className="checkout-actions">
                    <button
                        onClick={handlePlaceOrder}
                        className="btn btn-primary btn-large btn-block"
                        disabled={createOrderMutation.isPending || !cart || cart.cartItems.length === 0}
                    >
                        {createOrderMutation.isPending ? '...' : t.checkout.placeOrder}
                    </button>

                    <button
                        onClick={() => navigate('/cart')}
                        className="btn btn-outline btn-block"
                    >
                        {t.product.back}
                    </button>
                </div>
            </div>
        </div>
    );
};