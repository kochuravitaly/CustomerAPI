import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService, ReviewResponseDto } from '../services/review.service';
import { productService } from '../services/product.service';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useLanguage } from '../context/LanguageContext';

export const ReviewsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { isAdmin } = useAuth();
    const { language } = useLanguage();
    const [sortBy, setSortBy] = useState<'helpful' | 'newest'>('newest');
    const [selectedRating, setSelectedRating] = useState<number | null>(null);
    const [activePanel, setActivePanel] = useState<'sort' | 'rating' | null>(null);
    const [helpfulMessages, setHelpfulMessages] = useState<Record<number, string>>({});
    const [reportMessages, setReportMessages] = useState<Record<number, string>>({});
    const [expandedMedia, setExpandedMedia] = useState<{ review: ReviewResponseDto; index: number } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const { data: product } = useQuery({
        queryKey: ['product', id],
        queryFn: async () => (await productService.getById(Number(id))).data,
        enabled: !!id,
    });

    const { data: reviews, isLoading } = useQuery({
        queryKey: ['product-reviews', id, selectedRating],
        queryFn: async () => (await reviewService.getProductReviews(Number(id), selectedRating || undefined)).data,
        enabled: !!id,
    });

    const { data: summary } = useQuery({
        queryKey: ['product-review-summary', id],
        queryFn: async () => (await reviewService.getProductSummary(Number(id))).data,
        enabled: !!id,
    });

    const helpfulMutation = useMutation({
        mutationFn: (reviewId: number) => reviewService.markHelpful(reviewId),
        onSuccess: (_, reviewId) => setHelpfulMessages(prev => ({ ...prev, [reviewId]: 'Thanks for your feedback!' })),
    });

    const reportMutation = useMutation({
        mutationFn: (reviewId: number) => reviewService.reportReview(reviewId),
        onSuccess: (_, reviewId) => setReportMessages(prev => ({ ...prev, [reviewId]: "Thanks for your report, we'll take appropriate action." })),
    });

    const deleteReviewMutation = useMutation({
        mutationFn: (reviewId: number) => reviewService.deleteReview(reviewId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-reviews', id] });
            queryClient.invalidateQueries({ queryKey: ['product-review-summary', id] });
            setDeleteConfirm(null);
        },
    });

    const sortedReviews = reviews
        ? [...reviews].sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return (b.helpfulCount || 0) - (a.helpfulCount || 0);
        })
        : [];

    const productName = product?.nameTranslations?.[language] || product?.name || '';
    const avgRating = summary?.averageRating || 0;

    return (
        <div className="reviews-page">
            {activePanel && <div className="filter-overlay-inline" onClick={() => setActivePanel(null)} />}

            <button onClick={() => navigate(-1)} className="btn btn-outline back-btn">← Back</button>

            <div className="reviews-page-header">
                <h1>{productName}</h1>
                <div className="avg-rating-badge">
                    ★ {avgRating.toFixed(1)}
                </div>
            </div>

            <div className="reviews-filters">
                <div className="filter-dropdown">
                    <button
                        onClick={() => setActivePanel(activePanel === 'sort' ? null : 'sort')}
                        className="btn btn-outline btn-small"
                        disabled={activePanel === 'rating'}
                    >
                        {sortBy === 'newest' ? 'Newest' : 'Most Helpful'} ▾
                    </button>
                    {activePanel === 'sort' && (
                        <div className="filter-options-inline">
                            <button onClick={() => { setSortBy('newest'); setActivePanel(null); }} className={`filter-option ${sortBy === 'newest' ? 'active' : ''}`}>Newest</button>
                            <button onClick={() => { setSortBy('helpful'); setActivePanel(null); }} className={`filter-option ${sortBy === 'helpful' ? 'active' : ''}`}>Most Helpful</button>
                        </div>
                    )}
                </div>

                <div className="filter-dropdown">
                    <button
                        onClick={() => setActivePanel(activePanel === 'rating' ? null : 'rating')}
                        className="btn btn-outline btn-small"
                        disabled={activePanel === 'sort'}
                    >
                        {selectedRating ? `${selectedRating} ★` : 'All Ratings'} ▾
                    </button>
                    {activePanel === 'rating' && (
                        <div className="filter-options-inline">
                            {[5, 4, 3, 2, 1].map((star) => (
                                <button key={star} onClick={() => { setSelectedRating(selectedRating === star ? null : star); setActivePanel(null); }} className={`filter-option ${selectedRating === star ? 'active' : ''}`}>
                                    {star} ★
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isLoading ? (
                <LoadingSpinner />
            ) : sortedReviews.length > 0 ? (
                <div className="reviews-list">
                    {sortedReviews.map((review: ReviewResponseDto) => (
                        <div key={review.id} className="review-card">
                            <div className="review-header">
                                <div>
                                    <strong>{review.customerName}</strong>
                                    {review.isAdmin && <span className="admin-badge">Admin</span>}
                                    <div className="review-stars-under-name">{'★'.repeat(review.rating)}</div>
                                </div>
                                <div className="review-header-actions">
                                    {isAdmin && (
                                        <button onClick={() => setDeleteConfirm(review.id)} className="delete-review-btn">🗑️</button>
                                    )}
                                </div>
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
            ) : (
                <p className="no-reviews-yet">No reviews yet</p>
            )}

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
        </div>
    );
};