import React from 'react';
import { Link } from 'react-router-dom';
import { ProductResponseDto } from '../types/product';

interface ProductCardProps {
    product: ProductResponseDto;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const mainImage = product.images.find(img => img.isMain) || product.images[0];

    return (
        <Link to={`/products/${product.id}`} className="product-card">
            <div className="product-image">
                {mainImage ? (
                    <img
                        src={`${import.meta.env.VITE_API_URL}/api/products/${product.id}/images/${mainImage.id}`}
                        alt={product.name}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=No+Image';
                        }}
                    />
                ) : (
                    <div className="placeholder-image">
                        <span>No Image</span>
                    </div>
                )}
                {product.stockQuantity === 0 && (
                    <div className="out-of-stock">Out of Stock</div>
                )}
            </div>

            <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-category">{product.categoryName}</p>
                <p className="product-description">
                    {product.description?.substring(0, 100)}
                    {product.description && product.description.length > 100 ? '...' : ''}
                </p>
                <div className="product-footer">
                    <span className="product-price">${product.price.toFixed(2)}</span>
                    <span className="product-stock">
                        {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Unavailable'}
                    </span>
                </div>
            </div>
        </Link>
    );
};