import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createPayment } from "../api/paymentsApi";

export default function PaymentPage() {
    const [searchParams] =
        useSearchParams();

    const orderId =
        searchParams.get("orderId") ?? "";

    const [paymentUrl, setPaymentUrl] =
        useState("");

    const [paymentId, setPaymentId] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    async function handleCreatePayment() {
        if (!orderId) {
            setError("Order ID is missing.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response =
                await createPayment({
                    orderId,
                });

            setPaymentId(
                response.paymentId
            );

            setPaymentUrl(
                response.paymentUrl
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to create payment."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!orderId) {
            setError("Order ID is missing.");
            return;
        }

        void handleCreatePayment();

        // Payment should only be created once when
        // this page is opened for an order.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-12">
            <div className="mx-auto max-w-xl">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
                    <div className="text-center">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-2xl text-white">
                            ₽
                        </div>

                        <h1 className="text-3xl font-bold text-slate-900">
                            Payment
                        </h1>

                        <p className="mt-2 text-slate-500">
                            Secure payment for your order.
                        </p>
                    </div>

                    {error && (
                        <div className="mt-7 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {loading && (
                        <div className="mt-8 text-center">
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

                            <p className="mt-3 text-sm text-slate-500">
                                Creating payment...
                            </p>
                        </div>
                    )}

                    {paymentUrl && (
                        <div className="mt-8">
                            <div className="rounded-2xl bg-slate-50 p-5">
                                <p className="text-sm text-slate-500">
                                    Payment ID
                                </p>

                                <p className="mt-1 break-all font-mono text-xs font-semibold text-slate-900">
                                    {paymentId}
                                </p>
                            </div>

                            <a
                                href={paymentUrl}
                                className="mt-6 block w-full rounded-xl bg-slate-900 px-5 py-4 text-center font-semibold text-white transition hover:bg-slate-700"
                            >
                                Continue to payment
                            </a>

                            <p className="mt-4 text-center text-xs text-slate-500">
                                You will be redirected to YooKassa.
                            </p>
                        </div>
                    )}

                    <Link
                        to="/orders"
                        className="mt-6 block text-center text-sm font-semibold text-slate-500 hover:text-slate-900"
                    >
                        Back to orders
                    </Link>
                </div>
            </div>
        </main>
    );
}