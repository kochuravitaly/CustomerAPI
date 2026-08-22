import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../services/cart.service';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Cart: React.FC = () => {
    const navigate = useNavigate();
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
            setError(err.response?.data || 'Failed to update item');
        },
    });

    const removeItemMutation = useMutation({
        mutationFn: (productId: number) => cartService.removeItem(productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Failed to remove item');
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
                <h2>Your cart is empty</h2>
                <p>Looks like you haven't added anything to your cart yet.</p>
                <Link to="/products" className="btn btn-primary">
                    Start Shopping
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
        <div className="cart-page">
            <h1>Shopping Cart</h1>

            {error && <div className="alert alert-error">{error}</div>}

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
                                        -
                                    </button>
                                    <span className="quantity-display">{item.quantity}</span>
                                    <button
                                        onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                        className="quantity-btn"
                                    >
                                        +
                                    </button>
                                </div>

                                <div className="cart-item-total">
                                    ${item.total.toFixed(2)}
                                </div>

                                <button
                                    onClick={() => removeItemMutation.mutate(item.productId)}
                                    className="btn btn-danger btn-small"
                                    disabled={removeItemMutation.isPending}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="cart-summary">
                    <h2>Order Summary</h2>

                    <div className="summary-row">
                        <span>Items ({cart.cartItems.length})</span>
                        <span>${cart.total.toFixed(2)}</span>
                    </div>

                    <div className="summary-row total">
                        <span>Total</span>
                        <span>${cart.total.toFixed(2)}</span>
                    </div>

                    <button
                        onClick={() => navigate('/checkout')}
                        className="btn btn-primary btn-block btn-large"
                    >
                        Proceed to Checkout
                    </button>

                    <button
                        onClick={() => clearCartMutation.mutate()}
                        className="btn btn-outline btn-block"
                        disabled={clearCartMutation.isPending}
                    >
                        Clear Cart
                    </button>
                </div>
            </div>
        </div>
    );
};