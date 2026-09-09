import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductResponseDto } from '../types/product';
import { flashSaleService, FlashSaleResponseDto } from '../services/coupon.service';
import { wishlistService } from '../services/wishlist.service';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useQueryClient } from '@tanstack/react-query';
import { QuickViewModal } from './QuickViewModal';

interface ProductCardProps {
    product: ProductResponseDto;
    extraInfo?: React.ReactNode;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, extraInfo }) => {
    const mainImage = product.images.find(img => img.isMain) || product.images[0];
    const [couponDiscount, setCouponDiscount] = useState<number | null>(null);
    const [flashSale, setFlashSale] = useState<FlashSaleResponseDto | null>(null);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [showQuickView, setShowQuickView] = useState(false);
    const { language, t } = useLanguage();
    const { isAuthenticated } = useAuth();
    const { formatPrice } = useCurrency();
    const queryClient = useQueryClient();

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

        const loadFlashSale = async () => {
            try {
                const response = await flashSaleService.getActive();
                const flashSales = response.data;

                const matchingFlashSale = flashSales.find(fs => {
                    try {
                        const productIds = JSON.parse(fs.productIdsJson || '[]') as number[];
                        const categoryIds = JSON.parse(fs.categoryIdsJson || '[]') as number[];

                        if (productIds.length > 0) return productIds.includes(product.id);
                        if (categoryIds.length > 0) return categoryIds.includes(product.categoryId);
                        return true;
                    } catch { return false; }
                });

                setFlashSale(matchingFlashSale || null);
            } catch { }
        };

        const checkWishlist = async () => {
            if (!isAuthenticated) return;
            try {
                const response = await wishlistService.isInWishlist(product.id);
                setIsInWishlist(response.data);
            } catch { }
        };

        loadFlashSale();
        checkWishlist();
    }, [product.id, product.categoryId, isAuthenticated]);

    const toggleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) return;
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

    const handleQuickView = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowQuickView(true);
    };

    const flashSalePrice = flashSale ? product.price * (1 - flashSale.discountPercentage / 100) : product.price;
    const finalPrice = couponDiscount ? Math.max(0, flashSalePrice - couponDiscount) : flashSalePrice;

    const productName = product.nameTranslations?.[language] || product.name;
    const productDescription = product.descriptionTranslations?.[language] || product.description || '';

    return (
        <>
            <Link
                to={`/products/${product.id}`}
                className="product-card"
                style={{ position: 'relative' }}
            >
                <div className="product-image">
                    {mainImage ? (
                        <img
                            src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${product.id}/images/${mainImage.id}`}
                            alt={productName}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22300%22%20height%3D%22300%22%3E%3Crect%20fill%3D%22%236366f1%22%20width%3D%22300%22%20height%3D%22300%22%2F%3E%3Ctext%20fill%3D%22white%22%20font-size%3D%2218%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3E🛍️%3C%2Ftext%3E%3C%2Fsvg%3E';
                            }}
                        />
                    ) : (
                        <div className="placeholder-image">
                            <span>🛍️</span>
                        </div>
                    )}
                    {product.stockQuantity === 0 && (
                        <div className="out-of-stock">{t.product.outOfStock}</div>
                    )}
                    <button
                        onClick={toggleWishlist}
                        className={`wishlist-heart-btn ${isInWishlist ? 'active' : ''}`}
                        title={t.profile.wishlist}
                    >
                        {isInWishlist ? '❤️' : '🤍'}
                    </button>
                </div>

                <div className="product-info">
                    <h3 className="product-name">{productName}</h3>
                    <p className="product-description">
                        {productDescription.substring(0, 100)}
                        {productDescription.length > 100 ? '...' : ''}
                    </p>
                </div>

                <div className="product-footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '4px 12px 12px' }}>
                    <div className="price-group">
                        {flashSale || couponDiscount ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span className="product-price" style={{ textDecoration: 'line-through', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                    {formatPrice(product.price)}
                                </span>
                                <span className="discount-price-green" style={{ fontSize: '16px', fontWeight: 700 }}>
                                    {formatPrice(finalPrice)}
                                </span>
                            </div>
                        ) : (
                            <span className="product-price" style={{ fontSize: '16px', fontWeight: 700 }}>{formatPrice(product.price)}</span>
                        )}
                    </div>
                    <span className="product-stock" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {product.stockQuantity > 0 ? `${product.stockQuantity} ${t.product.inStock}` : t.product.outOfStock}
                    </span>
                </div>

                {extraInfo && (
                    <div style={{
                        textAlign: 'center',
                        fontSize: '12px',
                        color: 'var(--accent)',
                        fontWeight: 600,
                        padding: '0 12px 8px',
                        letterSpacing: '0.3px',
                        lineHeight: '1.4',
                        marginTop: 'auto'
                    }}>
                        {extraInfo}
                    </div>
                )}

                <button
                    onClick={handleQuickView}
                    className="quick-view-inline-btn"
                >
                    {t.product.quickView || 'Quick View'}
                </button>
            </Link>

            {showQuickView && (
                <QuickViewModal product={product} onClose={() => setShowQuickView(false)} />
            )}
        </>
    );
};