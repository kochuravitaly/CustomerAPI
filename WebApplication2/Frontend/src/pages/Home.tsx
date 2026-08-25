import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { homeSectionService, HomeSectionResponseDto } from '../services/homeSection.service';
import { ProductCard } from '../components/ProductCard';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Home: React.FC = () => {
    const { data: sections, isLoading } = useQuery({
        queryKey: ['home-sections'],
        queryFn: async () => (await homeSectionService.getActive()).data,
    });

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="home-page">
            {sections?.map((section: HomeSectionResponseDto) => (
                <HomeSectionBlock key={section.id} section={section} />
            ))}

            <Link to="/categories" className="all-sections-link">
                See all categories →
            </Link>
        </div>
    );
};

const HomeSectionBlock: React.FC<{ section: HomeSectionResponseDto }> = ({ section }) => {
    const navigate = useNavigate();

    const { data: productsData, isLoading } = useQuery({
        queryKey: ['home-section-products', section.id],
        queryFn: async () => (await homeSectionService.getProducts(section.id, 1, section.productsToShow)).data,
    });

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
                <h2 className="home-section-title">{section.title}</h2>
                <button onClick={handleSeeMore} className="see-more-btn">
                    See More →
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
                <p className="no-products-in-section">No products in this section</p>
            )}
        </div>
    );
};