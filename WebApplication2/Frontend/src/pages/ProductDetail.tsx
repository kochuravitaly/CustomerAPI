import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { variantService, ProductColorDto } from '../services/variant.service';
import { reviewService, ReviewResponseDto } from '../services/review.service';
import { cartService } from '../services/cart.service';
import { flashSaleService, FlashSaleResponseDto } from '../services/coupon.service';
import { wishlistService } from '../services/wishlist.service';
import { profileService } from '../services/profile.service';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { ProductCard } from '../components/ProductCard';
import { ProductResponseDto } from '../types/product';

export const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, isAdmin } = useAuth();
    const { t, language } = useLanguage();
    const { formatPrice } = useCurrency();
    const queryClient = useQueryClient();
    const touchStartX = useRef<number | null>(null);

    const [quantity, setQuantity] = useState(1);
    const [mainImageIndex, setMainImageIndex] = useState(0);
    const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
    const [selectedSizeName, setSelectedSizeName] = useState<string | null>(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [reviewFiles, setReviewFiles] = useState<File[]>([]);
    const [reviewPreviews, setReviewPreviews] = useState<string[]>([]);
    const [expandedReviewMedia, setExpandedReviewMedia] = useState<{ review: ReviewResponseDto; index: number } | null>(null);
    const [expandedReviewPreviewIndex, setExpandedReviewPreviewIndex] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [helpfulMessages, setHelpfulMessages] = useState<Record<number, string>>({});
    const [reportMessages, setReportMessages] = useState<Record<number, string>>({});
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);
    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState<number | null>(null);
    const [couponError, setCouponError] = useState('');
    const [couponAppliedKey, setCouponAppliedKey] = useState('');
    const [flashSale, setFlashSale] = useState<FlashSaleResponseDto | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isInWishlist, setIsInWishlist] = useState(false);

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

    useEffect(() => {
        if (showReviewForm || expandedImageIndex !== null || expandedReviewMedia !== null || expandedReviewPreviewIndex !== null || deleteConfirm !== null) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showReviewForm, expandedImageIndex, expandedReviewMedia, expandedReviewPreviewIndex, deleteConfirm]);

    useEffect(() => {
        if (!isAuthenticated || !id) return;
        const checkWishlist = async () => {
            try {
                const response = await wishlistService.isInWishlist(Number(id));
                setIsInWishlist(response.data);
            } catch { }
        };
        checkWishlist();
    }, [id, isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated || !id) return;
        const recordWatch = async () => {
            try {
                await profileService.recordWatch(Number(id));
            } catch { }
        };
        recordWatch();
    }, [id, isAuthenticated]);

    const { data: product, isLoading } = useQuery({
        queryKey: ['product', id],
        queryFn: async () => (await productService.getById(Number(id))).data,
        enabled: !!id,
    });

    const { data: recommendations } = useQuery({
        queryKey: ['recommendations', id],
        queryFn: async () => (await productService.getRecommendations(Number(id))).data,
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
                                setCouponCode('');
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

    const { data: colors, error: colorsError } = useQuery({
        queryKey: ['product-colors', id],
        queryFn: async () => (await variantService.getColors(Number(id))).data,
        enabled: !!id,
    });

    const { data: variants, error: variantsError } = useQuery({
        queryKey: ['product-variants', id],
        queryFn: async () => (await variantService.getVariants(Number(id))).data,
        enabled: !!id,
    });

    const { data: reviews, error: reviewsError } = useQuery({
        queryKey: ['product-reviews', id],
        queryFn: async () => (await reviewService.getProductReviews(Number(id))).data,
        enabled: !!id,
    });

    const { data: reviewSummary, error: reviewSummaryError } = useQuery({
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
            const response = await reviewService.createReview({
                productId: Number(id),
                rating: reviewRating,
                text: reviewText.trim() || ' '
            });
            if (reviewFiles.length > 0 && response.data) {
                for (const file of reviewFiles) {
                    if (file.size > 10 * 1024 * 1024) {
                        throw new Error('File size must be less than 10MB');
                    }
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
            setReviewPreviews([]);
        },
        onError: (err: any) => setError(err.response?.data || err.message || 'Failed to submit review'),
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

    const addToCartMutation = useMutation({
        mutationFn: () => cartService.addItem({
            productId: Number(id),
            quantity,
            colorId: selectedColorId || undefined,
            sizeName: selectedSizeName || undefined,
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            alert(t.product.added);
        },
        onError: (err: any) => setError(err.response?.data || 'Failed to add to cart'),
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
                setCouponCode('');
            }
        },
        onError: (err: any) => {
            if (err.message === 'Coupon already applied') {
                setCouponError(t.product.applied);
            } else {
                setCouponError(err.response?.data?.error || err.response?.data || 'Invalid coupon');
            }
            setCouponDiscount(null);
            setCouponAppliedKey('');
        },
    });

    const removeCoupon = () => {
        localStorage.removeItem(`coupon_${id}`);
        setCouponAppliedKey('');
        setCouponDiscount(null);
        setCouponCode('');
        setCouponError('');
    };

    const toggleWishlist = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        try {
            if (isInWishlist) {
                await wishlistService.removeFromWishlist(Number(id));
                setIsInWishlist(false);
            } else {
                await wishlistService.addToWishlist(Number(id));
                setIsInWishlist(true);
            }
            queryClient.invalidateQueries({ queryKey: ['wishlist-count'] });
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
        } catch (err: any) {
            setError(err.response?.data || 'Failed to update wishlist');
        }
    };

    const handleAddToCart = () => {
        if (!isAuthenticated) { navigate('/login'); return; }
        addToCartMutation.mutate();
    };

    const handleBuyNow = () => {
        if (!isAuthenticated) { navigate('/login'); return; }
        navigate('/checkout', {
            replace: true,
            state: {
                directBuy: {
                    productId: Number(id),
                    quantity,
                    colorId: selectedColorId || undefined,
                    sizeName: selectedSizeName || undefined,
                }
            }
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setReviewFiles(files);
        const previews = files.map(file => URL.createObjectURL(file));
        setReviewPreviews(previews);
    };

    const removeReviewFile = (index: number) => {
        setReviewFiles(prev => prev.filter((_, i) => i !== index));
        setReviewPreviews(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleMainTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleMainTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const diff = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(diff) > 50) {
            if (diff > 0 && mainImageIndex > 0) {
                setMainImageIndex(prev => prev - 1);
            } else if (diff < 0 && mainImageIndex < displayImages.length - 1) {
                setMainImageIndex(prev => prev + 1);
            }
        }
        touchStartX.current = null;
    };

    const handleExpandTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleExpandTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const diff = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(diff) > 50) {
            if (diff > 0 && expandedImageIndex !== null && expandedImageIndex > 0) {
                setExpandedImageIndex(prev => prev !== null ? prev - 1 : prev);
            } else if (diff < 0 && expandedImageIndex !== null && expandedImageIndex < displayImages.length - 1) {
                setExpandedImageIndex(prev => prev !== null ? prev + 1 : prev);
            }
        }
        touchStartX.current = null;
    };

    const handleReviewMediaTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleReviewMediaTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const diff = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(diff) > 50) {
            if (expandedReviewMedia !== null) {
                if (diff > 0 && expandedReviewMedia.index > 0) {
                    setExpandedReviewMedia(prev => prev !== null ? { ...prev, index: prev.index - 1 } : prev);
                } else if (diff < 0 && expandedReviewMedia.index < expandedReviewMedia.review.media.length - 1) {
                    setExpandedReviewMedia(prev => prev !== null ? { ...prev, index: prev.index + 1 } : prev);
                }
            } else if (expandedReviewPreviewIndex !== null) {
                if (diff > 0 && expandedReviewPreviewIndex > 0) {
                    setExpandedReviewPreviewIndex(prev => prev !== null ? prev - 1 : prev);
                } else if (diff < 0 && expandedReviewPreviewIndex < reviewPreviews.length - 1) {
                    setExpandedReviewPreviewIndex(prev => prev !== null ? prev + 1 : prev);
                }
            }
        }
        touchStartX.current = null;
    };

    if (isLoading) return <LoadingSpinner />;
    if (!product) return <ErrorMessage message="Product not found" />;

    if (colorsError || variantsError || reviewsError || reviewSummaryError) {
        return <ErrorMessage message="Failed to load product details" />;
    }

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

    const genderLabel = product.gender !== undefined && product.gender !== null
        ? [t.product.unisex, t.product.men, t.product.women][product.gender]
        : null;

    const styleName = product.styleNameTranslations?.[language] || product.styleName || '';
    const occasionName = product.occasionNameTranslations?.[language] || product.occasionName || '';
    const patternName = product.patternNameTranslations?.[language] || product.patternName || '';
    const materialName = product.materialNameTranslations?.[language] || product.materialName || '';

    const seasonsData = product.seasonsJson ? (() => { try { const parsed = JSON.parse(product.seasonsJson); if (typeof parsed === 'object' && !Array.isArray(parsed)) return parsed; return {}; } catch { return {}; } })() : {};
    const ageGroupsData = product.ageGroupsJson ? (() => { try { const parsed = JSON.parse(product.ageGroupsJson); if (typeof parsed === 'object' && !Array.isArray(parsed)) return parsed; return {}; } catch { return {}; } })() : {};

    const seasonsList = (seasonsData[language] || seasonsData['en'] || []) as string[];
    const ageGroupsList = (ageGroupsData[language] || ageGroupsData['en'] || []) as string[];

    const imagesForSelectedColor = selectedColor
        ? product.images.filter(img => img.colorId === selectedColor.id || img.colorId === null || img.colorId === undefined)
        : product.images;
    const displayImages = imagesForSelectedColor.length > 0 ? imagesForSelectedColor : product.images;
    const safeMainImageIndex = mainImageIndex < displayImages.length ? mainImageIndex : 0;
    const mainImage = displayImages[safeMainImageIndex];

    const getImageForColor = (colorId: number) => {
        return product.images.find(img => img.colorId === colorId);
    };

    return (
        <div className="product-detail-page">
            <button onClick={() => navigate(-1)} className="btn btn-outline back-btn">← {t.product.back}</button>

            <div className="product-detail-container">
                <div className="product-images" style={{ overflow: 'hidden', maxWidth: '100%' }}>
                    <div
                        style={{ position: 'relative' }}
                        onTouchStart={handleMainTouchStart}
                        onTouchEnd={handleMainTouchEnd}
                    >
                        <button
                            className="main-image-btn"
                            onClick={() => setExpandedImageIndex(safeMainImageIndex)}
                            type="button"
                        >
                            {mainImage ? (
                                <img src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${product.id}/images/${mainImage.id}`} alt={productName} />
                            ) : (
                                <div className="placeholder-image">🛍️</div>
                            )}
                        </button>
                        <button
                            onClick={toggleWishlist}
                            className={`wishlist-heart-btn ${isInWishlist ? 'active' : ''}`}
                            title={t.profile.wishlist}
                        >
                            {isInWishlist ? '❤️' : '🤍'}
                        </button>
                    </div>
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

                <div className="product-info" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                    <h1 className="product-title">{productName}</h1>

                    {flashSale && (
                        <div className="flash-sale-banner-amazon">
                            <span className="flash-sale-badge-amazon">⚡ {t.product.flashSale}</span>
                            <span className="flash-sale-percent-amazon">-{flashSale.discountPercentage}%</span>
                            <span className="flash-sale-divider">|</span>
                            <span className="flash-sale-timer-amazon">{t.product.endsIn} {timeLeft}</span>
                        </div>
                    )}

                    <div className="product-price-large">
                        {flashSale || couponDiscount ? (
                            <>
                                <span style={{ textDecoration: 'line-through', fontSize: '18px', color: '#71717A' }}>{formatPrice(product.price)}</span>{' '}
                                <span style={{ color: '#10B981' }}>{formatPrice(finalPrice)}</span>
                            </>
                        ) : (
                            <>{formatPrice(product.price)}</>
                        )}
                    </div>

                    {colors && colors.length > 0 && (
                        <div className="product-section">
                            <div style={{
                                overflowX: 'auto',
                                display: 'flex',
                                flexWrap: 'nowrap',
                                gap: '16px',
                                paddingBottom: '8px',
                                maxWidth: '100%',
                                WebkitOverflowScrolling: 'touch',
                            }}>
                                {colors.map((color: ProductColorDto) => {
                                    const colorImage = getImageForColor(color.id);
                                    return (
                                        <div
                                            key={color.id}
                                            onClick={() => {
                                                setSelectedColorId(color.id);
                                                setMainImageIndex(0);
                                            }}
                                            style={{
                                                border: selectedColorId === color.id ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                minWidth: '130px',
                                                maxWidth: '130px',
                                                overflow: 'hidden',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {colorImage ? (
                                                <img
                                                    src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${product.id}/images/${colorImage.id}`}
                                                    alt={color.nameTranslations?.[language] || color.name}
                                                    style={{ width: '130px', height: '120px', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div style={{ width: '130px', height: '120px', backgroundColor: color.hexCode }} />
                                            )}
                                            <div style={{ padding: '6px 10px', textAlign: 'left' }}>
                                                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '2px' }}>
                                                    {color.nameTranslations?.[language] || color.name}
                                                </div>
                                                <div style={{ fontSize: '13px', fontWeight: '700' }}>
                                                    {formatPrice(finalPrice)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {sizesForSelectedColor.length > 0 && (
                        <div className="product-section">
                            <h3>{t.product.size}:</h3>
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
                            {selectedVariant && (
                                <div className="variant-stock-info" style={{ marginTop: '8px' }}>
                                    {selectedVariant.stockQuantity > 0 ? (
                                        <span className="in-stock">✓ {t.product.inStock}: {selectedVariant.stockQuantity}</span>
                                    ) : (
                                        <span className="out-of-stock-text">✗ {t.product.outOfStock}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <p className="product-description-full">{productDescription}</p>

                    {error && <div className="alert alert-error">{error}</div>}

                    <div className="add-to-cart-row" style={{ marginBottom: '12px' }}>
                        <div className="quantity-selector">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="quantity-btn">−</button>
                            <span className="quantity-display">{quantity}</span>
                            <button onClick={() => setQuantity(Math.min(selectedVariant?.stockQuantity || product.stockQuantity, quantity + 1))} className="quantity-btn">+</button>
                        </div>
                        <button
                            onClick={handleAddToCart}
                            disabled={(selectedVariant ? selectedVariant.stockQuantity === 0 : product.stockQuantity === 0) || addToCartMutation.isPending}
                            className="btn btn-primary btn-large"
                        >
                            {addToCartMutation.isPending ? '...' : t.product.addToCart}
                        </button>
                    </div>

                    <button
                        onClick={handleBuyNow}
                        disabled={(selectedVariant ? selectedVariant.stockQuantity === 0 : product.stockQuantity === 0)}
                        className="btn btn-primary btn-large"
                        style={{ width: '100%', marginBottom: '12px' }}
                    >
                        {t.product.buyNow || 'Buy Now'}
                    </button>

                    <div className="product-attributes-list">
                        {genderLabel && (
                            <div className="attr-line"><span className="attr-label">{t.product.gender}:</span> {genderLabel}</div>
                        )}
                        {seasonsList.length > 0 && (
                            <div className="attr-line">
                                <span className="attr-label">{t.product.season}:</span>{' '}
                                {seasonsList.map((s: string, i: number) => (
                                    <span key={i}>{s}{i < seasonsList.length - 1 ? ', ' : ''}</span>
                                ))}
                            </div>
                        )}
                        {ageGroupsList.length > 0 && (
                            <div className="attr-line">
                                <span className="attr-label">{t.product.ageGroup}:</span>{' '}
                                {ageGroupsList.map((a: string, i: number) => (
                                    <span key={i}>{a}{i < ageGroupsList.length - 1 ? ', ' : ''}</span>
                                ))}
                            </div>
                        )}
                        {materialName && (
                            <div className="attr-line">
                                <span className="attr-label">{t.product.material}:</span> {materialName}
                            </div>
                        )}
                        {styleName && (
                            <div className="attr-line"><span className="attr-label">{t.product.style}:</span> {styleName}</div>
                        )}
                        {occasionName && (
                            <div className="attr-line"><span className="attr-label">{t.product.occasion}:</span> {occasionName}</div>
                        )}
                        {patternName && (
                            <div className="attr-line"><span className="attr-label">{t.product.pattern}:</span> {patternName}</div>
                        )}
                    </div>

                    <div className="coupon-input-section">
                        <div className="coupon-input-row">
                            <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                placeholder={t.product.enterCoupon}
                                disabled={!!couponAppliedKey}
                                style={{ maxWidth: '200px', padding: '10px 16px', borderRadius: '9999px', border: '1px solid var(--border-color)', background: couponAppliedKey ? '#F4F4F5' : 'var(--bg-tertiary)', fontSize: '14px' }}
                            />
                            {couponAppliedKey ? (
                                <button onClick={removeCoupon} className="btn btn-danger btn-small">
                                    {t.cart.remove}
                                </button>
                            ) : (
                                <button onClick={() => applyCouponMutation.mutate()} className="btn btn-outline btn-small" disabled={applyCouponMutation.isPending}>
                                    {applyCouponMutation.isPending ? '...' : t.product.apply}
                                </button>
                            )}
                        </div>
                        {couponError && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{couponError}</p>}
                        {couponDiscount !== null && <p style={{ color: '#10B981', fontSize: '12px', marginTop: '4px' }}>{t.product.couponDiscount}: -{formatPrice(couponDiscount)}</p>}
                    </div>
                </div>
            </div>

            <div className="reviews-section">
                <h2>{t.reviews.title}</h2>
                <Link to={`/products/${product.id}/reviews`} style={{ display: 'flex', alignItems: 'center', gap: '16px', textDecoration: 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px', justifyContent: 'center' }}>
                        <span style={{ fontSize: '32px', fontWeight: '700', color: '#18181B', lineHeight: '1' }}>{avgRating.toFixed(1)}</span>
                        <span style={{ fontSize: '12px', color: '#71717A' }}>{totalReviews} {t.reviews.totalReviews}</span>
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
                        {t.reviews.writeReview}
                    </button>
                )}

                {showReviewForm && (
                    <div className="review-form-overlay" onClick={() => setShowReviewForm(false)}>
                        <div className="review-form-panel" onClick={(e) => e.stopPropagation()}>
                            <h3>{t.reviews.writeReview}</h3>
                            <div className="star-picker">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} onClick={() => setReviewRating(star)} className={`star-btn ${star <= reviewRating ? 'active' : ''}`}>★</button>
                                ))}
                            </div>
                            <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={4} placeholder={t.reviews.yourReview} className="review-textarea" />

                            {reviewPreviews.length > 0 && (
                                <div className="review-file-previews" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                                    {reviewPreviews.map((preview, index) => (
                                        <div key={index} style={{ position: 'relative', width: '60px', height: '60px' }}>
                                            <button
                                                onClick={() => setExpandedReviewPreviewIndex(index)}
                                                style={{ width: '100%', height: '100%', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                                            >
                                                <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                            </button>
                                            <button
                                                onClick={() => removeReviewFile(index)}
                                                style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '10px' }}
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} className="file-input" />
                            <div className="modal-actions">
                                <button onClick={() => createReviewMutation.mutate()} className="btn btn-primary" disabled={createReviewMutation.isPending}>
                                    {createReviewMutation.isPending ? '...' : t.reviews.submit}
                                </button>
                                <button onClick={() => setShowReviewForm(false)} className="btn btn-outline">{t.admin.cancel}</button>
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
                                            {review.isAdmin && <span className="admin-badge">{t.reviews.admin || 'Admin'}</span>}
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
                                                <button key={media.id} onClick={() => setExpandedReviewMedia({ review, index })} className="review-media-thumb">
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
                        {reviews.length > 3 && (
                            <Link to={`/products/${product.id}/reviews`} className="see-all-reviews-btn">
                                {t.reviews.seeAll} →
                            </Link>
                        )}
                    </>
                )}
            </div>

            {recommendations && recommendations.length > 0 && (
                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '40px 0 20px' }} />
            )}

            {recommendations && recommendations.length > 0 && (
                <div className="recommendations-section">
                    <h2 style={{ marginBottom: '16px' }}>{t.product.customersAlsoBought || 'Customers Also Bought'}</h2>
                    <div className="products-grid">
                        {recommendations.map((rec) => {
                            const productForCard: ProductResponseDto = {
                                id: rec.productId,
                                name: rec.productNameTranslations?.[language] || rec.productName,
                                description: rec.productDescriptionTranslations?.[language] || rec.productDescription || '',
                                price: rec.price,
                                stockQuantity: rec.stockQuantity || 0,
                                categoryId: 0,
                                categoryName: '',
                                createdAt: '',
                                updatedAt: '',
                                images: rec.images || [],
                                nameTranslations: rec.productNameTranslations,
                                descriptionTranslations: rec.productDescriptionTranslations,
                            };

                            return (
                                <ProductCard
                                    key={rec.productId}
                                    product={productForCard}
                                    extraInfo={
                                        <span>
                                            {t.product.boughtTogether || 'Bought together'}: {rec.timesBoughtTogether}x
                                        </span>
                                    }
                                />
                            );
                        })}
                    </div>
                    <button
                        onClick={() => navigate(`/products/${product.id}/recommendations`)}
                        className="see-more-link"
                        style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                    >
                        {t.product.seeMore || 'See More'} →
                    </button>
                </div>
            )}

            {similarProducts && similarProducts.length > 0 && (
                <div className="similar-products-section">
                    <h2 style={{ marginBottom: '16px' }}>{t.product.similarProducts || 'Similar Products'}</h2>
                    <div className="products-grid">
                        {similarProducts.map((sp) => (
                            <ProductCard key={sp.id} product={sp} />
                        ))}
                    </div>
                    <button
                        onClick={() => navigate(`/products/${product.id}/similar`)}
                        className="see-more-link"
                        style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                    >
                        {t.product.seeMore || 'See More'} →
                    </button>
                </div>
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

            {expandedImageIndex !== null && displayImages.length > 0 && (
                <div className="media-overlay" onClick={() => setExpandedImageIndex(null)}>
                    <div
                        className="media-expanded"
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={handleExpandTouchStart}
                        onTouchEnd={handleExpandTouchEnd}
                    >
                        <button className="media-close" onClick={(e) => { e.stopPropagation(); setExpandedImageIndex(null); }}>✕</button>

                        {displayImages.length > 1 && expandedImageIndex > 0 && (
                            <button className="media-nav prev" onClick={(e) => { e.stopPropagation(); setExpandedImageIndex(prev => prev !== null ? prev - 1 : prev); }}>‹</button>
                        )}

                        <img src={`${(import.meta as any).env?.VITE_API_URL}/api/products/${product.id}/images/${displayImages[expandedImageIndex].id}`} alt={productName} className="media-image" />

                        {displayImages.length > 1 && expandedImageIndex < displayImages.length - 1 && (
                            <button className="media-nav next" onClick={(e) => { e.stopPropagation(); setExpandedImageIndex(prev => prev !== null ? prev + 1 : prev); }}>›</button>
                        )}
                    </div>
                </div>
            )}

            {expandedReviewMedia && (
                <div className="media-overlay" onClick={() => setExpandedReviewMedia(null)}>
                    <div
                        className="media-expanded"
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={handleReviewMediaTouchStart}
                        onTouchEnd={handleReviewMediaTouchEnd}
                    >
                        <button className="media-close" onClick={(e) => { e.stopPropagation(); setExpandedReviewMedia(null); }}>✕</button>

                        {expandedReviewMedia.review.media.length > 1 && expandedReviewMedia.index > 0 && (
                            <button className="media-nav prev" onClick={(e) => { e.stopPropagation(); setExpandedReviewMedia(prev => prev !== null && prev.index > 0 ? { ...prev, index: prev.index - 1 } : prev); }}>‹</button>
                        )}

                        {expandedReviewMedia.review.media[expandedReviewMedia.index].mediaType === 'video' ? (
                            <video src={`${(import.meta as any).env?.VITE_API_URL}/api/reviews/${expandedReviewMedia.review.id}/media/${expandedReviewMedia.review.media[expandedReviewMedia.index].id}`} controls className="media-video" />
                        ) : (
                            <img src={`${(import.meta as any).env?.VITE_API_URL}/api/reviews/${expandedReviewMedia.review.id}/media/${expandedReviewMedia.review.media[expandedReviewMedia.index].id}`} alt="Review media" className="media-image" />
                        )}

                        {expandedReviewMedia.review.media.length > 1 && expandedReviewMedia.index < expandedReviewMedia.review.media.length - 1 && (
                            <button className="media-nav next" onClick={(e) => { e.stopPropagation(); setExpandedReviewMedia(prev => prev !== null && prev.index < prev.review.media.length - 1 ? { ...prev, index: prev.index + 1 } : prev); }}>›</button>
                        )}
                    </div>
                </div>
            )}

            {expandedReviewPreviewIndex !== null && reviewPreviews.length > 0 && (
                <div className="media-overlay" onClick={() => setExpandedReviewPreviewIndex(null)}>
                    <div
                        className="media-expanded"
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={handleReviewMediaTouchStart}
                        onTouchEnd={handleReviewMediaTouchEnd}
                    >
                        <button className="media-close" onClick={(e) => { e.stopPropagation(); setExpandedReviewPreviewIndex(null); }}>✕</button>

                        {reviewPreviews.length > 1 && expandedReviewPreviewIndex > 0 && (
                            <button className="media-nav prev" onClick={(e) => { e.stopPropagation(); setExpandedReviewPreviewIndex(prev => prev !== null ? prev - 1 : prev); }}>‹</button>
                        )}

                        <img src={reviewPreviews[expandedReviewPreviewIndex]} alt="" className="media-image" />

                        {reviewPreviews.length > 1 && expandedReviewPreviewIndex < reviewPreviews.length - 1 && (
                            <button className="media-nav next" onClick={(e) => { e.stopPropagation(); setExpandedReviewPreviewIndex(prev => prev !== null ? prev + 1 : prev); }}>›</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};