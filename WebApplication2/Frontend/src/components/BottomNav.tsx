import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const BottomNav: React.FC = () => {
    const { isAuthenticated, isAdmin } = useAuth();
    const { t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (paths: string[]) => paths.includes(location.pathname);

    const handleCartClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (isAuthenticated) {
            navigate('/cart');
        } else {
            navigate('/login');
        }
    };

    return (
        <nav className="bottom-nav">
            <div className="bottom-nav-container">
                <Link to="/" className={`bottom-nav-item ${isActive(['/']) ? 'active' : ''}`}>
                    <span className="bottom-nav-icon">🏠</span>
                    {t.nav.home}
                </Link>
                <Link to="/categories" className={`bottom-nav-item ${isActive(['/categories']) ? 'active' : ''}`}>
                    <span className="bottom-nav-icon">🗂️</span>
                    {t.nav.categories}
                </Link>
                {isAdmin && (
                    <Link to="/admin" className={`bottom-nav-item ${isActive(['/admin', '/admin/products', '/admin/categories', '/admin/attributes']) ? 'active' : ''}`}>
                        <span className="bottom-nav-icon">🛠️</span>
                        Admin
                    </Link>
                )}
                <a
                    href="/cart"
                    onClick={handleCartClick}
                    className={`bottom-nav-item ${isActive(['/cart']) ? 'active' : ''}`}
                >
                    <span className="bottom-nav-icon">🛒</span>
                    {t.nav.cart}
                </a>
                <Link to={isAuthenticated ? '/profile' : '/login'} className={`bottom-nav-item ${isActive(['/profile']) ? 'active' : ''}`}>
                    <span className="bottom-nav-icon">👤</span>
                    {t.nav.account}
                </Link>
            </div>
        </nav>
    );
};