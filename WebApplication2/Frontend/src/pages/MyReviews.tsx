import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService, ReviewResponseDto, UpdateReviewDto } from '../services/review.service';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const MyReviews: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { language } = useLanguage();
    const [editingReview, setEditingReview] = useState<number | null>(null);
    const [editRating, setEditRating] = useState(5);
    const [editText, setEditText] = useState('');
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [error, setError] = useState('');

    const { data: reviews, isLoading } = useQuery({
        queryKey: ['my-reviews'],
        queryFn: async () => (await reviewService.getMyReviews()).data,
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: UpdateReviewDto }) => {
            const response = await reviewService.updateReview(id, data);
            if (newFiles.length > 0) {
                for (const file of newFiles) {
                    await reviewService.uploadMedia(id, file);
                }
            }
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
            setEditingReview(null);
            setNewFiles([]);
        },
        onError: (err: any) => setError(err.response?.data || 'Failed'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => reviewService.deleteReview(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-reviews'] }),
        onError: (err: any) => setError(err.response?.data || 'Failed'),
    });

    const deleteMediaMutation = useMutation({
        mutationFn: ({ reviewId, mediaId }: { reviewId: number; mediaId: number }) =>
            reviewService.deleteMedia(reviewId, mediaId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-reviews'] }),
    });

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="my-reviews-page">
            <button onClick={() => navigate(-1)} className="btn btn-outline back-btn">← Back</button>
            <h1>My Reviews</h1>

            {error && <div className="alert alert-error">{error}</div>}

            {reviews && reviews.length > 0 ? (
                <div className="reviews-list">
                    {reviews.map((review: ReviewResponseDto) => (
                        <div key={review.id} className="review-card">
                            {editingReview === review.id ? (
                                <div className="edit-review-form">
                                    <div className="star-picker">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setEditRating(star)}
                                                className={`star-btn ${star <= editRating ? 'active' : ''}`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        rows={3}
                                        className="review-textarea"
                                    />
                                    <input
                                        type="file"
                                        accept="image/*,video/*"
                                        multiple
                                        onChange={(e) => setNewFiles(Array.from(e.target.files || []))}
                                        className="file-input"
                                    />
                                    <div className="modal-actions">
                                        <button
                                            onClick={() => updateMutation.mutate({ id: review.id, data: { rating: editRating, text: editText } })}
                                            className="btn btn-primary btn-small"
                                        >
                                            Save
                                        </button>
                                        <button onClick={() => setEditingReview(null)} className="btn btn-outline btn-small">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Link to={`/products/${review.productId}`} className="review-product-link">
                                        {review.productName}
                                    </Link>

                                    <div className="review-header">
                                        <div>
                                            <span className="review-stars">{'★'.repeat(review.rating)}</span>
                                            <span className="review-date" style={{ marginLeft: 8 }}>
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => {
                                                    setEditingReview(review.id);
                                                    setEditRating(review.rating);
                                                    setEditText(review.text);
                                                }}
                                                className="btn btn-outline btn-small"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deleteMutation.mutate(review.id)}
                                                className="btn btn-danger btn-small"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    <p className="review-text">{review.text}</p>

                                    {review.media.length > 0 && (
                                        <div className="review-media-grid">
                                            {review.media.map((media) => (
                                                <div key={media.id} className="review-media-item">
                                                    {media.mediaType === 'video' ? (
                                                        <span className="review-media-video">🎬</span>
                                                    ) : (
                                                        <img
                                                            src={`${(import.meta as any).env?.VITE_API_URL}/api/reviews/${review.id}/media/${media.id}`}
                                                            alt={media.fileName}
                                                            className="review-media-thumb-img"
                                                        />
                                                    )}
                                                    <button
                                                        onClick={() => deleteMediaMutation.mutate({ reviewId: review.id, mediaId: media.id })}
                                                        className="delete-media-btn"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="no-reviews-yet">You haven't written any reviews yet</p>
            )}
        </div>
    );
};