import React from 'react';
import { Link } from 'react-router-dom';
import { ProductResponseDto } from '../types/product';
import { useLanguage } from '../context/LanguageContext';

interface ProductCardProps {
    product: ProductResponseDto;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const { language } = useLanguage();
    const mainImage = product.images.find(img => img.isMain) || product.images[0];

    const productName = product.nameTranslations?.[language] || product.name;
    const productDescription = product.descriptionTranslations?.[language] || product.description;

    return (
        <Link to={`/products/${product.id}`} className="product-card">
            <div className="product-image">
                {mainImage ? (
                    <img
                        src={`/api/products/${product.id}/images/${mainImage.id}`}
                        alt={productName}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%3E%3Crect%20fill%3D%22%23f4f4f5%22%20width%3D%22200%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22%23a1a1aa%22%20font-size%3D%2216%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3E🛍️%3C%2Ftext%3E%3C%2Fsvg%3E';
                        }}
                    />
                ) : (
                    <div className="placeholder-image">🛍️</div>
                )}
                {product.stockQuantity === 0 && (
                    <div className="out-of-stock">Out</div>
                )}
            </div>

            <div className="product-info">
                <h3 className="product-name">{productName}</h3>
                <p className="product-description">
                    {productDescription?.substring(0, 80)}
                </p>
                <div className="product-footer">
                    <span className="product-price">${product.price.toFixed(2)}</span>
                    <span className="product-stock">
                        {product.stockQuantity > 0 ? `${product.stockQuantity}` : '—'}
                    </span>
                </div>
            </div>
        </Link>
    );
};