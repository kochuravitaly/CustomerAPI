import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService, ReviewResponseDto } from '../services/review.service';
import { productService } from '../services/product.service';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const ReviewsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const { t, language } = useLanguage();
    const queryClient = useQueryClient();

    const [error, setError] = useState('');
    const [helpfulMessages, setHelpfulMessages] = useState<Record<number, string>>({});
    const [reportMessages, setReportMessages] = useState<Record<number, string>>({});
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [expandedMedia, setExpandedMedia] = useState<{ review: ReviewResponseDto; index: number } | null>(null);
    const [sortBy, setSortBy] = useState<'helpful' | 'newest'>('helpful');
    const [showSortOptions, setShowSortOptions] = useState(false);
    const [ratingFilter, setRatingFilter] = useState<number | null>(null);
    const [showRatingOptions, setShowRatingOptions] = useState(false);

    useEffect(() => {
        if (showSortOptions || showRatingOptions || expandedMedia !== null || deleteConfirm !== null) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showSortOptions, showRatingOptions, expandedMedia, deleteConfirm]);

    const { data: product, isLoading: productLoading, error: productError } = useQuery({
        queryKey: ['product', id],
        queryFn: async () => (await productService.getById(Number(id))).data,
        enabled: !!id,
    });

    const { data: reviews, isLoading: reviewsLoading, error: reviewsError } = useQuery({
        queryKey: ['product-reviews', id, ratingFilter],
        queryFn: async () => (await reviewService.getProductReviews(Number(id), ratingFilter || undefined)).data,
        enabled: !!id,
    });

    const { data: reviewSummary } = useQuery({
        queryKey: ['product-review-summary', id],
        queryFn: async () => (await reviewService.getProductSummary(Number(id))).data,
        enabled: !!id,
    });

    const deleteReviewMutation = useMutation({
        mutationFn: (reviewId: number) => reviewService.deleteReview(reviewId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-reviews', id] });
            queryClient.invalidateQueries({ queryKey: ['product-review-summary', id] });
            setDeleteConfirm(null);
        },
        onError: (err: any) => setError(err.response?.data || 'Failed to delete review'),
    });

    const helpfulMutation = useMutation({
        mutationFn: (reviewId: number) => reviewService.markHelpful(reviewId),
        onSuccess: (_, reviewId) => {
            setHelpfulMessages(prev => ({ ...prev, [reviewId]: t.reviews.thanksForFeedback || 'Thanks for your feedback!' }));
        },
        onError: (err: any) => setError(err.response?.data || 'Failed to mark helpful'),
    });

    const reportMutation = useMutation({
        mutationFn: (reviewId: number) => reviewService.reportReview(reviewId),
        onSuccess: (_, reviewId) => {
            setReportMessages(prev => ({ ...prev, [reviewId]: t.reviews.thanksForReport || "Thanks, we'll take appropriate action." }));
        },
        onError: (err: any) => setError(err.response?.data || 'Failed to report review'),
    });

    const sortedReviews = React.useMemo(() => {
        if (!reviews) return [];
        const sorted = [...reviews];
        if (sortBy === 'newest') {
            sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else {
            sorted.sort((a, b) => b.helpfulCount - a.helpfulCount);
        }
        return sorted;
    }, [reviews, sortBy]);

    if (productLoading || reviewsLoading) return <LoadingSpinner />;
    if (productError) return <div className="error-text">Failed to load product</div>;
    if (reviewsError) return <div className="error-text">Failed to load reviews</div>;

    const productName = product?.nameTranslations?.[language] || product?.name || '';

    return (
        <div className="reviews-page">
            <button onClick={() => navigate(-1)} className="btn btn-outline back-btn">← {t.admin.back}</button>

            {reviewSummary && (
                <div className="reviews-header">
                    <span className="reviews-rating-number">{reviewSummary.averageRating.toFixed(1)}</span>
                    <span className="reviews-rating-star">★</span>
                    <span className="reviews-product-name">{productName}</span>
                </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}

            <div className="reviews-filters">
                <div className="filter-dropdown">
                    <button
                        className="btn btn-outline btn-small"
                        disabled={showRatingOptions}
                        style={{ opacity: showRatingOptions ? 0.5 : 1, cursor: showRatingOptions ? 'not-allowed' : 'pointer' }}
                        onClick={() => {
                            setShowSortOptions(!showSortOptions);
                        }}
                    >
                        {sortBy === 'helpful' ? t.reviews.mostHelpful : t.reviews.newest} ▾
                    </button>
                    {showSortOptions && (
                        <>
                            <div className="filter-overlay-inline" onClick={() => setShowSortOptions(false)} />
                            <div className="filter-options-inline">
                                <button className={`filter-option ${sortBy === 'helpful' ? 'active' : ''}`} onClick={() => { setSortBy('helpful'); setShowSortOptions(false); }}>{t.reviews.mostHelpful}</button>
                                <button className={`filter-option ${sortBy === 'newest' ? 'active' : ''}`} onClick={() => { setSortBy('newest'); setShowSortOptions(false); }}>{t.reviews.newest}</button>
                            </div>
                        </>
                    )}
                </div>

                <div className="filter-dropdown">
                    <button
                        className="btn btn-outline btn-small"
                        disabled={showSortOptions}
                        style={{ opacity: showSortOptions ? 0.5 : 1, cursor: showSortOptions ? 'not-allowed' : 'pointer' }}
                        onClick={() => {
                            setShowRatingOptions(!showRatingOptions);
                        }}
                    >
                        {ratingFilter ? `${ratingFilter} ★` : t.reviews.allRatings} ▾
                    </button>
                    {showRatingOptions && (
                        <>
                            <div className="filter-overlay-inline" onClick={() => setShowRatingOptions(false)} />
                            <div className="filter-options-inline">
                                <button className={`filter-option ${ratingFilter === null ? 'active' : ''}`} onClick={() => { setRatingFilter(null); setShowRatingOptions(false); }}>{t.reviews.allRatings}</button>
                                {[5, 4, 3, 2, 1].map((star) => (
                                    <button key={star} className={`filter-option ${ratingFilter === star ? 'active' : ''}`} onClick={() => { setRatingFilter(star); setShowRatingOptions(false); }}>{star} ★</button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {sortedReviews.length > 0 ? (
                <div className="reviews-list">
                    {sortedReviews.map((review: ReviewResponseDto) => (
                        <div key={review.id} className="review-card">
                            <div className="review-header">
                                <div className="review-header-left">
                                    <span className="review-name">{review.customerName}</span>
                                    {review.isAdmin && <span className="admin-badge">{t.reviews.admin || 'Admin'}</span>}
                                    <span className="review-stars">{'★'.repeat(review.rating)}</span>
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
                                <div className="review-action-left">
                                    {helpfulMessages[review.id] ? (
                                        <span className="success-message">{helpfulMessages[review.id]}</span>
                                    ) : (
                                        <button onClick={() => helpfulMutation.mutate(review.id)} className="helpful-btn" disabled={helpfulMutation.isPending}>👍 {t.reviews.helpful} ({review.helpfulCount})</button>
                                    )}
                                </div>
                                <div className="review-action-right">
                                    {reportMessages[review.id] ? (
                                        <span className="success-message">{reportMessages[review.id]}</span>
                                    ) : (
                                        <button onClick={() => reportMutation.mutate(review.id)} className="report-btn" disabled={reportMutation.isPending}>🚩 {t.reviews.report}</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="no-reviews-yet">{t.reviews.noReviews}</p>
            )}

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{t.reviews.delete}</h3>
                        <p>{t.admin.confirmDelete}</p>
                        <div className="modal-actions">
                            <button onClick={() => deleteReviewMutation.mutate(deleteConfirm)} className="btn btn-danger" disabled={deleteReviewMutation.isPending}>
                                {deleteReviewMutation.isPending ? '...' : t.admin.delete}
                            </button>
                            <button onClick={() => setDeleteConfirm(null)} className="btn btn-outline">{t.admin.cancel}</button>
                        </div>
                    </div>
                </div>
            )}

            {expandedMedia && (
                <div className="media-overlay" onClick={() => setExpandedMedia(null)}>
                    <div className="media-expanded" onClick={(e) => e.stopPropagation()}>
                        <button className="media-close" onClick={() => setExpandedMedia(null)}>✕</button>

                        {expandedMedia.review.media.length > 1 && expandedMedia.index > 0 && (
                            <button className="media-nav prev" onClick={(e) => { e.stopPropagation(); setExpandedMedia(prev => prev !== null && prev.index > 0 ? { ...prev, index: prev.index - 1 } : prev); }}>‹</button>
                        )}

                        {expandedMedia.review.media[expandedMedia.index].mediaType === 'video' ? (
                            <video src={`${(import.meta as any).env?.VITE_API_URL}/api/reviews/${expandedMedia.review.id}/media/${expandedMedia.review.media[expandedMedia.index].id}`} controls className="media-video" />
                        ) : (
                            <img src={`${(import.meta as any).env?.VITE_API_URL}/api/reviews/${expandedMedia.review.id}/media/${expandedMedia.review.media[expandedMedia.index].id}`} alt="Review media" className="media-image" />
                        )}

                        {expandedMedia.review.media.length > 1 && expandedMedia.index < expandedMedia.review.media.length - 1 && (
                            <button className="media-nav next" onClick={(e) => { e.stopPropagation(); setExpandedMedia(prev => prev !== null && prev.index < prev.review.media.length - 1 ? { ...prev, index: prev.index + 1 } : prev); }}>›</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};