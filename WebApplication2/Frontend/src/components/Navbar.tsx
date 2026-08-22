import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { cartService } from '../services/cart.service';

export const Navbar: React.FC = () => {
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const navigate = useNavigate();

    const { data: cart } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            const response = await cartService.getCart();
            return response.data;
        },
        enabled: isAuthenticated,
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const cartItemCount = cart?.cartItems.reduce((sum, item) => sum + item.quantity, 0) || 0;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    🛍️ Shop
                </Link>

                <div className="navbar-links">
                    <Link to="/products" className="nav-link">
                        Products
                    </Link>

                    {isAuthenticated && (
                        <>
                            <Link to="/cart" className="nav-link cart-link">
                                🛒 Cart
                                {cartItemCount > 0 && (
                                    <span className="cart-badge">{cartItemCount}</span>
                                )}
                            </Link>
                            <Link to="/orders" className="nav-link">
                                Orders
                            </Link>
                        </>
                    )}

                    {isAdmin && (
                        <Link to="/admin" className="nav-link admin-link">
                            Admin Panel
                        </Link>
                    )}
                </div>

                <div className="navbar-auth">
                    {isAuthenticated ? (
                        <div className="user-menu">
                            <span className="user-name">
                                {user?.email || 'User'}
                            </span>
                            <button onClick={handleLogout} className="btn btn-outline">
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login" className="btn btn-outline">
                                Login
                            </Link>
                            <Link to="/register" className="btn btn-primary">
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};