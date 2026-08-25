import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../services/cart.service';
import { useLanguage } from '../context/LanguageContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Cart: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const [error, setError] = useState('');

    const { data: cart, isLoading } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const response = await cartService.getCart();
            return response.data;
        },
    });

    const updateItemMutation = useMutation({
        mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
            cartService.updateItem(productId, { quantity }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Failed');
        },
    });

    const removeItemMutation = useMutation({
        mutationFn: (productId: number) => cartService.removeItem(productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    const clearCartMutation = useMutation({
        mutationFn: () => cartService.clearCart(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    if (isLoading) return <LoadingSpinner />;

    if (!cart || cart.cartItems.length === 0) {
        return (
            <div className="empty-cart-page">
                <div className="empty-cart-icon">🛒</div>
                <h2>{t.cart.empty}</h2>
                <p>{t.cart.emptyText}</p>
                <Link to="/" className="btn btn-primary">
                    {t.cart.startShopping}
                </Link>
            </div>
        );
    }

    const handleQuantityChange = (productId: number, newQuantity: number) => {
        if (newQuantity > 0) {
            updateItemMutation.mutate({ productId, quantity: newQuantity });
        }
    };

    return (
        <div className="cart-container">
            <div className="cart-items">
                {cart.cartItems.map((item) => (
                    <div key={item.productId} className="cart-item">
                        <div className="cart-item-info">
                            <h3>{item.productName}</h3>
                            <p className="cart-item-price">${item.unitPrice.toFixed(2)} each</p>
                        </div>
                        <div className="cart-item-controls">
                            <div className="quantity-selector">
                                <button
                                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                    className="quantity-btn"
                                    disabled={item.quantity <= 1}
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    value={item.quantity}
                                    min={1}
                                    onChange={(e) => handleQuantityChange(item.productId, Number(e.target.value))}
                                    className="quantity-input"
                                />
                                <button
                                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                    className="quantity-btn"
                                >
                                    +
                                </button>
                            </div>
                            <div className="cart-item-total">${item.total.toFixed(2)}</div>
                            <button
                                onClick={() => removeItemMutation.mutate(item.productId)}
                                className="btn btn-danger btn-small"
                            >
                                {t.cart.remove}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="cart-summary">
                <h2>{t.cart.orderSummary}</h2>
                <div className="summary-row">
                    <span>{t.cart.items} ({cart.cartItems.length})</span>
                    <span>${cart.total.toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                    <span>{t.cart.total}</span>
                    <span>${cart.total.toFixed(2)}</span>
                </div>
                <button
                    onClick={() => navigate('/checkout')}
                    className="btn btn-primary btn-block"
                >
                    {t.cart.checkout}
                </button>
                <button
                    onClick={() => clearCartMutation.mutate()}
                    className="btn btn-outline btn-block"
                    style={{ marginTop: '8px' }}
                >
                    {t.cart.clear}
                </button>
            </div>
        </div>
    );
};