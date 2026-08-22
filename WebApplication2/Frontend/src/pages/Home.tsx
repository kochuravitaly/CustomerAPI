import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService, categoryService } from '../services/product.service';
import { ProductCard } from '../components/ProductCard';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Home: React.FC = () => {
    const { data: productsData, isLoading: productsLoading } = useQuery({
        queryKey: ['featured-products'],
        queryFn: async () => {
            const response = await productService.getAll({
                page: 1,
                pageSize: 8,
                sortBy: 'createdAt',
                sortDirection: 'desc',
            });
            return response.data;
        },
    });

    const { data: categories, isLoading: categoriesLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await categoryService.getAll();
            return response.data;
        },
    });

    return (
        <div className="home-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1 className="hero-title">Welcome to Our Shop</h1>
                    <p className="hero-subtitle">
                        Discover amazing products at great prices
                    </p>
                    <Link to="/products" className="btn btn-primary btn-large">
                        Shop Now
                    </Link>
                </div>
            </section>

            {/* Categories Section */}
            <section className="categories-section">
                <h2 className="section-title">Shop by Category</h2>
                {categoriesLoading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="categories-grid">
                        {categories?.map((category) => (
                            <Link
                                key={category.id}
                                to={`/products?categoryId=${category.id}`}
                                className="category-card"
                            >
                                <div className="category-icon">📦</div>
                                <h3>{category.name}</h3>
                                {category.description && <p>{category.description}</p>}
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Featured Products */}
            <section className="featured-section">
                <h2 className="section-title">Featured Products</h2>
                {productsLoading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="products-grid">
                        {productsData?.items.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
                <div className="view-all-container">
                    <Link to="/products" className="btn btn-outline">
                        View All Products
                    </Link>
                </div>
            </section>
        </div>
    );
};