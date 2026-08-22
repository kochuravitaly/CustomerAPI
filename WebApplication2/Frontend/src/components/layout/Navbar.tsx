import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function Navbar() {
    const { isAuthenticated, isAdmin, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <header className="border-b bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <Link
                    to="/products"
                    className="text-2xl font-bold text-gray-900"
                >
                    CustomerAPI
                </Link>

                <nav className="flex items-center gap-6">
                    <Link
                        to="/products"
                        className="text-gray-600 transition hover:text-gray-900"
                    >
                        Products
                    </Link>

                    {isAuthenticated && (
                        <>
                            <Link
                                to="/cart"
                                className="text-gray-600 transition hover:text-gray-900"
                            >
                                Cart
                            </Link>

                            <Link
                                to="/orders"
                                className="text-gray-600 transition hover:text-gray-900"
                            >
                                Orders
                            </Link>
                        </>
                    )}

                    {isAdmin && (
                        <Link
                            to="/admin"
                            className="text-gray-600 transition hover:text-gray-900"
                        >
                            Admin
                        </Link>
                    )}

                    {isAuthenticated ? (
                        <button
                            onClick={handleLogout}
                            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
                        >
                            Logout
                        </button>
                    ) : (
                        <Link
                            to="/login"
                            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
                        >
                            Login
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}