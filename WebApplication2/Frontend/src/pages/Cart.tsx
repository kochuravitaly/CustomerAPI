import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../services/cart.service';
import { flashSaleService, FlashSaleResponseDto } from '../services/coupon.service';
import { orderService } from '../services/order.service';
import { paymentService } from '../services/payment.service';
import { useLanguage } from '../context/LanguageContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Cart: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const [error, setError] = useState('');
    const [appliedCoupons, setAppliedCoupons] = useState<Record<number, { code: string; discount: number }>>({});
    const [couponsLoaded, setCouponsLoaded] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [flashSales, setFlashSales] = useState<FlashSaleResponseDto[]>([]);

    const { data: cart, isLoading } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => (await cartService.getCart()).data,
    });

    useEffect(() => {
        const loadFlashSales = async () => {
            try {
                const response = await flashSaleService.getActive();
                setFlashSales(response.data);
            } catch { }
        };
        loadFlashSales();
    }, []);

    useEffect(() => {
        const loadCoupons = async () => {
            if (!cart || cart.cartItems.length === 0) {
                setCouponsLoaded(true);
                return;
            }

            const validCoupons: Record<number, { code: string; discount: number }> = {};

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('coupon_')) {
                    try {
                        const productId = Number(key.replace('coupon_', ''));
                        const parsed = JSON.parse(localStorage.getItem(key) || '{}');

                        if (parsed && parsed.code && parsed.discount) {
                            const item = cart.cartItems.find(ci => ci.productId === productId);
                            if (item) {
                                validCoupons[productId] = {
                                    code: parsed.code,
                                    discount: parsed.discount
                                };
                            } else {
                                localStorage.removeItem(key);
                            }
                        }
                    } catch {
                        localStorage.removeItem(key);
                    }
                }
            }

            setAppliedCoupons(validCoupons);
            setCouponsLoaded(true);
        };

        loadCoupons();
    }, [cart]);

    const updateItemMutation = useMutation({
        mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
            cartService.updateItem(productId, { quantity }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
        onError: (err: any) => setError(err.response?.data || 'Failed'),
    });

    const removeItemMutation = useMutation({
        mutationFn: (productId: number) => cartService.removeItem(productId),
        onSuccess: (_, productId) => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            const key = `coupon_${productId}`;
            localStorage.removeItem(key);
            setAppliedCoupons(prev => {
                const next = { ...prev };
                delete next[productId];
                return next;
            });
        },
    });

    const clearCartMutation = useMutation({
        mutationFn: () => cartService.clearCart(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('coupon_')) {
                    localStorage.removeItem(key);
                }
            }
            setAppliedCoupons({});
        },
    });

    const handleCheckout = async () => {
        setProcessing(true);
        setError('');

        try {
            const orderResponse = await orderService.create();
            const order = orderResponse.data;

            const paymentResponse = await paymentService.create({ orderId: order.id });
            const payment = paymentResponse.data;

            window.location.href = payment.paymentUrl;
        } catch (err: any) {
            setError(err.response?.data || 'Failed to process checkout');
            setProcessing(false);
        }
    };

    if (isLoading || !couponsLoaded) return <LoadingSpinner />;

    if (!cart || cart.cartItems.length === 0) {
        return (
            <div className="empty-cart-page">
                <div className="empty-cart-icon">🛒</div>
                <h2>{t.cart.empty}</h2>
                <Link to="/" className="btn btn-primary">{t.cart.startShopping}</Link>
            </div>
        );
    }

    const getFlashSaleForProduct = (productId: number, categoryId?: number) => {
        return flashSales.find(fs => {
            try {
                const productIds = JSON.parse(fs.productIdsJson || '[]') as number[];
                const categoryIds = JSON.parse(fs.categoryIdsJson || '[]') as number[];

                if (productIds.length === 0 && categoryIds.length === 0) return true;
                if (productIds.includes(productId)) return true;
                if (categoryId && categoryIds.includes(categoryId)) return true;
                return false;
            } catch { return false; }
        });
    };

    const getItemTotal = (productId: number, unitPrice: number, quantity: number) => {
        let price = unitPrice;

        const fs = getFlashSaleForProduct(productId);
        if (fs) {
            price = price * (1 - fs.discountPercentage / 100);
        }

        const coupon = appliedCoupons[productId];
        if (coupon) {
            price = Math.max(0, price - coupon.discount);
        }

        return price * quantity;
    };

    const cartTotal = cart.cartItems.reduce((sum, item) =>
        sum + getItemTotal(item.productId, item.unitPrice, item.quantity), 0);

    return (
        <div className="cart-page">
            <h1>{t.cart.title}</h1>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="cart-items">
                {cart.cartItems.map((item) => {
                    const fs = getFlashSaleForProduct(item.productId);
                    const flashPrice = fs ? item.unitPrice * (1 - fs.discountPercentage / 100) : item.unitPrice;
                    const coupon = appliedCoupons[item.productId];
                    const total = getItemTotal(item.productId, item.unitPrice, item.quantity);

                    return (
                        <div key={item.productId} className="cart-item">
                            <div className="cart-item-info">
                                <Link to={`/products/${item.productId}`} style={{ color: '#18181B', textDecoration: 'none', fontWeight: '600' }}>
                                    {item.productName}
                                </Link>
                                {fs ? (
                                    <p className="cart-item-price">
                                        <span style={{ textDecoration: 'line-through', color: '#71717A' }}>${item.unitPrice.toFixed(2)}</span>{' '}
                                        <span style={{ color: '#EF4444', fontWeight: '600' }}>${flashPrice.toFixed(2)} each (-{fs.discountPercentage}%)</span>
                                    </p>
                                ) : (
                                    <p className="cart-item-price">${item.unitPrice.toFixed(2)} each</p>
                                )}
                                {coupon && (
                                    <p style={{ color: '#10B981', fontSize: '12px' }}>
                                        Coupon {coupon.code}: -${coupon.discount.toFixed(2)}
                                    </p>
                                )}
                            </div>
                            <div className="cart-item-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="quantity-selector" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <button onClick={() => updateItemMutation.mutate({ productId: item.productId, quantity: item.quantity - 1 })} disabled={item.quantity <= 1} className="quantity-btn">−</button>
                                    <span className="quantity-display">{item.quantity}</span>
                                    <button onClick={() => updateItemMutation.mutate({ productId: item.productId, quantity: item.quantity + 1 })} className="quantity-btn">+</button>
                                </div>
                                <div className="cart-item-total">${total.toFixed(2)}</div>
                                <button onClick={() => removeItemMutation.mutate(item.productId)} className="btn btn-danger btn-small">{t.cart.remove}</button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="cart-bottom-bar">
                <div className="cart-total-display">
                    <span>{t.cart.total}:</span>
                    <strong>${cartTotal.toFixed(2)}</strong>
                </div>
                <button
                    onClick={handleCheckout}
                    className="btn btn-primary btn-large"
                    disabled={processing}
                >
                    {processing ? 'Processing...' : t.cart.checkout}
                </button>
                <button onClick={() => clearCartMutation.mutate()} className="btn btn-outline">{t.cart.clear}</button>
            </div>
        </div>
    );
};