import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../services/cart.service';
import { flashSaleService, FlashSaleResponseDto } from '../services/coupon.service';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Cart: React.FC = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const { formatPrice } = useCurrency();
    const queryClient = useQueryClient();
    const [error, setError] = useState('');
    const [appliedCoupons, setAppliedCoupons] = useState<Record<number, { code: string; discount: number }>>({});
    const [couponsLoaded, setCouponsLoaded] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [flashSales, setFlashSales] = useState<FlashSaleResponseDto[]>([]);
    const [timeLefts, setTimeLefts] = useState<Record<number, string>>({});

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
        const updateTimers = () => {
            const newTimeLefts: Record<number, string> = {};
            flashSales.forEach(fs => {
                const now = new Date().getTime();
                const end = new Date(fs.endsAt).getTime();
                const diff = end - now;

                if (diff <= 0) {
                    newTimeLefts[fs.id] = 'Ended';
                } else {
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    newTimeLefts[fs.id] = `${hours}h ${minutes}m ${seconds}s`;
                }
            });
            setTimeLefts(newTimeLefts);
        };

        updateTimers();
        const interval = setInterval(updateTimers, 1000);
        return () => clearInterval(interval);
    }, [flashSales]);

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
        onError: (err: any) => setError(err.response?.data || 'Failed to update item'),
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
        onError: (err: any) => setError(err.response?.data || 'Failed to remove item'),
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
        onError: (err: any) => setError(err.response?.data || 'Failed to clear cart'),
    });

    const handleCheckout = () => {
        navigate('/checkout');
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

    const getFlashSaleForProduct = (productId: number) => {
        return flashSales.find(fs => {
            try {
                const productIds = JSON.parse(fs.productIdsJson || '[]') as number[];
                const categoryIds = JSON.parse(fs.categoryIdsJson || '[]') as number[];
                if (productIds.length > 0) return productIds.includes(productId);
                if (categoryIds.length > 0) return true;
                return true;
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
            <Link to="/" className="profile-logo">CheyenneShop</Link>
            <h1>{t.cart.title}</h1>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="cart-items">
                {cart.cartItems.map((item) => {
                    const fs = getFlashSaleForProduct(item.productId);
                    const flashPrice = fs ? item.unitPrice * (1 - fs.discountPercentage / 100) : item.unitPrice;
                    const coupon = appliedCoupons[item.productId];
                    const total = getItemTotal(item.productId, item.unitPrice, item.quantity);
                    const productName = item.productNameTranslations?.[language] || item.productName;

                    return (
                        <div key={item.productId} className="cart-item" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {item.mainImageId && (
                                <Link to={`/products/${item.productId}`} style={{ flexShrink: 0 }}>
                                    <img
                                        src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${item.productId}/images/${item.mainImageId}`}
                                        alt={productName}
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            objectFit: 'contain',
                                            borderRadius: '12px',
                                        }}
                                    />
                                </Link>
                            )}
                            <div className="cart-item-info" style={{ flex: 1 }}>
                                <Link to={`/products/${item.productId}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '600' }}>
                                    {productName}
                                </Link>
                                {item.colorName && (
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                        {t.product.color}: {item.colorName}
                                    </div>
                                )}
                                {item.sizeName && (
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                        {t.product.size}: {item.sizeName}
                                    </div>
                                )}
                                {fs ? (
                                    <p className="cart-item-price">
                                        <span style={{ textDecoration: 'line-through', color: 'var(--text-tertiary)' }}>{formatPrice(item.unitPrice)}</span>{' '}
                                        <span style={{ color: '#EF4444', fontWeight: '600' }}>{formatPrice(flashPrice)} each (-{fs.discountPercentage}%)</span>
                                    </p>
                                ) : (
                                    <p className="cart-item-price">{formatPrice(item.unitPrice)} each</p>
                                )}
                                {fs && (
                                    <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '2px' }}>
                                        ⚡ Flash Sale -{fs.discountPercentage}% · {timeLefts[fs.id] || '...'}
                                    </p>
                                )}
                                {coupon && (
                                    <p style={{ color: '#10B981', fontSize: '12px', marginTop: '2px' }}>
                                        Coupon {coupon.code}: -{formatPrice(coupon.discount)}
                                    </p>
                                )}
                            </div>
                            <div className="cart-item-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="quantity-selector" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <button
                                        onClick={() => updateItemMutation.mutate({ productId: item.productId, quantity: item.quantity - 1 })}
                                        disabled={item.quantity <= 1 || updateItemMutation.isPending}
                                        className="quantity-btn"
                                    >
                                        −
                                    </button>
                                    <span className="quantity-display">{item.quantity}</span>
                                    <button
                                        onClick={() => updateItemMutation.mutate({ productId: item.productId, quantity: item.quantity + 1 })}
                                        disabled={updateItemMutation.isPending}
                                        className="quantity-btn"
                                    >
                                        +
                                    </button>
                                </div>
                                <div className="cart-item-total">{formatPrice(total)}</div>
                                <button
                                    onClick={() => removeItemMutation.mutate(item.productId)}
                                    disabled={removeItemMutation.isPending}
                                    className="btn btn-danger btn-small"
                                >
                                    {t.cart.remove}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="cart-bottom-bar">
                <div className="cart-total-display">
                    <span>{t.cart.total}:</span>
                    <strong>{formatPrice(cartTotal)}</strong>
                </div>
                <button
                    onClick={handleCheckout}
                    className="btn btn-primary btn-large"
                    disabled={processing}
                >
                    {t.cart.checkout}
                </button>
                <button
                    onClick={() => clearCartMutation.mutate()}
                    disabled={clearCartMutation.isPending}
                    className="btn btn-outline"
                >
                    {t.cart.clear}
                </button>
            </div>
        </div>
    );
};