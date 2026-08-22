import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService, categoryService } from '../../services/product.service';
import { orderService } from '../../services/order.service';
import { LoadingSpinner } from '../../components/LoadingSpinner';

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

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📦</div>
                    <div className="stat-value">{products || 0}</div>
                    <div className="stat-label">Total Products</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🏷️</div>
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
                    <div className="stat-value">
                        ${orders?.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2) || '0.00'}
                    </div>
                    <div className="stat-label">Total Revenue</div>
                </div>
            </div>

            <div className="admin-actions">
                <h2>Quick Actions</h2>
                <div className="action-buttons">
                    <Link to="/admin/products" className="btn btn-primary">
                        Manage Products
                    </Link>
                    <Link to="/admin/categories" className="btn btn-outline">
                        Manage Categories
                    </Link>
                </div>
            </div>
        </div>
    );
};