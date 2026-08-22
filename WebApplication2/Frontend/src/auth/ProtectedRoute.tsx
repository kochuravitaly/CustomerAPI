import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute() {
    const {
        isAuthenticated,
        isLoading,
    } = useAuth();

    const location = useLocation();

    if (isLoading) {
        return (
            <div className="route-loading">
                <div className="loading-spinner" />
                <p>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location.pathname,
                }}
            />
        );
    }

    return <Outlet />;
}