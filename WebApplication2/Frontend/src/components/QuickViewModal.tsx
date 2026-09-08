import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductResponseDto } from '../types/product';
import { cartService } from '../services/cart.service';
import { variantService, ProductColorDto } from '../services/variant.service';
import { flashSaleService, FlashSaleResponseDto } from '../services/coupon.service';
import { wishlistService } from '../services/wishlist.service';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';

interface QuickViewModalProps {
    product: ProductResponseDto;
    onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose }) => {
    const { t, language } = useLanguage();
    const { formatPrice } = useCurrency();
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const touchStartX = useRef<number | null>(null);

    const [quantity, setQuantity] = useState(1);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
    const [selectedSizeName, setSelectedSizeName] = useState<string | null>(null);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [flashSale, setFlashSale] = useState<FlashSaleResponseDto | null>(null);
    const [couponDiscount, setCouponDiscount] = useState<number | null>(null);
    const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);

    const mainImage = product.images.find(img => img.isMain) || product.images[0];

    const { data: colors } = useQuery({
        queryKey: ['quick-view-colors', product.id],
        queryFn: async () => (await variantService.getColors(product.id)).data,
        enabled: !!product.id,
    });

    const { data: variants } = useQuery({
        queryKey: ['quick-view-variants', product.id],
        queryFn: async () => (await variantService.getVariants(product.id)).data,
        enabled: !!product.id,
    });

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        if (colors && colors.length > 0 && selectedColorId === null) {
            setSelectedColorId(colors[0].id);
        }
    }, [colors, selectedColorId]);

    useEffect(() => {
        if (selectedColorId && variants) {
            const sizesForColor = variants.filter(v => v.colorId === selectedColorId).map(v => v.sizeName);
            if (sizesForColor.length > 0 && !sizesForColor.includes(selectedSizeName || '')) {
                setSelectedSizeName(sizesForColor[0]);
            }
        }
    }, [selectedColorId, variants]);

    useEffect(() => {
        const checkWishlist = async () => {
            if (!isAuthenticated) return;
            try {
                const response = await wishlistService.isInWishlist(product.id);
                setIsInWishlist(response.data);
            } catch { }
        };
        checkWishlist();
    }, [product.id, isAuthenticated]);

    useEffect(() => {
        const loadFlashSale = async () => {
            try {
                const response = await flashSaleService.getActive();
                const flashSales = response.data;
                const matching = flashSales.find(fs => {
                    try {
                        const productIds = JSON.parse(fs.productIdsJson || '[]') as number[];
                        if (productIds.length > 0) return productIds.includes(product.id);
                        return true;
                    } catch { return false; }
                });
                setFlashSale(matching || null);
            } catch { }
        };
        loadFlashSale();
    }, [product.id]);

    useEffect(() => {
        const savedCoupon = localStorage.getItem(`coupon_${product.id}`);
        if (savedCoupon) {
            try {
                const parsed = JSON.parse(savedCoupon);
                if (parsed && typeof parsed.discount === 'number') {
                    setCouponDiscount(parsed.discount);
                }
            } catch { }
        }
    }, [product.id]);

    const addToCartMutation = useMutation({
        mutationFn: () => cartService.addItem({
            productId: product.id,
            quantity,
            colorId: selectedColorId || undefined,
            sizeName: selectedSizeName || undefined,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            alert(t.product.added);
            onClose();
        },
    });

    const toggleWishlist = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        try {
            if (isInWishlist) {
                await wishlistService.removeFromWishlist(product.id);
                setIsInWishlist(false);
            } else {
                await wishlistService.addToWishlist(product.id);
                setIsInWishlist(true);
            }
            queryClient.invalidateQueries({ queryKey: ['wishlist-count'] });
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
        } catch { }
    };

    const productName = product.nameTranslations?.[language] || product.name;

    const imagesForSelectedColor = selectedColorId
        ? product.images.filter(img => img.colorId === selectedColorId || img.colorId === null || img.colorId === undefined)
        : product.images;
    const displayImages = imagesForSelectedColor.length > 0 ? imagesForSelectedColor : product.images;
    const safeImageIndex = selectedImageIndex < displayImages.length ? selectedImageIndex : 0;
    const displayImage = displayImages[safeImageIndex] || mainImage;

    const sizesForSelectedColor = selectedColorId && variants
        ? variants.filter(v => v.colorId === selectedColorId).map(v => v.sizeName)
        : [];

    const getImageForColor = (colorId: number) => {
        return product.images.find(img => img.colorId === colorId);
    };

    const flashSalePrice = flashSale ? product.price * (1 - flashSale.discountPercentage / 100) : product.price;
    const finalPrice = couponDiscount ? Math.max(0, flashSalePrice - couponDiscount) : flashSalePrice;

    const materialName = product.materialNameTranslations?.[language] || product.materialName || '';

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const diff = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(diff) > 50) {
            if (expandedImageIndex !== null) {
                if (diff > 0 && expandedImageIndex > 0) {
                    setExpandedImageIndex(prev => prev !== null ? prev - 1 : prev);
                } else if (diff < 0 && expandedImageIndex < displayImages.length - 1) {
                    setExpandedImageIndex(prev => prev !== null ? prev + 1 : prev);
                }
            }
        }
        touchStartX.current = null;
    };

    return (
        <div className="quick-view-overlay" onClick={onClose}>
            <div className="quick-view-modal" onClick={(e) => e.stopPropagation()}>
                <div className="quick-view-content">
                    <div className="quick-view-left" style={{ position: 'relative' }}>
                        <div
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                        >
                            <button
                                onClick={() => setExpandedImageIndex(safeImageIndex)}
                                style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                            >
                                {displayImage && (
                                    <img
                                        src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${product.id}/images/${displayImage.id}`}
                                        alt={productName}
                                        className="quick-view-main-image"
                                    />
                                )}
                            </button>
                        </div>

                        <div className="quick-view-photo-actions">
                            <button onClick={toggleWishlist} className={`quick-view-photo-wishlist ${isInWishlist ? 'active' : ''}`}>
                                {isInWishlist ? '❤️' : '🤍'}
                            </button>
                            <button onClick={onClose} className="quick-view-photo-close">✕</button>
                        </div>

                        {displayImages.length > 1 && (
                            <div className="quick-view-thumbnails">
                                {displayImages.map((img, index) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setSelectedImageIndex(index)}
                                        className={safeImageIndex === index ? 'active' : ''}
                                    >
                                        <img
                                            src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${product.id}/images/${img.id}`}
                                            alt={productName}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="quick-view-right">
                        <h2 className="quick-view-title">{productName}</h2>

                        <div className="quick-view-rating-sku">
                            <span className="quick-view-rating">★ 4.5</span>
                            <span className="quick-view-sku">SKU: {product.id}</span>
                        </div>

                        {colors && colors.length > 0 && (
                            <div className="quick-view-colors">
                                <div style={{
                                    overflowX: 'auto',
                                    display: 'flex',
                                    flexWrap: 'nowrap',
                                    gap: '12px',
                                    paddingBottom: '8px',
                                    maxWidth: '100%',
                                }}>
                                    {colors.map((color: ProductColorDto) => {
                                        const colorImage = getImageForColor(color.id);
                                        return (
                                            <div
                                                key={color.id}
                                                onClick={() => {
                                                    setSelectedColorId(color.id);
                                                    setSelectedImageIndex(0);
                                                }}
                                                style={{
                                                    border: selectedColorId === color.id ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                                                    borderRadius: '10px',
                                                    cursor: 'pointer',
                                                    minWidth: '110px',
                                                    maxWidth: '110px',
                                                    overflow: 'hidden',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {colorImage ? (
                                                    <img
                                                        src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${product.id}/images/${colorImage.id}`}
                                                        alt=""
                                                        style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100px', backgroundColor: color.hexCode }} />
                                                )}
                                                <div style={{ padding: '5px 8px', textAlign: 'left' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '2px' }}>
                                                        {color.nameTranslations?.[language] || color.name}
                                                    </div>
                                                    <div style={{ fontSize: '12px', fontWeight: '700' }}>
                                                        {formatPrice(product.price)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {sizesForSelectedColor.length > 0 && (
                            <div className="quick-view-sizes" style={{ marginTop: '8px' }}>
                                <span className="quick-view-label">{t.product.size}:</span>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                    {sizesForSelectedColor.map((sizeName) => (
                                        <button
                                            key={sizeName}
                                            onClick={() => setSelectedSizeName(sizeName)}
                                            className={`size-btn ${selectedSizeName === sizeName ? 'active' : ''}`}
                                        >
                                            {sizeName}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {materialName && (
                            <div className="quick-view-material">
                                <span className="quick-view-label">{t.product.material}:</span> {materialName}
                            </div>
                        )}

                        <Link
                            to={`/products/${product.id}`}
                            className="quick-view-details-link"
                        >
                            {t.product.viewMoreDetails || 'View More Details'} →
                        </Link>

                        <div className="quick-view-price">
                            {flashSale || couponDiscount ? (
                                <>
                                    <span style={{ textDecoration: 'line-through', fontSize: '16px', color: 'var(--text-tertiary)' }}>
                                        {formatPrice(product.price)}
                                    </span>{' '}
                                    <span style={{ color: '#10B981', fontSize: '22px', fontWeight: '700' }}>
                                        {formatPrice(finalPrice)}
                                    </span>
                                </>
                            ) : (
                                <span style={{ fontSize: '22px', fontWeight: '700' }}>{formatPrice(product.price)}</span>
                            )}
                            {flashSale && (
                                <span style={{ color: '#EF4444', fontSize: '12px', marginLeft: '8px' }}>
                                    ⚡ -{flashSale.discountPercentage}%
                                </span>
                            )}
                            {couponDiscount && (
                                <span style={{ color: '#10B981', fontSize: '12px', marginLeft: '8px' }}>
                                    Coupon: -{formatPrice(couponDiscount)}
                                </span>
                            )}
                        </div>

                        <div className="quick-view-actions" style={{ display: 'flex', gap: '10px' }}>
                            <div className="quantity-selector" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: '36px', height: '36px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', borderRadius: '6px', cursor: 'pointer' }}>−</button>
                                <span style={{ minWidth: '28px', textAlign: 'center', fontWeight: '600' }}>{quantity}</span>
                                <button onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))} style={{ width: '36px', height: '36px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', borderRadius: '6px', cursor: 'pointer' }}>+</button>
                            </div>
                            <button
                                onClick={() => {
                                    if (!isAuthenticated) {
                                        navigate('/login');
                                        return;
                                    }
                                    addToCartMutation.mutate();
                                }}
                                className="btn btn-primary"
                                style={{ flex: 1, height: '36px', fontSize: '14px' }}
                                disabled={product.stockQuantity === 0 || addToCartMutation.isPending}
                            >
                                {addToCartMutation.isPending ? '...' : t.product.addToCart}
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                if (!isAuthenticated) {
                                    navigate('/login');
                                    return;
                                }
                                navigate('/checkout', {
                                    state: {
                                        directBuy: {
                                            productId: product.id,
                                            quantity,
                                            colorId: selectedColorId || undefined,
                                            sizeName: selectedSizeName || undefined,
                                        }
                                    }
                                });
                                onClose();
                            }}
                            className="btn btn-primary"
                            style={{ width: '100%', height: '36px', marginTop: '8px', fontSize: '14px' }}
                            disabled={product.stockQuantity === 0}
                        >
                            {t.product.buyNow || 'Buy Now'}
                        </button>
                    </div>
                </div>
            </div>

            {expandedImageIndex !== null && displayImages.length > 0 && (
                <div className="media-overlay" onClick={() => setExpandedImageIndex(null)}>
                    <div
                        className="media-expanded"
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        <button className="media-close" onClick={(e) => { e.stopPropagation(); setExpandedImageIndex(null); }}>✕</button>
                        <button className="media-nav prev" onClick={(e) => { e.stopPropagation(); setExpandedImageIndex(prev => prev !== null && prev > 0 ? prev - 1 : prev); }}>‹</button>
                        <img src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${product.id}/images/${displayImages[expandedImageIndex].id}`} alt={productName} className="media-image" />
                        <button className="media-nav next" onClick={(e) => { e.stopPropagation(); setExpandedImageIndex(prev => prev !== null && prev < displayImages.length - 1 ? prev + 1 : prev); }}>›</button>
                    </div>
                </div>
            )}
        </div>
    );
};