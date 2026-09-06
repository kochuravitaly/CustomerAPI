import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { homeSectionService, HomeSectionResponseDto } from '../services/homeSection.service';
import { profileService } from '../services/profile.service';
import { ProductCard } from '../components/ProductCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useLanguage } from '../context/LanguageContext';

export const Home: React.FC = () => {
    const { data: sections, isLoading, error } = useQuery({
        queryKey: ['home-sections'],
        queryFn: async () => (await homeSectionService.getActive()).data,
    });

    const { t } = useLanguage();

    if (isLoading) return <LoadingSpinner />;

    if (error) {
        return <div className="error-text">Failed to load sections</div>;
    }

    if (!sections || sections.length === 0) {
        return <div className="no-products-in-section">{t.admin.noItems}</div>;
    }

    return (
        <div className="home-page">
            {sections?.map((section: HomeSectionResponseDto) => (
                <HomeSectionBlock key={section.id} section={section} />
            ))}

            <WatchHistorySection />

            <Link to="/categories" className="all-sections-link">
                {t.categories.all} →
            </Link>
        </div>
    );
};

const HomeSectionBlock: React.FC<{ section: HomeSectionResponseDto }> = ({ section }) => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();

    const { data: productsData, isLoading, error } = useQuery({
        queryKey: ['home-section-products', section.id],
        queryFn: async () => (await homeSectionService.getProducts(section.id, 1, section.productsToShow)).data,
    });

    const sectionTitle = section.titleTranslations?.[language] || section.title;

    const handleSeeMore = () => {
        if (section.title === 'Best Sellers') {
            navigate('/products?sortBy=orders&sortDirection=desc');
            return;
        }

        try {
            const filters = JSON.parse(section.filterJson);
            const params = new URLSearchParams();

            if (filters.gender !== undefined) params.set('gender', String(filters.gender));
            if (filters.season !== undefined) params.set('season', String(filters.season));
            if (filters.ageGroup !== undefined) params.set('ageGroup', String(filters.ageGroup));
            if (filters.materialId !== undefined) params.set('materialId', String(filters.materialId));
            if (filters.styleId !== undefined) params.set('styleId', String(filters.styleId));
            if (filters.occasionId !== undefined) params.set('occasionId', String(filters.occasionId));
            if (filters.patternId !== undefined) params.set('patternId', String(filters.patternId));
            if (filters.categoryId !== undefined) params.set('categoryId', String(filters.categoryId));
            if (filters.search !== undefined) params.set('search', String(filters.search));

            if (params.toString()) {
                navigate(`/search?${params.toString()}`);
            } else {
                navigate('/products');
            }
        } catch {
            navigate('/products');
        }
    };

    return (
        <div className="home-section">
            <div className="home-section-header">
                <h2 className="home-section-title">{sectionTitle}</h2>
                <button onClick={handleSeeMore} className="see-more-btn">
                    {t.home.seeMore} →
                </button>
            </div>

            {isLoading ? (
                <LoadingSpinner />
            ) : error ? (
                <div className="error-text">Failed to load products</div>
            ) : productsData && productsData.items.length > 0 ? (
                <div className="products-grid">
                    {productsData.items.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <p className="no-products-in-section">{t.admin.noItems}</p>
            )}
        </div>
    );
};

const WatchHistorySection: React.FC = () => {
    const { language } = useLanguage();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        setIsAuthenticated(!!token);
    }, []);

    const { data: watchHistory } = useQuery({
        queryKey: ['watch-history'],
        queryFn: async () => (await profileService.getWatchHistory()).data,
        enabled: isAuthenticated,
    });

    if (!isAuthenticated || !watchHistory || watchHistory.length === 0) {
        return null;
    }

    return (
        <div className="home-section">
            <div className="home-section-header">
                <h2 className="home-section-title">Recently Viewed</h2>
            </div>

            <div className="products-grid">
                {watchHistory.map((item) => (
                    <Link key={item.productId} to={`/products/${item.productId}`} className="product-card">
                        <div className="product-image">
                            {item.imageUrl && (
                                <img
                                    src={`${(import.meta as any).env?.VITE_API_URL}${item.imageUrl}`}
                                    alt={item.productName}
                                />
                            )}
                        </div>
                        <div className="product-info">
                            <h3 className="product-name">{item.productName}</h3>
                            <div className="product-price">${item.price.toFixed(2)}</div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};