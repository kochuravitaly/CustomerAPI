import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistService, WishlistItemResponseDto } from '../services/wishlist.service';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useLanguage } from '../context/LanguageContext';

export const Wishlist: React.FC = () => {
    const queryClient = useQueryClient();
    const { t, language } = useLanguage();
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const { data: wishlist, isLoading } = useQuery({
        queryKey: ['wishlist'],
        queryFn: async () => (await wishlistService.getWishlist()).data,
        refetchOnMount: 'always',
        staleTime: 0,
    });

    const removeMutation = useMutation({
        mutationFn: (productId: number) => wishlistService.removeFromWishlist(productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
            queryClient.invalidateQueries({ queryKey: ['wishlist-count'] });
        },
    });

    const clearMutation = useMutation({
        mutationFn: () => wishlistService.clearWishlist(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
            queryClient.invalidateQueries({ queryKey: ['wishlist-count'] });
            setShowClearConfirm(false);
        },
    });

    if (isLoading) return <LoadingSpinner />;

    const hasItems = wishlist && wishlist.length > 0;

    return (
        <div className="wishlist-page">
            <Link to="/" className="profile-logo">CheyenneShop</Link>

            {hasItems ? (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h1>{t.wishlist.title}</h1>
                        <button onClick={() => setShowClearConfirm(true)} className="btn btn-outline btn-small">
                            {t.wishlist.clear}
                        </button>
                    </div>

                    <div className="products-grid">
                        {wishlist.map((item: WishlistItemResponseDto) => {
                            const productName = item.nameTranslations?.[language] || item.productName;
                            return (
                                <div key={item.id} className="product-card">
                                    <Link to={`/products/${item.productId}`} className="product-image">
                                        {item.mainImageId ? (
                                            <img
                                                src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${item.productId}/images/${item.mainImageId}`}
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
                                    </Link>
                                    <div className="product-info">
                                        <h3 className="product-name">{productName}</h3>
                                        <p className="product-price">${item.price.toFixed(2)}</p>
                                        <p className="product-stock">
                                            {item.stockQuantity > 0 ? `${item.stockQuantity} ${t.product.inStock}` : t.product.outOfStock}
                                        </p>
                                    </div>
                                    <div className="action-buttons" style={{ padding: '0 12px 12px' }}>
                                        <button
                                            onClick={() => removeMutation.mutate(item.productId)}
                                            className="btn btn-danger btn-small"
                                        >
                                            {t.wishlist.remove}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="empty-cart-page">
                    <div className="empty-cart-icon">❤️</div>
                    <p style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>
                        {t.wishlist.empty}
                    </p>
                    <Link to="/" className="btn btn-primary">{t.cart.startShopping}</Link>
                </div>
            )}

            {showClearConfirm && (
                <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{t.wishlist.clear}</h3>
                        <p>{t.wishlist.clearConfirm}</p>
                        <div className="modal-actions">
                            <button onClick={() => clearMutation.mutate()} className="btn btn-danger">
                                {t.wishlist.clear}
                            </button>
                            <button onClick={() => setShowClearConfirm(false)} className="btn btn-outline">
                                {t.admin.cancel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};