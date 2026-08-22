import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { formatCurrency } from "../utils/formatCurrency";

export default function CartPage() {
    const navigate = useNavigate();

    const {
        cart,
        isLoading,
        error,
        updateItem,
        removeItem,
        clearCart,
    } = useCart();

    if (isLoading) {
        return (
            <main className="min-h-screen bg-slate-50 p-10">
                <div className="mx-auto h-80 max-w-6xl animate-pulse rounded-3xl bg-slate-200" />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-6xl px-4 py-10">
                <h1 className="text-4xl font-bold text-slate-900">
                    Your cart
                </h1>

                {error && (
                    <div className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
                        {error}
                    </div>
                )}

                {cart.cartItems.length === 0 ? (
                    <div className="mt-10 rounded-3xl bg-white p-16 text-center">
                        <h2 className="text-2xl font-bold text-slate-900">
                            Your cart is empty
                        </h2>

                        <p className="mt-2 text-slate-500">
                            Add something you like and come back here.
                        </p>

                        <Link
                            to="/products"
                            className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white"
                        >
                            Browse products
                        </Link>
                    </div>
                ) : (
                    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
                        <div className="space-y-4">
                            {cart.cartItems.map((item) => (
                                <div
                                    key={item.productId}
                                    className="rounded-2xl border border-slate-200 bg-white p-5"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <Link
                                                to={`/products/${item.productId}`}
                                                className="text-lg font-bold text-slate-900 hover:underline"
                                            >
                                                {item.productName}
                                            </Link>

                                            <p className="mt-1 text-sm text-slate-500">
                                                {formatCurrency(
                                                    item.unitPrice
                                                )}{" "}
                                                each
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeItem(
                                                    item.productId
                                                )
                                            }
                                            className="text-sm font-semibold text-red-600 hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <div className="mt-5 flex items-center justify-between">
                                        <div className="flex items-center rounded-xl border border-slate-300">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateItem(
                                                        item.productId,
                                                        {
                                                            quantity:
                                                                Math.max(
                                                                    1,
                                                                    item.quantity -
                                                                    1
                                                                ),
                                                        }
                                                    )
                                                }
                                                className="px-4 py-2"
                                            >
                                                −
                                            </button>

                                            <span className="w-10 text-center font-semibold">
                                                {item.quantity}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateItem(
                                                        item.productId,
                                                        {
                                                            quantity:
                                                                item.quantity +
                                                                1,
                                                        }
                                                    )
                                                }
                                                className="px-4 py-2"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <strong className="text-lg">
                                            {formatCurrency(
                                                item.total
                                            )}
                                        </strong>
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={clearCart}
                                className="text-sm font-semibold text-slate-500 hover:text-red-600"
                            >
                                Clear cart
                            </button>
                        </div>

                        <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900">
                                Summary
                            </h2>

                            <div className="mt-6 flex justify-between border-b border-slate-100 pb-4">
                                <span className="text-slate-500">
                                    Items
                                </span>

                                <span>
                                    {cart.cartItems.reduce(
                                        (total, item) =>
                                            total + item.quantity,
                                        0
                                    )}
                                </span>
                            </div>

                            <div className="mt-5 flex justify-between">
                                <span className="text-lg font-semibold">
                                    Total
                                </span>

                                <span className="text-2xl font-bold">
                                    {formatCurrency(cart.total)}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/checkout")
                                }
                                className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700"
                            >
                                Checkout
                            </button>
                        </aside>
                    </div>
                )}
            </div>
        </main>
    );
}