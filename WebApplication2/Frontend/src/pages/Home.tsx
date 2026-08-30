import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { homeSectionService, HomeSectionResponseDto } from '../services/homeSection.service';
import { ProductCard } from '../components/ProductCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useLanguage } from '../context/LanguageContext';

export const Home: React.FC = () => {
    const { data: sections, isLoading } = useQuery({
        queryKey: ['home-sections'],
        queryFn: async () => (await homeSectionService.getActive()).data,
    });

    const { t } = useLanguage();

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="home-page">
            {sections?.map((section: HomeSectionResponseDto) => (
                <HomeSectionBlock key={section.id} section={section} />
            ))}

            <Link to="/categories" className="all-sections-link">
                {t.categories.all} →
            </Link>
        </div>
    );
};

const HomeSectionBlock: React.FC<{ section: HomeSectionResponseDto }> = ({ section }) => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();

    const { data: productsData, isLoading } = useQuery({
        queryKey: ['home-section-products', section.id],
        queryFn: async () => (await homeSectionService.getProducts(section.id, 1, section.productsToShow)).data,
    });

    const sectionTitle = section.titleTranslations?.[language] || section.title;

    const handleSeeMore = () => {
        if (section.title === 'Best Sellers') {
            navigate('/categories?section=bestsellers');
            return;
        }

        try {
            const filters = JSON.parse(section.filterJson);
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                params.set(key, String(value));
            });
            navigate(`/search?${params.toString()}`);
        } catch {
            navigate('/search');
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