import React from "react";
import ReactDOM from "react-dom/client";
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import "./StyleSheet.css";

import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import AdminRoute from "./auth/AdminRoute";

import CartPage from "./pages/CartPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LoginPage from "./pages/LoginPage";
import OrderPage from "./pages/OrderPage";
import OrdersPage from "./pages/OrdersPage";
import PaymentPage from "./pages/PaymentPage";
import ProductPage from "./pages/ProductPage";
import ProductsPage from "./pages/ProductsPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

function App() {
    return (
        <Routes>
            <Route
                path="/"
                element={
                    <Navigate
                        to="/products"
                        replace
                    />
                }
            />

            <Route
                path="/products"
                element={<ProductsPage />}
            />

            <Route
                path="/products/:id"
                element={<ProductPage />}
            />

            <Route
                path="/login"
                element={<LoginPage />}
            />

            <Route
                path="/register"
                element={<RegisterPage />}
            />

            <Route
                path="/verify-email"
                element={<VerifyEmailPage />}
            />

            <Route
                path="/forgot-password"
                element={<ForgotPasswordPage />}
            />

            <Route
                path="/reset-password"
                element={<ResetPasswordPage />}
            />

            <Route
                element={<ProtectedRoute />}
            >
                <Route
                    path="/cart"
                    element={<CartPage />}
                />

                <Route
                    path="/orders"
                    element={<OrdersPage />}
                />

                <Route
                    path="/orders/:id"
                    element={<OrderPage />}
                />

                <Route
                    path="/payment"
                    element={<PaymentPage />}
                />

                <Route
                    element={<AdminRoute />}
                >
                    {/* Admin routes can be added here later. */}
                </Route>
            </Route>

            <Route
                path="*"
                element={
                    <Navigate
                        to="/products"
                        replace
                    />
                }
            />
        </Routes>
    );
}

ReactDOM.createRoot(
    document.getElementById("root")!
).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);