import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function AdminRoute() {
    const {
        isAuthenticated,
        isLoading,
        isAdmin,
    } = useAuth();

    if (isLoading) {
        return (
            <div className="route-loading">
                <div className="loading-spinner" />
                <p>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/products" replace />;
    }

    return <Outlet />;
}