import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService, categoryService } from '../../services/product.service';
import { orderService } from '../../services/order.service';
import { useLanguage } from '../../context/LanguageContext';

export const AdminDashboard: React.FC = () => {
    const { t } = useLanguage();

    const { data: products } = useQuery({
        queryKey: ['admin-products-count'],
        queryFn: async () => {
            const response = await productService.getAll({ page: 1, pageSize: 1 });
            return response.data.totalCount;
        },
    });

    const { data: categories } = useQuery({
        queryKey: ['admin-categories'],
        queryFn: async () => {
            const response = await categoryService.getAll();
            return response.data;
        },
    });

    const { data: orders } = useQuery({
        queryKey: ['admin-orders'],
        queryFn: async () => {
            const response = await orderService.getMyOrders();
            return response.data;
        },
    });

    const totalRevenue = orders?.reduce((sum, order) => sum + order.totalAmount, 0) || 0;

    return (
        <div className="admin-dashboard">
            <div className="admin-header-top">
                <h1 className="admin-title">CheyenneShop</h1>
            </div>

            <h2>{t.admin.title}</h2>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📦</div>
                    <div className="stat-value">{products || 0}</div>
                    <div className="stat-label">{t.admin.products}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🗂️</div>
                    <div className="stat-value">{categories?.length || 0}</div>
                    <div className="stat-label">{t.admin.categories}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-value">{orders?.length || 0}</div>
                    <div className="stat-label">{t.nav.orders}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-value">${totalRevenue.toFixed(2)}</div>
                    <div className="stat-label">{t.admin.total}</div>
                </div>
            </div>

            <div className="profile-menu-list">
                <Link to="/admin/products" className="profile-menu-item">
                    <span className="profile-menu-icon">📦</span>
                    {t.admin.manageProducts}
                    <span className="profile-menu-arrow">→</span>
                </Link>
                <Link to="/admin/categories" className="profile-menu-item">
                    <span className="profile-menu-icon">🗂️</span>
                    {t.admin.manageCategories}
                    <span className="profile-menu-arrow">→</span>
                </Link>
                <Link to="/admin/attributes" className="profile-menu-item">
                    <span className="profile-menu-icon">🏷️</span>
                    {t.admin.manageAttributes}
                    <span className="profile-menu-arrow">→</span>
                </Link>
                <Link to="/admin/home-sections" className="profile-menu-item">
                    <span className="profile-menu-icon">🏠</span>
                    {t.admin.manageHomeSections}
                    <span className="profile-menu-arrow">→</span>
                </Link>
                <Link to="/admin/coupons" className="profile-menu-item">
                    <span className="profile-menu-icon">🎟️</span>
                    {t.admin.manageCoupons}
                    <span className="profile-menu-arrow">→</span>
                </Link>
                <Link to="/admin/flash-sale" className="profile-menu-item">
                    <span className="profile-menu-icon">⚡</span>
                    {t.admin.manageFlashSales}
                    <span className="profile-menu-arrow">→</span>
                </Link>
            </div>
        </div>
    );
};