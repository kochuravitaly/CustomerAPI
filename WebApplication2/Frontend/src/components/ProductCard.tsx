import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductResponseDto } from '../types/product';
import { flashSaleService, FlashSaleResponseDto } from '../services/coupon.service';
import { useLanguage } from '../context/LanguageContext';

interface ProductCardProps {
    product: ProductResponseDto;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const mainImage = product.images.find(img => img.isMain) || product.images[0];
    const [couponDiscount, setCouponDiscount] = useState<number | null>(null);
    const [flashSale, setFlashSale] = useState<FlashSaleResponseDto | null>(null);
    const { language, t } = useLanguage();

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

        loadFlashSale();
    }, [product.id, product.categoryId]);

    const flashSalePrice = flashSale ? product.price * (1 - flashSale.discountPercentage / 100) : product.price;
    const finalPrice = couponDiscount ? Math.max(0, flashSalePrice - couponDiscount) : flashSalePrice;

    const productName = product.nameTranslations?.[language] || product.name;
    const productDescription = product.descriptionTranslations?.[language] || product.description || '';

    return (
        <Link to={`/products/${product.id}`} className="product-card">
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
            </div>

            <div className="product-info">
                <h3 className="product-name">{productName}</h3>
                <p className="product-description">
                    {productDescription.substring(0, 100)}
                    {productDescription.length > 100 ? '...' : ''}
                </p>
            </div>

            <div className="product-footer-bottom">
                {flashSale || couponDiscount ? (
                    <div className="price-group">
                        <span className="product-price" style={{ textDecoration: 'line-through', fontSize: '13px', color: '#71717A' }}>
                            ${product.price.toFixed(2)}
                        </span>{' '}
                        <span className="product-price" style={{ color: '#10B981', fontSize: '16px' }}>
                            ${finalPrice.toFixed(2)}
                        </span>
                    </div>
                ) : (
                    <span className="product-price" style={{ fontSize: '16px' }}>${product.price.toFixed(2)}</span>
                )}
                <span className="product-stock">
                    {product.stockQuantity > 0 ? `${product.stockQuantity} ${t.product.inStock}` : t.product.outOfStock}
                </span>
            </div>
        </Link>
    );
};