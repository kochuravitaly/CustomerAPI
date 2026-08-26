import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { ReviewsPage } from './pages/ReviewsPage';
import { MyReviews } from './pages/MyReviews';
import { Cart } from './pages/Cart';
import { Orders } from './pages/Orders';
import { Checkout } from './pages/Checkout';
import { Profile } from './pages/Profile';
import { Categories } from './pages/Categories';
import { Search } from './pages/Search';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminProductForm } from './pages/admin/AdminProductForm';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminAttributes } from './pages/admin/AdminAttributes';
import { AdminCoupons } from './pages/admin/AdminCoupons';
import { AdminFlashSale } from './pages/admin/AdminFlashSale';
import { AdminHomeSections } from './pages/admin/AdminHomeSections';

const App: React.FC = () => {
    const location = useLocation();

    const hideHeaderOn = [
        '/profile', '/login', '/register', '/cart', '/checkout',
        '/forgot-password', '/reset-password', '/verify-email',
        '/search', '/my-reviews',
        '/admin', '/admin/products', '/admin/products/new',
        '/admin/categories', '/admin/attributes', '/admin/coupons',
        '/admin/flash-sale', '/admin/home-sections',
    ];

    const isProductDetailOrReviews = location.pathname.includes('/products/');

    const showHeader = !hideHeaderOn.includes(location.pathname) && !isProductDetailOrReviews;

    const hideBottomNavOn = [
        '/search', '/login', '/register',
        '/admin/products', '/admin/products/new',
        '/admin/categories', '/admin/attributes',
        '/admin/coupons', '/admin/flash-sale', '/admin/home-sections',
    ];

    const showBottomNav = !hideBottomNavOn.includes(location.pathname) && !isProductDetailOrReviews;

    return (
        <div className="app">
            {showHeader && <Navbar />}
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/products/:id/reviews" element={<ReviewsPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/my-reviews" element={<ProtectedRoute><MyReviews /></ProtectedRoute>} />
                    <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                    <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                    <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/admin/products" element={<ProtectedRoute requireAdmin><AdminProducts /></ProtectedRoute>} />
                    <Route path="/admin/products/new" element={<ProtectedRoute requireAdmin><AdminProductForm /></ProtectedRoute>} />
                    <Route path="/admin/products/:id/edit" element={<ProtectedRoute requireAdmin><AdminProductForm /></ProtectedRoute>} />
                    <Route path="/admin/categories" element={<ProtectedRoute requireAdmin><AdminCategories /></ProtectedRoute>} />
                    <Route path="/admin/attributes" element={<ProtectedRoute requireAdmin><AdminAttributes /></ProtectedRoute>} />
                    <Route path="/admin/coupons" element={<ProtectedRoute requireAdmin><AdminCoupons /></ProtectedRoute>} />
                    <Route path="/admin/flash-sale" element={<ProtectedRoute requireAdmin><AdminFlashSale /></ProtectedRoute>} />
                    <Route path="/admin/home-sections" element={<ProtectedRoute requireAdmin><AdminHomeSections /></ProtectedRoute>} />
                </Routes>
            </main>
            {showBottomNav && <BottomNav />}
        </div>
    );
};

export default App;