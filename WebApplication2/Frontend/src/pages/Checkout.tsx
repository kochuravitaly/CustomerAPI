import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { paymentService } from '../services/payment.service';
import { cartService } from '../services/cart.service';
import { productService } from '../services/product.service';
import { variantService } from '../services/variant.service';
import { flashSaleService, FlashSaleResponseDto } from '../services/coupon.service';
import { profileService } from '../services/profile.service';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { VisaLogo, MastercardLogo, MirLogo, YooMoneyLogo } from '../components/payment/PaymentLogos';
import { AddressDto } from '../types/address';

interface DirectBuyState {
    productId: number;
    quantity: number;
    colorId?: number;
    sizeName?: string;
}

export const Checkout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, language } = useLanguage();
    const { formatPrice } = useCurrency();
    const [error, setError] = useState('');
    const [paymentError, setPaymentError] = useState('');
    const [processing, setProcessing] = useState(false);
    const [flashSales, setFlashSales] = useState<FlashSaleResponseDto[]>([]);
    const [appliedCoupons, setAppliedCoupons] = useState<Record<number, { code: string; discount: number; expiryDate?: string }>>({});
    const [paymentMethod, setPaymentMethod] = useState<string | null>(() => {
        return sessionStorage.getItem('selectedPaymentMethod');
    });
    const [directBuy, setDirectBuy] = useState<DirectBuyState | undefined>(() => {
        const saved = sessionStorage.getItem('directBuy');
        return saved ? JSON.parse(saved) : undefined;
    });
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(() => {
        const saved = sessionStorage.getItem('selectedAddressId');
        return saved ? Number(saved) : null;
    });

    const { data: cart, isLoading } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => (await cartService.getCart()).data,
        enabled: !directBuy,
    });

    const { data: directProduct } = useQuery({
        queryKey: ['direct-product', directBuy?.productId],
        queryFn: async () => (await productService.getById(directBuy!.productId)).data,
        enabled: !!directBuy,
    });

    const { data: colorInfo } = useQuery({
        queryKey: ['color-info', directBuy?.productId, directBuy?.colorId],
        queryFn: async () => {
            if (!directBuy?.colorId) return null;
            const response = await variantService.getColors(directBuy.productId);
            return response.data.find(c => c.id === directBuy.colorId) || null;
        },
        enabled: !!directBuy?.colorId,
    });

    const { data: addresses } = useQuery({
        queryKey: ['addresses'],
        queryFn: async () => (await profileService.getAddresses()).data,
    });

    const selectedAddress = addresses?.find(a => a.id === selectedAddressId) ||
        addresses?.find(a => a.isDefault) ||
        addresses?.[0];

    useEffect(() => {
        if (location.state?.directBuy) {
            setDirectBuy(location.state.directBuy);
            sessionStorage.setItem('directBuy', JSON.stringify(location.state.directBuy));
        }
        if (location.state?.selectedPaymentMethod) {
            setPaymentMethod(location.state.selectedPaymentMethod);
            sessionStorage.setItem('selectedPaymentMethod', location.state.selectedPaymentMethod);
            setPaymentError('');
        }
    }, [location.state]);

    useEffect(() => {
        const loadFlashSales = async () => {
            try {
                const response = await flashSaleService.getActive();
                setFlashSales(response.data);
            } catch { }
        };
        loadFlashSales();

        const checkExpiredFlashSales = setInterval(() => {
            setFlashSales(prev => {
                const now = new Date().getTime();
                return prev.filter(fs => new Date(fs.endsAt).getTime() > now);
            });
        }, 1000);

        return () => clearInterval(checkExpiredFlashSales);
    }, []);

    useEffect(() => {
        const loadCoupons = () => {
            const coupons: Record<number, { code: string; discount: number; expiryDate?: string }> = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('coupon_')) {
                    try {
                        const productId = Number(key.replace('coupon_', ''));
                        const parsed = JSON.parse(localStorage.getItem(key) || '{}');
                        if (parsed && parsed.code && parsed.discount) {
                            coupons[productId] = {
                                code: parsed.code,
                                discount: parsed.discount,
                                expiryDate: parsed.expiryDate,
                            };
                        }
                    } catch { }
                }
            }
            setAppliedCoupons(coupons);
        };
        loadCoupons();

        const checkExpiredCoupons = setInterval(() => {
            const now = new Date().getTime();
            setAppliedCoupons(prev => {
                const validCoupons: Record<number, { code: string; discount: number; expiryDate?: string }> = {};
                for (const [productId, coupon] of Object.entries(prev)) {
                    if (!coupon.expiryDate || new Date(coupon.expiryDate).getTime() > now) {
                        validCoupons[Number(productId)] = coupon;
                    } else {
                        localStorage.removeItem(`coupon_${productId}`);
                    }
                }
                return validCoupons;
            });
        }, 1000);

        return () => clearInterval(checkExpiredCoupons);
    }, []);

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
        if (fs) price = price * (1 - fs.discountPercentage / 100);
        const coupon = appliedCoupons[productId];
        if (coupon) price = Math.max(0, price - coupon.discount);
        return price * quantity;
    };

    const getAppliedCoupons = () => {
        const coupons: { code: string; productId: number }[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('coupon_')) {
                try {
                    const productId = Number(key.replace('coupon_', ''));
                    const parsed = JSON.parse(localStorage.getItem(key) || '{}');
                    if (parsed && parsed.code) {
                        coupons.push({ code: parsed.code, productId });
                    }
                } catch { }
            }
        }
        return coupons;
    };

    const createOrderMutation = useMutation({
        mutationFn: () => {
            if (directBuy) {
                return orderService.createDirect(directBuy);
            }
            const coupons = getAppliedCoupons();
            return orderService.create(coupons);
        },
        onSuccess: async (response) => {
            sessionStorage.removeItem('directBuy');
            sessionStorage.removeItem('selectedPaymentMethod');
            sessionStorage.removeItem('selectedAddressId');
            createPaymentMutation.mutate(response.data.id);
        },
        onError: (err: any) => {
            const errorMessage = err.response?.data?.error || err.response?.data || 'Failed to create order';
            setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
            setProcessing(false);
        },
    });

    const createPaymentMutation = useMutation({
        mutationFn: (orderId: string) => paymentService.create({ orderId, paymentMethod: paymentMethod || 'bank_card' }),
        onSuccess: (response) => {
            window.location.href = response.data.paymentUrl;
        },
        onError: (err: any) => {
            const errorMessage = err.response?.data?.error || err.response?.data || 'Failed to create payment';
            setError(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
            setProcessing(false);
        },
    });

    const handlePlaceOrder = () => {
        if (!selectedAddress) {
            setError(t.checkout.noAddresses);
            return;
        }
        if (!paymentMethod) {
            setPaymentError(t.checkout.choosePaymentMethod);
            return;
        }
        if (directBuy) {
            if (!directProduct) {
                setError(t.common.error);
                return;
            }
        } else if (!cart || cart.cartItems.length === 0) {
            setError(t.cart.empty);
            return;
        }
        setProcessing(true);
        setError('');
        setPaymentError('');
        createOrderMutation.mutate();
    };

    if (isLoading) return <LoadingSpinner />;

    if (!directBuy && (!cart || cart.cartItems.length === 0)) {
        return (
            <div className="checkout-page">
                <button onClick={() => navigate('/cart')} className="btn btn-outline back-btn">← {t.admin.back}</button>
                <div className="empty-cart-page">
                    <div className="empty-cart-icon">🛒</div>
                    <h2>{t.cart.empty}</h2>
                    <button onClick={() => navigate('/')} className="btn btn-primary">{t.cart.startShopping}</button>
                </div>
            </div>
        );
    }

    if (processing) {
        return (
            <div className="checkout-page">
                <LoadingSpinner />
                <p className="processing-text">{t.checkout.processing}</p>
                {error && <div className="alert alert-error">{error}</div>}
            </div>
        );
    }

    const items = directBuy && directProduct
        ? [{
            productId: directProduct.id,
            productName: directProduct.nameTranslations?.[language] || directProduct.name,
            productNameTranslations: directProduct.nameTranslations,
            unitPrice: directProduct.price,
            quantity: directBuy.quantity,
            total: getItemTotal(directProduct.id, directProduct.price, directBuy.quantity),
            mainImageId: directProduct.images.find(i => i.isMain)?.id || directProduct.images[0]?.id,
            colorId: directBuy.colorId,
            colorName: colorInfo?.nameTranslations?.[language] || colorInfo?.name,
            colorHexCode: colorInfo?.hexCode,
            sizeName: directBuy.sizeName,
        }]
        : cart?.cartItems.map(item => ({
            ...item,
            total: getItemTotal(item.productId, item.unitPrice, item.quantity),
        })) || [];

    const cartTotal = items.reduce((sum, item) => sum + item.total, 0);

    return (
        <div className="checkout-page">
            <button onClick={() => {
                if (directBuy) {
                    sessionStorage.removeItem('directBuy');
                    sessionStorage.removeItem('selectedPaymentMethod');
                    sessionStorage.removeItem('selectedAddressId');
                    window.history.go(-2);
                } else {
                    navigate('/cart');
                }
            }} className="btn btn-outline back-btn">
                ← {t.admin.back}
            </button>

            <h1>{t.checkout.title}</h1>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="checkout-container">
                <div className="checkout-items-section">
                    <h2>{t.cart.orderSummary}</h2>

                    <div className="checkout-items-list">
                        {items.map((item: any) => {
                            const productName = item.productNameTranslations?.[language] || item.productName;
                            const fs = getFlashSaleForProduct(item.productId);
                            const coupon = appliedCoupons[item.productId];
                            const total = getItemTotal(item.productId, item.unitPrice, item.quantity);
                            const finalUnitPrice = total / item.quantity;
                            const hasDiscount = fs || coupon;

                            return (
                                <div key={`${item.productId}-${item.colorId || 'default'}-${item.sizeName || 'default'}`} className="checkout-item-row">
                                    {item.mainImageId && (
                                        <img
                                            src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${item.productId}/images/${item.mainImageId}`}
                                            alt={productName}
                                            style={{
                                                width: '60px',
                                                height: '60px',
                                                objectFit: 'contain',
                                                borderRadius: '12px',
                                                flexShrink: 0,
                                            }}
                                        />
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <div className="checkout-item-name">{productName}</div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                                            {item.colorHexCode && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        width: '14px',
                                                        height: '14px',
                                                        borderRadius: '50%',
                                                        backgroundColor: item.colorHexCode,
                                                        border: '1px solid var(--border-color)',
                                                    }} />
                                                    {item.colorName && (
                                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                            {item.colorName}
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                            {item.sizeName && (
                                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                    {t.product.size}: {item.sizeName}
                                                </span>
                                            )}
                                        </div>

                                        {fs && (
                                            <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '2px' }}>
                                                ⚡ Flash Sale -{fs.discountPercentage}%
                                            </div>
                                        )}

                                        {coupon && (
                                            <div style={{ color: '#10B981', fontSize: '12px', marginTop: '2px' }}>
                                                Coupon {coupon.code}: -{formatPrice(coupon.discount)}
                                            </div>
                                        )}

                                        <div style={{ marginTop: '2px' }}>
                                            {hasDiscount ? (
                                                <>
                                                    <span style={{ textDecoration: 'line-through', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                                                        {formatPrice(item.unitPrice)}
                                                    </span>
                                                    <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, marginLeft: '8px' }}>
                                                        {formatPrice(finalUnitPrice)} × {item.quantity} = {formatPrice(total)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>
                                                    {formatPrice(item.unitPrice)} × {item.quantity} = {formatPrice(total)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="checkout-total-row">
                        <span>{t.cart.total}:</span>
                        <strong>{formatPrice(cartTotal)}</strong>
                    </div>
                </div>

                {selectedAddress ? (
                    <div className="checkout-address-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h2 style={{ margin: 0 }}>{t.checkout.shippingAddress}</h2>
                            <button
                                onClick={() => setShowAddressModal(true)}
                                className="btn btn-outline"
                                style={{ fontSize: '13px', padding: '8px 16px' }}
                            >
                                {t.checkout.change}
                            </button>
                        </div>
                        <div className="address-display">
                            <div style={{ fontWeight: 700, fontSize: '14px' }}>{selectedAddress.fullName}</div>
                            <div style={{ fontSize: '13px' }}>{selectedAddress.street}</div>
                            <div style={{ fontSize: '13px' }}>{selectedAddress.city}, {selectedAddress.region} {selectedAddress.postalCode}</div>
                            <div style={{ fontSize: '13px' }}>{selectedAddress.country}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t.checkout.phone}: {selectedAddress.phone}</div>
                        </div>
                    </div>
                ) : (
                    <div className="checkout-address-section">
                        <h2>{t.checkout.shippingAddress}</h2>
                        <p className="no-addresses">{t.checkout.noAddresses}</p>
                        <button
                            onClick={() => navigate('/profile', { state: { openSettings: true, returnToCheckout: true } })}
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '8px' }}
                        >
                            + {t.checkout.addAddress}
                        </button>
                    </div>
                )}

                <div className="checkout-payment-section">
                    <h2>{t.checkout.paymentMethod}</h2>

                    {!paymentMethod ? (
                        <div className="payment-all-logos-row">
                            <div className="payment-logos-container">
                                <VisaLogo />
                                <MastercardLogo />
                                <MirLogo />
                                <YooMoneyLogo />
                            </div>
                            <button
                                onClick={() => navigate('/checkout/payment')}
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                            >
                                {t.checkout.choose}
                            </button>
                        </div>
                    ) : (
                        <div className="payment-selected-row" style={{ position: 'relative' }}>
                            {paymentMethod === 'bank_card' ? (
                                <>
                                    <div className="payment-logos-container">
                                        <VisaLogo />
                                        <MastercardLogo />
                                        <MirLogo />
                                    </div>
                                    <span>{t.checkout.bankCard}</span>
                                </>
                            ) : (
                                <>
                                    <div className="payment-logos-container">
                                        <YooMoneyLogo />
                                    </div>
                                    <span>YooMoney</span>
                                </>
                            )}
                            <button
                                onClick={() => navigate('/checkout/payment', {
                                    state: { selectedMethod: paymentMethod }
                                })}
                                className="payment-edit-btn"
                                style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '8px',
                                }}
                            >
                                ✏️
                            </button>
                        </div>
                    )}

                    {paymentError && (
                        <div className="alert alert-error" style={{ marginTop: '8px' }}>
                            {paymentError}
                        </div>
                    )}

                    {paymentMethod && (
                        <div className="payment-security-note" style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            🔒 {t.checkout.securePayment}
                            <br />
                            {t.checkout.redirectNote}
                        </div>
                    )}
                </div>

                <div className="checkout-actions">
                    <button
                        onClick={handlePlaceOrder}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '10px 20px', fontSize: '14px', fontWeight: 600 }}
                        disabled={createOrderMutation.isPending}
                    >
                        {createOrderMutation.isPending ? t.checkout.processing : t.checkout.placeOrder}
                    </button>

                    <p className="checkout-terms">
                        {t.checkout.terms}
                    </p>
                    <div className="checkout-links">
                        <Link to="/contact">{t.checkout.contact}</Link>
                        <Link to="/returns">{t.checkout.returns}</Link>
                    </div>
                </div>
            </div>

            {showAddressModal && (
                <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '500px', maxHeight: '70vh', overflowY: 'auto' }}>
                        <button
                            type="button"
                            onClick={() => setShowAddressModal(false)}
                            style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background: 'none',
                                border: 'none',
                                fontSize: '20px',
                                cursor: 'pointer',
                                color: 'var(--text-tertiary)',
                                zIndex: 10,
                            }}
                        >
                            ✕
                        </button>
                        <h3>{t.checkout.selectAddress}</h3>

                        <div className="address-list" style={{ marginTop: '16px' }}>
                            {addresses?.map((address) => (
                                <div
                                    key={address.id}
                                    className="address-card"
                                    onClick={() => {
                                        setSelectedAddressId(address.id);
                                        sessionStorage.setItem('selectedAddressId', String(address.id));
                                        setShowAddressModal(false);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="address-name">
                                        {address.fullName}
                                        {address.isDefault && <span className="default-badge">{t.profile.default}</span>}
                                    </div>
                                    <div className="address-details">{address.street}</div>
                                    <div className="address-details">{address.city}, {address.region} {address.postalCode}</div>
                                    <div className="address-details">{address.country}</div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                setShowAddressModal(false);
                                navigate('/profile', { state: { openSettings: true, returnToCheckout: true } });
                            }}
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '16px' }}
                        >
                            + {t.checkout.addNewAddress}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};