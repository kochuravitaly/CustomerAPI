import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { cartService } from '../services/cart.service';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

export const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    const [quantity, setQuantity] = useState(1);
    const [mainImageIndex, setMainImageIndex] = useState(0);
    const [error, setError] = useState('');

    const { data: product, isLoading } = useQuery({
        queryKey: ['product', id],
        queryFn: async () => {
            const response = await productService.getById(Number(id));
            return response.data;
        },
        enabled: !!id,
    });

    const addToCartMutation = useMutation({
        mutationFn: () =>
            cartService.addItem({
                productId: Number(id),
                quantity,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            alert('Added to cart!');
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Failed to add to cart');
        },
    });

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        addToCartMutation.mutate();
    };

    if (isLoading) return <LoadingSpinner />;
    if (!product) return <ErrorMessage message="Product not found" />;

    const mainImage = product.images[mainImageIndex] || product.images.find(img => img.isMain);

    return (
        <div className="product-detail-page">
            <button onClick={() => navigate(-1)} className="btn btn-outline back-btn">
                ← Back
            </button>

            <div className="product-detail-container">
                {/* Product Images */}
                <div className="product-images">
                    <div className="main-image">
                        {mainImage ? (
                            <img
                                src={`${import.meta.env.VITE_API_URL}/api/products/${product.id}/images/${mainImage.id}`}
                                alt={product.name}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500x500?text=No+Image';
                                }}
                            />
                        ) : (
                            <div className="placeholder-large">No Image</div>
                        )}
                    </div>

                    {product.images.length > 1 && (
                        <div className="image-thumbnails">
                            {product.images.map((image, index) => (
                                <button
                                    key={image.id}
                                    onClick={() => setMainImageIndex(index)}
                                    className={`thumbnail ${index === mainImageIndex ? 'active' : ''}`}
                                >
                                    <img
                                        src={`${import.meta.env.VITE_API_URL}/api/products/${product.id}/images/${image.id}`}
                                        alt={`${product.name} - ${index + 1}`}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="product-info">
                    <span className="product-category-badge">{product.categoryName}</span>
                    <h1 className="product-title">{product.name}</h1>

                    <div className="product-price-large">${product.price.toFixed(2)}</div>

                    <p className="product-description-full">{product.description}</p>

                    <div className="product-stock-info">
                        {product.stockQuantity > 0 ? (
                            <span className="in-stock">✓ In Stock ({product.stockQuantity} available)</span>
                        ) : (
                            <span className="out-of-stock">✗ Out of Stock</span>
                        )}
                    </div>

                    {error && <div className="alert alert-error">{error}</div>}

                    <div className="add-to-cart-section">
                        <div className="quantity-selector">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="quantity-btn"
                            >
                                -
                            </button>
                            <span className="quantity-display">{quantity}</span>
                            <button
                                onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                                className="quantity-btn"
                            >
                                +
                            </button>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            disabled={product.stockQuantity === 0 || addToCartMutation.isPending}
                            className="btn btn-primary btn-large"
                        >
                            {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
                        </button>
                    </div>

                    <div className="product-meta">
                        <p>SKU: {product.id}</p>
                        <p>Added: {new Date(product.createdAt).toLocaleDateString()}</p>
                        <p>Updated: {new Date(product.updatedAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};