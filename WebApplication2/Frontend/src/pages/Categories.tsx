import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService, categoryService } from '../services/product.service';
import { ProductCard } from '../components/ProductCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useLanguage } from '../context/LanguageContext';

export const Categories: React.FC = () => {
    const { language, t } = useLanguage();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [isBestSellers, setIsBestSellers] = useState(false);

    const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await categoryService.getAll();
            return response.data;
        },
    });

    const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
        queryKey: ['category-products', selectedCategoryId],
        queryFn: async () => {
            if (!selectedCategoryId) return null;
            const response = await productService.getAll({
                categoryId: selectedCategoryId,
                page: 1,
                pageSize: 50,
                sortBy: 'createdAt',
                sortDirection: 'desc',
            });
            return response.data;
        },
        enabled: !!selectedCategoryId,
    });

    const { data: bestSellersData, isLoading: bestSellersLoading, error: bestSellersError } = useQuery({
        queryKey: ['best-sellers'],
        queryFn: async () => {
            const response = await productService.getBestSellers();
            return response.data;
        },
        enabled: isBestSellers,
    });

    useEffect(() => {
        const section = searchParams.get('section');
        const categoryId = searchParams.get('categoryId');

        if (section === 'bestsellers') {
            setIsBestSellers(true);
            setSelectedCategoryId(null);
        } else if (categoryId) {
            const parsedId = Number(categoryId);
            if (!isNaN(parsedId)) {
                setSelectedCategoryId(parsedId);
                setIsBestSellers(false);
            }
        } else if (categories && categories.length > 0 && !selectedCategoryId && !isBestSellers) {
            setSelectedCategoryId(categories[0].id);
        }
    }, [categories, searchParams]);

    const handleCategorySelect = (categoryId: number | null, bestSellers: boolean) => {
        setSelectedCategoryId(categoryId);
        setIsBestSellers(bestSellers);

        if (bestSellers) {
            setSearchParams({ section: 'bestsellers' });
        } else if (categoryId) {
            setSearchParams({ categoryId: String(categoryId) });
        }
    };

    const selectedCategory = categories?.find(c => c.id === selectedCategoryId);

    return (
        <div className="categories-page">
            <aside className="categories-sidebar">
                <button
                    onClick={() => handleCategorySelect(null, true)}
                    className={`category-item ${isBestSellers ? 'active' : ''}`}
                >
                    {t.categories.bestsellers}
                </button>
                {categoriesLoading ? (
                    <LoadingSpinner />
                ) : categoriesError ? (
                    <div className="error-text">Failed to load categories</div>
                ) : (
                    categories?.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => handleCategorySelect(category.id, false)}
                            className={`category-item ${selectedCategoryId === category.id && !isBestSellers ? 'active' : ''}`}
                        >
                            {category.nameTranslations?.[language] || category.name}
                        </button>
                    ))
                )}
            </aside>

            <div className="categories-content">
                <h2>
                    {isBestSellers
                        ? t.categories.bestsellers
                        : selectedCategory
                            ? (selectedCategory.nameTranslations?.[language] || selectedCategory.name)
                            : ''}
                </h2>

                {isBestSellers ? (
                    bestSellersLoading ? (
                        <LoadingSpinner />
                    ) : bestSellersError ? (
                        <div className="error-text">Failed to load best sellers</div>
                    ) : bestSellersData && bestSellersData.length > 0 ? (
                        <div className="products-grid">
                            {bestSellersData.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <p className="no-products-in-section">{t.admin.noItems}</p>
                    )
                ) : productsLoading ? (
                    <LoadingSpinner />
                ) : productsError ? (
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
        </div>
    );
};