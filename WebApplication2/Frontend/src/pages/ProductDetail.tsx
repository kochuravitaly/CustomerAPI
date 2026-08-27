import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { variantService, ProductColorDto } from '../services/variant.service';
import { reviewService, ReviewResponseDto } from '../services/review.service';
import { cartService } from '../services/cart.service';
import { flashSaleService, FlashSaleResponseDto } from '../services/coupon.service';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

export const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, isAdmin } = useAuth();
    const { t, language } = useLanguage();
    const queryClient = useQueryClient();

    const [quantity, setQuantity] = useState(1);
    const [mainImageIndex, setMainImageIndex] = useState(0);
    const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
    const [selectedSizeName, setSelectedSizeName] = useState<string | null>(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [reviewFiles, setReviewFiles] = useState<File[]>([]);
    const [error, setError] = useState('');
    const [helpfulMessages, setHelpfulMessages] = useState<Record<number, string>>({});
    const [reportMessages, setReportMessages] = useState<Record<number, string>>({});
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);
    const [expandedMedia, setExpandedMedia] = useState<{ review: ReviewResponseDto; index: number } | null>(null);
    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState<number | null>(null);
    const [couponError, setCouponError] = useState('');
    const [couponAppliedKey, setCouponAppliedKey] = useState('');
    const [flashSale, setFlashSale] = useState<FlashSaleResponseDto | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        window.scrollTo(0, 0);
        setMainImageIndex(0);
        setSelectedColorId(null);
        setSelectedSizeName(null);
        setCouponCode('');
        setCouponDiscount(null);
        setCouponError('');
        setCouponAppliedKey('');
    }, [id]);

    const { data: product, isLoading } = useQuery({
        queryKey: ['product', id],
        queryFn: async () => (await productService.getById(Number(id))).data,
        enabled: !!id,
    });

    useEffect(() => {
        if (flashSale) {
            const timer = setInterval(() => {
                const now = new Date().getTime();
                const end = new Date(flashSale.endsAt).getTime();
                const diff = end - now;

                if (diff <= 0) {
                    setTimeLeft('Ended');
                    clearInterval(timer);
                    return;
                }

                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [flashSale]);

    useEffect(() => {
        if (product && id) {
            const savedCoupon = localStorage.getItem(`coupon_${id}`);
            if (savedCoupon) {
                try {
                    const parsed = JSON.parse(savedCoupon);
                    if (parsed && parsed.code) {
                        const validateCoupon = async () => {
                            try {
                                const response = await apiService.post('/coupons/validate', {
                                    code: parsed.code,
                                    orderTotal: product.price,
                                    productId: Number(id),
                                    categoryId: product.categoryId,
                                });
                                const data = response.data as { discount: number; finalTotal: number };
                                setCouponAppliedKey(parsed.code);
                                setCouponDiscount(data.discount);
                            } catch {
                                localStorage.removeItem(`coupon_${id}`);
                                setCouponAppliedKey('');
                                setCouponDiscount(null);
                            }
                        };
                        validateCoupon();
                    }
                } catch { }
            }
        }
    }, [product?.id, id]);

    useEffect(() => {
        if (product) {
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
        }
    }, [product?.id, product?.categoryId]);

    const { data: colors } = useQuery({
        queryKey: ['product-colors', id],
        queryFn: async () => (await variantService.getColors(Number(id))).data,
        enabled: !!id,
    });

    const { data: variants } = useQuery({
        queryKey: ['product-variants', id],
        queryFn: async () => (await variantService.getVariants(Number(id))).data,
        enabled: !!id,
    });

    const { data: materials } = useQuery({
        queryKey: ['materials'],
        queryFn: async () => {
            const { attributeService } = await import('../services/attribute.service');
            return (await attributeService.getMaterials()).data;
        },
    });

    const { data: reviews } = useQuery({
        queryKey: ['product-reviews', id],
        queryFn: async () => (await reviewService.getProductReviews(Number(id))).data,
        enabled: !!id,
    });

    const { data: reviewSummary } = useQuery({
        queryKey: ['product-review-summary', id],
        queryFn: async () => (await reviewService.getProductSummary(Number(id))).data,
        enabled: !!id,
    });

    const { data: canReview } = useQuery({
        queryKey: ['can-review', id],
        queryFn: async () => (await reviewService.canReview(Number(id))).data,
        enabled: !!id && isAuthenticated,
    });

    const { data: similarProducts } = useQuery({
        queryKey: ['similar-products', id, product?.categoryId],
        queryFn: async () => {
            if (!product?.categoryId) return [];
            const response = await productService.getAll({
                categoryId: product.categoryId,
                page: 1,
                pageSize: 5,
                sortBy: 'createdAt',
                sortDirection: 'desc',
            });
            return response.data.items.filter(p => p.id !== Number(id)).slice(0, 4);
        },
        enabled: !!product?.categoryId,
    });

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

    const createReviewMutation = useMutation({
        mutationFn: async () => {
            const response = await reviewService.createReview({ productId: Number(id), rating: reviewRating, text: reviewText });
            if (reviewFiles.length > 0 && response.data) {
                for (const file of reviewFiles) {
                    await reviewService.uploadMedia(response.data.id, file);
                }
            }
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-reviews', id] });
            queryClient.invalidateQueries({ queryKey: ['product-review-summary', id] });
            setShowReviewForm(false);
            setReviewText('');
            setReviewRating(5);
            setReviewFiles([]);
        },
        onError: (err: any) => setError(err.response?.data || 'Failed'),
    });

    const deleteReviewMutation = useMutation({
        mutationFn: (reviewId: number) => reviewService.deleteReview(reviewId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-reviews', id] });
            queryClient.invalidateQueries({ queryKey: ['product-review-summary', id] });
            setDeleteConfirm(null);
        },
    });

    const addToCartMutation = useMutation({
        mutationFn: () => cartService.addItem({ productId: Number(id), quantity }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            alert('Added to cart!');
        },
        onError: (err: any) => setError(err.response?.data || 'Failed'),
    });

    const helpfulMutation = useMutation({
        mutationFn: (reviewId: number) => reviewService.markHelpful(reviewId),
        onSuccess: (_, reviewId) => setHelpfulMessages(prev => ({ ...prev, [reviewId]: 'Thanks for your feedback!' })),
    });

    const reportMutation = useMutation({
        mutationFn: (reviewId: number) => reviewService.reportReview(reviewId),
        onSuccess: (_, reviewId) => setReportMessages(prev => ({ ...prev, [reviewId]: "Thanks for your report, we'll take appropriate action." })),
    });

    const applyCouponMutation = useMutation({
        mutationFn: async () => {
            if (!id) return null;
            const existingCoupon = localStorage.getItem(`coupon_${id}`);
            if (existingCoupon) {
                throw new Error('Coupon already applied');
            }
            const basePrice = flashSale ? product!.price * (1 - flashSale.discountPercentage / 100) : product!.price;
            const response = await apiService.post('/coupons/apply', {
                code: couponCode,
                orderTotal: basePrice,
                productId: Number(id),
                categoryId: product?.categoryId,
            });
            return response.data as { discount: number; finalTotal: number };
        },
        onSuccess: (data) => {
            if (data && id) {
                const couponData = { code: couponCode.toUpperCase(), discount: data.discount };
                localStorage.setItem(`coupon_${id}`, JSON.stringify(couponData));
                setCouponDiscount(data.discount);
                setCouponError('');
                setCouponAppliedKey(couponCode.toUpperCase());
            }
        },
        onError: (err: any) => {
            if (err.message === 'Coupon already applied') {
                setCouponError('A coupon is already applied to this product');
            } else {
                setCouponError(err.response?.data?.error || err.response?.data || 'Invalid coupon');
            }
            setCouponDiscount(null);
            setCouponAppliedKey('');
        },
    });

    const handleAddToCart = () => {
        if (!isAuthenticated) { navigate('/login'); return; }
        addToCartMutation.mutate();
    };

    if (isLoading) return <LoadingSpinner />;
    if (!product) return <ErrorMessage message="Product not found" />;

    const productName = product.nameTranslations?.[language] || product.name;
    const productDescription = product.descriptionTranslations?.[language] || product.description;
    const avgRating = reviewSummary?.averageRating || 0;
    const totalReviews = reviewSummary?.totalReviews || 0;

    const selectedColor = colors?.find(c => c.id === selectedColorId);

    const sizesForSelectedColor = selectedColorId && variants
        ? variants.filter(v => v.colorId === selectedColorId).map(v => v.sizeName)
        : [];

    const selectedVariant = selectedColorId && selectedSizeName && variants
        ? variants.find(v => v.colorId === selectedColorId && v.sizeName === selectedSizeName)
        : null;

    const flashSalePrice = flashSale ? product.price * (1 - flashSale.discountPercentage / 100) : product.price;
    const finalPrice = couponDiscount ? Math.max(0, flashSalePrice - couponDiscount) : flashSalePrice;

    return (
        <div className="product-detail-page">
            <button onClick={() => navigate(-1)} className="btn btn-outline back-btn">← {t.product.back}</button>

            <div className="product-detail-container">
                <div className="product-images">
                    <button className="main-image-btn" onClick={() => setExpandedImageIndex(mainImageIndex)}>
                        {product.images[mainImageIndex] ? (
                            <img src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${product.id}/images/${product.images[mainImageIndex].id}`} alt={productName} />
                        ) : (
                            <div className="placeholder-image">🛍️</div>
                        )}
                    </button>
                    {product.images.length > 1 && (
                        <div className="image-thumbnails">
                            {product.images.map((image, index) => (
                                <button key={image.id} onClick={() => setMainImageIndex(index)} className={`thumbnail ${index === mainImageIndex ? 'active' : ''}`}>
                                    <img src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${product.id}/images/${image.id}`} alt={productName} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="product-info">
                    <h1 className="product-title">{productName}</h1>

                    {flashSale && (
                        <div className="flash-sale-banner">
                            <div className="flash-sale-banner-header">
                                <span className="flash-sale-badge-large">⚡ FLASH SALE</span>
                                <span className="flash-sale-percent">-{flashSale.discountPercentage}%</span>
                            </div>
                            <div className="flash-sale-timer">
                                <span>Ends in:</span>
                                <span className="flash-sale-countdown">{timeLeft}</span>
                            </div>
                        </div>
                    )}

                    <div className="product-price-large">
                        {flashSale || couponDiscount ? (
                            <>
                                <span style={{ textDecoration: 'line-through', fontSize: '18px', color: '#71717A' }}>${product.price.toFixed(2)}</span>{' '}
                                <span style={{ color: '#10B981' }}>${finalPrice.toFixed(2)}</span>
                            </>
                        ) : (
                            <>${product.price.toFixed(2)}</>
                        )}
                    </div>
                    <p className="product-description-full">{productDescription}</p>

                    {colors && colors.length > 0 && (
                        <div className="product-section">
                            <h3>Color: {selectedColor?.name || 'Select'}</h3>
                            <div className="color-options">
                                {colors.map((color: ProductColorDto) => (
                                    <button
                                        key={color.id}
                                        onClick={() => { setSelectedColorId(color.id); setMainImageIndex(0); setSelectedSizeName(null); }}
                                        className={`color-circle ${selectedColorId === color.id ? 'active' : ''}`}
                                        style={{ backgroundColor: color.hexCode }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {sizesForSelectedColor.length > 0 && (
                        <div className="product-section">
                            <h3>Size:</h3>
                            <div className="size-options">
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

                    {selectedVariant && (
                        <div className="variant-stock-info">
                            {selectedVariant.stockQuantity > 0 ? (
                                <span className="in-stock">✓ In Stock: {selectedVariant.stockQuantity}</span>
                            ) : (
                                <span className="out-of-stock-text">✗ Out of Stock</span>
                            )}
                        </div>
                    )}

                    {error && <div className="alert alert-error">{error}</div>}

                    <div className="add-to-cart-row">
                        <div className="quantity-selector">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="quantity-btn">−</button>
                            <span className="quantity-display">{quantity}</span>
                            <button onClick={() => setQuantity(Math.min(selectedVariant?.stockQuantity || product.stockQuantity, quantity + 1))} className="quantity-btn">+</button>
                        </div>
                        <button
                            onClick={handleAddToCart}
                            disabled={(selectedVariant ? selectedVariant.stockQuantity === 0 : product.stockQuantity === 0)}
                            className="btn btn-primary btn-large"
                        >
                            {t.product.addToCart}
                        </button>
                    </div>

                    <div className="coupon-input-section">
                        <div className="coupon-input-row">
                            <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                placeholder="Enter coupon code"
                                disabled={!!couponAppliedKey}
                                style={{ maxWidth: '200px', padding: '10px 16px', borderRadius: '9999px', border: '1px solid var(--border-color)', background: couponAppliedKey ? '#F4F4F5' : 'var(--bg-tertiary)', fontSize: '14px' }}
                            />
                            <button onClick={() => applyCouponMutation.mutate()} className="btn btn-outline btn-small" disabled={!!couponAppliedKey}>
                                {couponAppliedKey ? 'Applied' : 'Apply'}
                            </button>
                        </div>
                        {couponError && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{couponError}</p>}
                        {couponDiscount !== null && <p style={{ color: '#10B981', fontSize: '12px', marginTop: '4px' }}>Coupon discount: -${couponDiscount.toFixed(2)}</p>}
                    </div>
                </div>
            </div>

            <div className="reviews-section">
                <h2>Reviews</h2>
                <Link to={`/products/${product.id}/reviews`} style={{ display: 'flex', alignItems: 'center', gap: '16px', textDecoration: 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px', justifyContent: 'center' }}>
                        <span style={{ fontSize: '32px', fontWeight: '700', color: '#18181B', lineHeight: '1' }}>{avgRating.toFixed(1)}</span>
                        <span style={{ fontSize: '12px', color: '#71717A' }}>{totalReviews} reviews</span>
                    </div>
                    <div className="rating-bars-right" style={{ flex: 1 }}>
                        {[5, 4, 3, 2, 1].map((star) => (
                            <div key={star} className="rating-bar-row">
                                <span style={{ color: '#F59E0B' }}>{star} ★</span>
                                <div className="rating-bar">
                                    <div className="rating-bar-fill" style={{ width: `${totalReviews > 0 ? ((reviewSummary?.ratingDistribution[star] || 0) / totalReviews) * 100 : 0}%` }} />
                                </div>
                                <span style={{ color: '#71717A' }}>{reviewSummary?.ratingDistribution[star] || 0}</span>
                            </div>
                        ))}
                    </div>
                </Link>

                {(isAdmin || canReview) && (
                    <button className="btn btn-primary write-review-btn" onClick={() => setShowReviewForm(true)}>
                        Write a Review
                    </button>
                )}

                {showReviewForm && (
                    <div className="review-form-overlay" onClick={() => setShowReviewForm(false)}>
                        <div className="review-form-panel" onClick={(e) => e.stopPropagation()}>
                            <h3>Write a Review</h3>
                            <div className="star-picker">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} onClick={() => setReviewRating(star)} className={`star-btn ${star <= reviewRating ? 'active' : ''}`}>★</button>
                                ))}
                            </div>
                            <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={4} placeholder="Write your review..." className="review-textarea" />
                            <input type="file" accept="image/*,video/*" multiple onChange={(e) => setReviewFiles(Array.from(e.target.files || []))} className="file-input" />
                            <div className="modal-actions">
                                <button onClick={() => createReviewMutation.mutate()} className="btn btn-primary">Submit</button>
                                <button onClick={() => setShowReviewForm(false)} className="btn btn-outline">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {reviews && reviews.length > 0 && (
                    <>
                        <div className="reviews-list">
                            {reviews.slice(0, 3).map((review: ReviewResponseDto) => (
                                <div key={review.id} className="review-card">
                                    <div className="review-header">
                                        <div>
                                            <strong>{review.customerName}</strong>
                                            {review.isAdmin && <span className="admin-badge">Admin</span>}
                                            <div className="review-stars-under-name">{'★'.repeat(review.rating)}</div>
                                        </div>
                                        {isAdmin && (
                                            <button onClick={() => setDeleteConfirm(review.id)} className="delete-review-btn">🗑️</button>
                                        )}
                                    </div>
                                    <p className="review-text">{review.text}</p>
                                    <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>

                                    {review.media.length > 0 && (
                                        <div className="review-media-grid">
                                            {review.media.map((media, index) => (
                                                <button key={media.id} onClick={() => setExpandedMedia({ review, index })} className="review-media-thumb">
                                                    {media.mediaType === 'video' ? '🎬' : (
                                                        <img src={`${(import.meta as any).env?.VITE_API_URL}/api/reviews/${review.id}/media/${media.id}`} alt={media.fileName} />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="review-actions">
                                        {helpfulMessages[review.id] ? (
                                            <div className="feedback-message">{helpfulMessages[review.id]}</div>
                                        ) : (
                                            <button onClick={() => helpfulMutation.mutate(review.id)} className="helpful-btn">👍 Helpful ({review.helpfulCount})</button>
                                        )}
                                        {reportMessages[review.id] ? (
                                            <div className="feedback-message">{reportMessages[review.id]}</div>
                                        ) : (
                                            <button onClick={() => reportMutation.mutate(review.id)} className="report-btn">🚩 Report</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {reviews.length > 3 && (
                            <Link to={`/products/${product.id}/reviews`} className="see-all-reviews-btn">
                                See All Reviews →
                            </Link>
                        )}
                    </>
                )}
            </div>

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete Review</h3>
                        <p>Are you sure?</p>
                        <div className="modal-actions">
                            <button onClick={() => deleteReviewMutation.mutate(deleteConfirm)} className="btn btn-danger">Delete</button>
                            <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {expandedImageIndex !== null && product.images.length > 0 && (
                <div className="media-overlay" onClick={() => setExpandedImageIndex(null)}>
                    <div className="media-expanded" onClick={(e) => e.stopPropagation()}>
                        <button className="media-close" onClick={() => setExpandedImageIndex(null)}>✕</button>
                        <img src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${product.id}/images/${product.images[expandedImageIndex].id}`} alt={productName} className="media-image" />
                    </div>
                </div>
            )}

            {expandedMedia && (
                <div className="media-overlay" onClick={() => setExpandedMedia(null)}>
                    <div className="media-expanded" onClick={(e) => e.stopPropagation()}>
                        <button className="media-close" onClick={() => setExpandedMedia(null)}>✕</button>
                        {expandedMedia.review.media[expandedMedia.index].mediaType === 'video' ? (
                            <video src={`${(import.meta as any).env?.VITE_API_URL}/api/reviews/${expandedMedia.review.id}/media/${expandedMedia.review.media[expandedMedia.index].id}`} controls className="media-video" />
                        ) : (
                            <img src={`${(import.meta as any).env?.VITE_API_URL}/api/reviews/${expandedMedia.review.id}/media/${expandedMedia.review.media[expandedMedia.index].id}`} alt="Review media" className="media-image" />
                        )}
                    </div>
                </div>
            )}

            {similarProducts && similarProducts.length > 0 && (
                <div className="similar-products-section">
                    <h2>Similar Products</h2>
                    <div className="products-grid">
                        {similarProducts.map((sp) => (
                            <Link key={sp.id} to={`/products/${sp.id}`} className="product-card">
                                <div className="product-image">
                                    {sp.images[0] && (
                                        <img src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${sp.id}/images/${sp.images[0].id}`} alt={sp.name} />
                                    )}
                                </div>
                                <div className="product-info">
                                    <h3 className="product-name">{sp.name}</h3>
                                    <div className="product-price">${sp.price.toFixed(2)}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};