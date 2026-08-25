import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService, categoryService } from '../../services/product.service';
import { orderService } from '../../services/order.service';

export const AdminDashboard: React.FC = () => {
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

            <h2>Admin Panel</h2>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📦</div>
                    <div className="stat-value">{products || 0}</div>
                    <div className="stat-label">Products</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🗂️</div>
                    <div className="stat-value">{categories?.length || 0}</div>
                    <div className="stat-label">Categories</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-value">{orders?.length || 0}</div>
                    <div className="stat-label">Orders</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-value">${totalRevenue.toFixed(2)}</div>
                    <div className="stat-label">Total Revenue</div>
                </div>
            </div>

            <div className="profile-menu-list">
                <Link to="/admin/products" className="profile-menu-item">
                    <span className="profile-menu-icon">📦</span>
                    Manage Products
                    <span className="profile-menu-arrow">→</span>
                </Link>
                <Link to="/admin/products/new" className="profile-menu-item">
                    <span className="profile-menu-icon">➕</span>
                    Add New Product
                    <span className="profile-menu-arrow">→</span>
                </Link>
                <Link to="/admin/categories" className="profile-menu-item">
                    <span className="profile-menu-icon">🗂️</span>
                    Manage Categories
                    <span className="profile-menu-arrow">→</span>
                </Link>
                <Link to="/admin/attributes" className="profile-menu-item">
                    <span className="profile-menu-icon">🏷️</span>
                    Manage Attributes
                    <span className="profile-menu-arrow">→</span>
                </Link>
                <Link to="/admin/home-sections" className="profile-menu-item">
                    <span className="profile-menu-icon">🏠</span>
                    Homepage Sections
                    <span className="profile-menu-arrow">→</span>
                </Link>
                <Link to="/admin/coupons" className="profile-menu-item">
                    <span className="profile-menu-icon">🎟️</span>
                    Coupons
                    <span className="profile-menu-arrow">→</span>
                </Link>
                <Link to="/admin/flash-sale" className="profile-menu-item">
                    <span className="profile-menu-icon">⚡</span>
                    Flash Sale
                    <span className="profile-menu-arrow">→</span>
                </Link>
            </div>
        </div>
    );
};