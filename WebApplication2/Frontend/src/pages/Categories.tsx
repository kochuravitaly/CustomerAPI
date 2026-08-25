import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService, categoryService } from '../services/product.service';
import { ProductCard } from '../components/ProductCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useLanguage } from '../context/LanguageContext';

export const Categories: React.FC = () => {
    const { language } = useLanguage();
    const [searchParams] = useSearchParams();
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [isBestSellers, setIsBestSellers] = useState(false);

    const { data: categories, isLoading: categoriesLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await categoryService.getAll();
            return response.data;
        },
    });

    const { data: productsData, isLoading: productsLoading } = useQuery({
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

    const { data: bestSellersData, isLoading: bestSellersLoading } = useQuery({
        queryKey: ['best-sellers'],
        queryFn: async () => {
            const response = await productService.getBestSellers();
            return response.data;
        },
        enabled: isBestSellers,
    });

    useEffect(() => {
        const section = searchParams.get('section');
        if (section === 'bestsellers') {
            setIsBestSellers(true);
            setSelectedCategoryId(null);
        } else if (categories && categories.length > 0 && !selectedCategoryId && !isBestSellers) {
            setSelectedCategoryId(categories[0].id);
        }
    }, [categories, searchParams]);

    const selectedCategory = categories?.find(c => c.id === selectedCategoryId);

    return (
        <div className="categories-page">
            <aside className="categories-sidebar">
                <button
                    onClick={() => { setIsBestSellers(true); setSelectedCategoryId(null); }}
                    className={`category-item ${isBestSellers ? 'active' : ''}`}
                >
                    Best Sellers
                </button>
                {categoriesLoading ? (
                    <LoadingSpinner />
                ) : (
                    categories?.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => { setSelectedCategoryId(category.id); setIsBestSellers(false); }}
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
                        ? 'Best Sellers'
                        : selectedCategory
                            ? (selectedCategory.nameTranslations?.[language] || selectedCategory.name)
                            : ''}
                </h2>

                {isBestSellers ? (
                    bestSellersLoading ? (
                        <LoadingSpinner />
                    ) : bestSellersData && bestSellersData.length > 0 ? (
                        <div className="products-grid">
                            {bestSellersData.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <p className="no-products-in-section">No best sellers yet</p>
                    )
                ) : productsLoading ? (
                    <LoadingSpinner />
                ) : productsData && productsData.items.length > 0 ? (
                    <div className="products-grid">
                        {productsData.items.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <p className="no-products-in-section">No products in this category</p>
                )}
            </div>
        </div>
    );
};