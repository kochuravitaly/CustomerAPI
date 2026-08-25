import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '../context/LanguageContext';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const isCategoriesPage = location.pathname === '/categories';

  const handleSearchClick = () => {
    navigate('/search');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-top">
          <Link to="/" className="navbar-logo">CheyenneShop</Link>
          {isCategoriesPage ? (
            <button onClick={handleSearchClick} className="search-icon-btn">
              🔍
            </button>
          ) : (
            <LanguageSelector />
          )}
        </div>
        {!isCategoriesPage && (
          <button onClick={handleSearchClick} className="navbar-search-btn">
            <span className="navbar-search-placeholder">
              {t.nav.search}
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};