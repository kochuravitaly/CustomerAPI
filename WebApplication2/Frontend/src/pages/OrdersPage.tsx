import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOrders } from "../api/ordersApi";
import type { Order } from "../types/orders";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadOrders() {
            try {
                setLoading(true);
                setError("");

                const result = await getOrders();

                setOrders(result);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load orders."
                );
            } finally {
                setLoading(false);
            }
        }

        loadOrders();
    }, []);

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-6xl px-4 py-10">
                <h1 className="text-4xl font-bold text-slate-900">
                    My orders
                </h1>

                <p className="mt-2 text-slate-500">
                    Track your purchases and payments.
                </p>

                {error && (
                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="mt-8 space-y-4">
                        {Array.from({
                            length: 3,
                        }).map((_, index) => (
                            <div
                                key={index}
                                className="h-28 animate-pulse rounded-2xl bg-slate-200"
                            />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="mt-10 rounded-3xl bg-white p-16 text-center">
                        <h2 className="text-2xl font-bold text-slate-900">
                            No orders yet
                        </h2>

                        <p className="mt-2 text-slate-500">
                            Your completed orders will appear here.
                        </p>

                        <Link
                            to="/products"
                            className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-700"
                        >
                            Start shopping
                        </Link>
                    </div>
                ) : (
                    <div className="mt-8 space-y-4">
                        {orders.map((order) => (
                            <Link
                                key={String(order.id)}
                                to={`/orders/${order.id}`}
                                className="block rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            Order
                                        </p>

                                        <h2 className="mt-1 font-mono text-sm font-semibold text-slate-900">
                                            {String(order.id)}
                                        </h2>

                                        <p className="mt-2 text-sm text-slate-500">
                                            {formatDate(
                                                order.createdAt
                                            )}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
                                            {order.status}
                                        </span>

                                        <p className="mt-3 text-xl font-bold text-slate-900">
                                            {formatCurrency(
                                                order.totalAmount
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}