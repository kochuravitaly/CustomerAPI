import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { variantService, ProductColorDto } from '../services/variant.service';
import { reviewService, ReviewResponseDto } from '../services/review.service';
import { cartService } from '../services/cart.service';
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

    useEffect(() => {
        window.scrollTo(0, 0);
        setMainImageIndex(0);
        setSelectedColorId(null);
        setSelectedSizeName(null);
    }, [id]);

    const { data: product, isLoading } = useQuery({
        queryKey: ['product', id],
        queryFn: async () => (await productService.getById(Number(id))).data,
        enabled: !!id,
    });

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

    const sizesForSelectedColor = selectedColorId && variants
        ? variants.filter(v => v.colorId === selectedColorId).map(v => v.sizeName)
        : [];

    const selectedVariant = selectedColorId && selectedSizeName && variants
        ? variants.find(v => v.colorId === selectedColorId && v.sizeName === selectedSizeName)
        : null;

    const genderLabel = product.gender !== undefined && product.gender !== null ? ['Unisex', 'Men', 'Women'][product.gender] : '';

    const parseJsonArray = (json: string | undefined): string[] => {
        if (!json) return [];
        try { const parsed = JSON.parse(json); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
    };

    const seasonsList = parseJsonArray(product.seasonsJson);
    const ageGroupsList = parseJsonArray(product.ageGroupsJson);

    const parseMaterialComposition = (json: string | undefined): { materialId: number; percentage: number }[] => {
        if (!json) return [];
        try { const parsed = JSON.parse(json); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
    };

    const materialCompositions = parseMaterialComposition(product.materialCompositionJson);
    const materialNames = materialCompositions.map(mc => {
        const material = materials?.find(m => m.id === mc.materialId);
        return material ? `${material.name} ${mc.percentage}%` : '';
    }).filter(Boolean);

    const visibleAttributes = [
        { label: 'Gender', value: genderLabel },
        { label: 'Season', value: seasonsList.join(', ') },
        { label: 'Age', value: ageGroupsList.join(', ') },
        ...(materialNames.length > 0 ? [{ label: 'Materials', value: materialNames.join(', ') }] : []),
        { label: 'Style', value: product.styleName || '' },
        { label: 'Occasion', value: product.occasionName || '' },
        { label: 'Pattern', value: product.patternName || '' },
    ].filter(attr => attr.value !== '');

    const selectedColor = colors?.find(c => c.id === selectedColorId);
    const imagesForSelectedColor = selectedColor
        ? product.images.filter(img => img.colorId === selectedColor.id || img.colorId === null || img.colorId === undefined)
        : product.images;
    const displayImages = imagesForSelectedColor.length > 0 ? imagesForSelectedColor : product.images;
    const safeMainImageIndex = mainImageIndex < displayImages.length ? mainImageIndex : 0;
    const mainImage = displayImages[safeMainImageIndex];

    return (
        <div className="product-detail-page">
            <button onClick={() => navigate(-1)} className="btn btn-outline back-btn">← {t.product.back}</button>

            <div className="product-detail-container">
                <div className="product-images">
                    <button className="main-image-btn" onClick={() => setExpandedImageIndex(safeMainImageIndex)}>
                        {mainImage ? (
                            <img src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${product.id}/images/${mainImage.id}`} alt={productName} />
                        ) : (
                            <div className="placeholder-image">🛍️</div>
                        )}
                    </button>
                    {displayImages.length > 1 && (
                        <div className="image-thumbnails">
                            {displayImages.map((image, index) => (
                                <button key={image.id} onClick={() => setMainImageIndex(index)} className={`thumbnail ${index === safeMainImageIndex ? 'active' : ''}`}>
                                    <img src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${product.id}/images/${image.id}`} alt={productName} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="product-info">
                    <h1 className="product-title">{productName}</h1>
                    <div className="product-price-large">${product.price.toFixed(2)}</div>
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

                    {visibleAttributes.length > 0 && (
                        <div className="product-attributes-list">
                            {visibleAttributes.map((attr) => (
                                <div key={attr.label} className="attr-line">
                                    <span className="attr-label">{attr.label}:</span> {attr.value}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="reviews-section">
                <h2>Reviews</h2>
                <Link to={`/products/${product.id}/reviews`} className="rating-summary-google-link">
                    <div className="rating-bars-right">
                        {[5, 4, 3, 2, 1].map((star) => (
                            <div key={star} className="rating-bar-row">
                                <span>{star} ★</span>
                                <div className="rating-bar">
                                    <div className="rating-bar-fill" style={{ width: `${totalReviews > 0 ? ((reviewSummary?.ratingDistribution[star] || 0) / totalReviews) * 100 : 0}%` }} />
                                </div>
                                <span>{reviewSummary?.ratingDistribution[star] || 0}</span>
                            </div>
                        ))}
                    </div>
                    <div className="rating-number-center">{avgRating.toFixed(2)}</div>
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

            {expandedImageIndex !== null && displayImages.length > 0 && (
                <div className="media-overlay" onClick={() => setExpandedImageIndex(null)}>
                    <div className="media-expanded" onClick={(e) => e.stopPropagation()}>
                        <button className="media-close" onClick={() => setExpandedImageIndex(null)}>✕</button>
                        <button className="media-nav prev" onClick={() => setExpandedImageIndex(prev => prev !== null && prev > 0 ? prev - 1 : prev)}>‹</button>
                        <img src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${product.id}/images/${displayImages[expandedImageIndex].id}`} alt={productName} className="media-image" />
                        <button className="media-nav next" onClick={() => setExpandedImageIndex(prev => prev !== null && prev < displayImages.length - 1 ? prev + 1 : prev)}>›</button>
                    </div>
                </div>
            )}

            {expandedMedia && (
                <div className="media-overlay" onClick={() => setExpandedMedia(null)}>
                    <div className="media-expanded" onClick={(e) => e.stopPropagation()}>
                        <button className="media-close" onClick={() => setExpandedMedia(null)}>✕</button>
                        <button className="media-nav prev" onClick={() => setExpandedMedia(prev => prev && prev.index > 0 ? { ...prev, index: prev.index - 1 } : prev)}>‹</button>
                        {expandedMedia.review.media[expandedMedia.index].mediaType === 'video' ? (
                            <video src={`${(import.meta as any).env?.VITE_API_URL}/api/reviews/${expandedMedia.review.id}/media/${expandedMedia.review.media[expandedMedia.index].id}`} controls className="media-video" />
                        ) : (
                            <img src={`${(import.meta as any).env?.VITE_API_URL}/api/reviews/${expandedMedia.review.id}/media/${expandedMedia.review.media[expandedMedia.index].id}`} alt="Review media" className="media-image" />
                        )}
                        <button className="media-nav next" onClick={() => setExpandedMedia(prev => prev && prev.index < prev.review.media.length - 1 ? { ...prev, index: prev.index + 1 } : prev)}>›</button>
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