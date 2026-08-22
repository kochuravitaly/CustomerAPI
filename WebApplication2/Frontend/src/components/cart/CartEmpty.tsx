import { Link } from "react-router-dom";

export default function CartEmpty() {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
                🛒
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
                Your cart is empty
            </h2>

            <p className="mt-2 max-w-md text-gray-500">
                Add some products to your cart and they will appear here.
            </p>

            <Link
                to="/products"
                className="mt-6 rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700"
            >
                Browse products
            </Link>
        </div>
    );
}