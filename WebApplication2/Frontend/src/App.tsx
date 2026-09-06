import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AccessGate } from './components/AccessGate';
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
import { PaymentMethods } from './pages/PaymentMethods';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { Contact } from './pages/Contact';
import { Returns } from './pages/Returns';
import { Profile } from './pages/Profile';
import { AddAccount } from './pages/AddAccount';
import { Wishlist } from './pages/Wishlist';
import { Categories } from './pages/Categories';
import { Search } from './pages/Search';
import { OAuthCallback } from './pages/OAuthCallback';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminProductForm } from './pages/admin/AdminProductForm';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminCategoryForm } from './pages/admin/AdminCategoryForm';
import { AdminAttributes } from './pages/admin/AdminAttributes';
import { AdminAttributeForm } from './pages/admin/AdminAttributeForm';
import { AdminHomeSections } from './pages/admin/AdminHomeSections';
import { AdminHomeSectionForm } from './pages/admin/AdminHomeSectionForm';
import { AdminCoupons } from './pages/admin/AdminCoupons';
import { AdminCouponForm } from './pages/admin/AdminCouponForm';
import { AdminFlashSale } from './pages/admin/AdminFlashSale';
import { AdminFlashSaleForm } from './pages/admin/AdminFlashSaleForm';

const App: React.FC = () => {
    const location = useLocation();

    const hideHeaderOn = [
        '/profile', '/add-account', '/login', '/register', '/cart', '/checkout', '/checkout/payment', '/orders',
        '/order-confirmation', '/contact', '/returns', '/oauth-callback',
        '/forgot-password', '/reset-password', '/verify-email',
        '/search', '/my-reviews', '/wishlist',
        '/admin', '/admin/products', '/admin/products/new',
        '/admin/categories', '/admin/categories/new',
        '/admin/attributes', '/admin/attributes/new',
        '/admin/home-sections', '/admin/home-sections/new',
        '/admin/coupons', '/admin/coupons/new',
        '/admin/flash-sale', '/admin/flash-sale/new',
    ];

    const isProductDetailOrReviews = location.pathname.includes('/products/');
    const isCategoryEdit = location.pathname.includes('/admin/categories/') && location.pathname.includes('/edit');
    const isAttributeEdit = location.pathname.includes('/admin/attributes/') && location.pathname.includes('/edit');
    const isHomeSectionEdit = location.pathname.includes('/admin/home-sections/') && location.pathname.includes('/edit');
    const isCouponEdit = location.pathname.includes('/admin/coupons/') && location.pathname.includes('/edit');
    const isProductEdit = location.pathname.includes('/admin/products/') && location.pathname.includes('/edit');
    const isFlashSaleEdit = location.pathname.includes('/admin/flash-sale/') && location.pathname.includes('/edit');
    const isOrderConfirmation = location.pathname.includes('/order-confirmation');

    const showHeader = !hideHeaderOn.includes(location.pathname)
        && !isProductDetailOrReviews
        && !isCategoryEdit
        && !isAttributeEdit
        && !isHomeSectionEdit
        && !isCouponEdit
        && !isProductEdit
        && !isFlashSaleEdit
        && !isOrderConfirmation;

    const hideBottomNavOn = [
        '/search', '/login', '/register', '/add-account', '/checkout', '/checkout/payment',
        '/order-confirmation', '/contact', '/returns', '/oauth-callback',
        '/admin/products', '/admin/products/new',
        '/admin/categories', '/admin/categories/new',
        '/admin/attributes', '/admin/attributes/new',
        '/admin/home-sections', '/admin/home-sections/new',
        '/admin/coupons', '/admin/coupons/new',
        '/admin/flash-sale', '/admin/flash-sale/new',
    ];

    const showBottomNav = !hideBottomNavOn.includes(location.pathname)
        && !isProductDetailOrReviews
        && !isCategoryEdit
        && !isAttributeEdit
        && !isHomeSectionEdit
        && !isCouponEdit
        && !isProductEdit
        && !isFlashSaleEdit
        && !isOrderConfirmation;

    return (
        <AccessGate>
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
                        <Route path="/oauth-callback" element={<OAuthCallback />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/returns" element={<Returns />} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/add-account" element={<ProtectedRoute><AddAccount /></ProtectedRoute>} />
                        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                        <Route path="/my-reviews" element={<ProtectedRoute><MyReviews /></ProtectedRoute>} />
                        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                        <Route path="/checkout/payment" element={<ProtectedRoute><PaymentMethods /></ProtectedRoute>} />
                        <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
                        <Route path="/order-confirmation/:orderId" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
                        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                        <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
                        <Route path="/admin/products" element={<ProtectedRoute requireAdmin><AdminProducts /></ProtectedRoute>} />
                        <Route path="/admin/products/new" element={<ProtectedRoute requireAdmin><AdminProductForm /></ProtectedRoute>} />
                        <Route path="/admin/products/:id/edit" element={<ProtectedRoute requireAdmin><AdminProductForm /></ProtectedRoute>} />
                        <Route path="/admin/categories" element={<ProtectedRoute requireAdmin><AdminCategories /></ProtectedRoute>} />
                        <Route path="/admin/categories/new" element={<ProtectedRoute requireAdmin><AdminCategoryForm /></ProtectedRoute>} />
                        <Route path="/admin/categories/:id/edit" element={<ProtectedRoute requireAdmin><AdminCategoryForm /></ProtectedRoute>} />
                        <Route path="/admin/attributes" element={<ProtectedRoute requireAdmin><AdminAttributes /></ProtectedRoute>} />
                        <Route path="/admin/attributes/new" element={<ProtectedRoute requireAdmin><AdminAttributeForm /></ProtectedRoute>} />
                        <Route path="/admin/attributes/:id/edit" element={<ProtectedRoute requireAdmin><AdminAttributeForm /></ProtectedRoute>} />
                        <Route path="/admin/home-sections" element={<ProtectedRoute requireAdmin><AdminHomeSections /></ProtectedRoute>} />
                        <Route path="/admin/home-sections/new" element={<ProtectedRoute requireAdmin><AdminHomeSectionForm /></ProtectedRoute>} />
                        <Route path="/admin/home-sections/:id/edit" element={<ProtectedRoute requireAdmin><AdminHomeSectionForm /></ProtectedRoute>} />
                        <Route path="/admin/coupons" element={<ProtectedRoute requireAdmin><AdminCoupons /></ProtectedRoute>} />
                        <Route path="/admin/coupons/new" element={<ProtectedRoute requireAdmin><AdminCouponForm /></ProtectedRoute>} />
                        <Route path="/admin/coupons/:id/edit" element={<ProtectedRoute requireAdmin><AdminCouponForm /></ProtectedRoute>} />
                        <Route path="/admin/flash-sale" element={<ProtectedRoute requireAdmin><AdminFlashSale /></ProtectedRoute>} />
                        <Route path="/admin/flash-sale/new" element={<ProtectedRoute requireAdmin><AdminFlashSaleForm /></ProtectedRoute>} />
                        <Route path="/admin/flash-sale/:id/edit" element={<ProtectedRoute requireAdmin><AdminFlashSaleForm /></ProtectedRoute>} />
                    </Routes>
                </main>
                {showBottomNav && <BottomNav />}
            </div>
        </AccessGate>
    );
};

export default App;