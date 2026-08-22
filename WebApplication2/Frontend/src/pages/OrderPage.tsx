import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrder } from "../api/ordersApi";
import type { Order } from "../types/orders";
import { formatCurrency } from "../utils/formatCurrency";
import { formatDate } from "../utils/formatDate";

export default function OrderPage() {
    const { id } = useParams();

    const [order, setOrder] =
        useState<Order | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadOrder() {
            if (!id) {
                setError("Order ID is missing.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const result = await getOrder(id);

                setOrder(result);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load order."
                );
            } finally {
                setLoading(false);
            }
        }

        loadOrder();
    }, [id]);

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50 p-10">
                <div className="mx-auto h-96 max-w-5xl animate-pulse rounded-3xl bg-slate-200" />
            </main>
        );
    }

    if (error || !order) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-16 text-center">
                <h1 className="text-3xl font-bold text-slate-900">
                    Order not found
                </h1>

                <p className="mt-2 text-slate-500">
                    {error || "This order does not exist."}
                </p>

                <Link
                    to="/orders"
                    className="mt-6 inline-block rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700"
                >
                    Back to orders
                </Link>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-5xl px-4 py-10">
                <Link
                    to="/orders"
                    className="text-sm font-semibold text-slate-500 hover:text-slate-900"
                >
                    ← Back to orders
                </Link>

                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-5">
                        <div>
                            <p className="text-sm text-slate-500">
                                Order
                            </p>

                            <h1 className="mt-1 break-all font-mono text-xl font-bold text-slate-900">
                                {String(order.id)}
                            </h1>

                            <p className="mt-2 text-sm text-slate-500">
                                {formatDate(
                                    order.createdAt
                                )}
                            </p>
                        </div>

                        <div className="text-right">
                            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold">
                                {order.status}
                            </span>

                            <p className="mt-4 text-2xl font-bold text-slate-900">
                                {formatCurrency(
                                    order.totalAmount
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 divide-y divide-slate-100">
                        {order.items.length === 0 ? (
                            <p className="py-6 text-center text-sm text-slate-500">
                                This order has no items.
                            </p>
                        ) : (
                            order.items.map((item) => (
                                <div
                                    key={item.productId}
                                    className="flex items-center justify-between gap-4 py-5"
                                >
                                    <div>
                                        <h2 className="font-semibold text-slate-900">
                                            {
                                                item.productName
                                            }
                                        </h2>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {item.quantity} ×{" "}
                                            {formatCurrency(
                                                item.unitPrice
                                            )}
                                        </p>
                                    </div>

                                    <strong className="text-slate-900">
                                        {formatCurrency(
                                            item.total
                                        )}
                                    </strong>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}