import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/authApi";

export default function ForgotPasswordPage() {
    const [email, setEmail] =
        useState("");

    const [token, setToken] =
        useState("");

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setMessage("");
        setToken("");
        setLoading(true);

        try {
            const response =
                await forgotPassword({
                    email,
                });

            setMessage(
                response.message
            );

            if (response.token) {
                setToken(
                    response.token
                );
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to process the request."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-12">
            <div className="mx-auto max-w-md">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Forgot password?
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Enter your email to generate a password reset token.
                    </p>

                    {error && (
                        <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {message}
                        </div>
                    )}

                    {token && (
                        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
                                Development reset token
                            </p>

                            <p className="break-all font-mono text-xs text-slate-800">
                                {token}
                            </p>

                            <Link
                                to={`/reset-password?token=${encodeURIComponent(
                                    token
                                )}`}
                                className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                            >
                                Continue to reset password
                            </Link>
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="mt-7 space-y-5"
                    >
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Email
                            </label>

                            <input
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(
                                        event.target.value
                                    )
                                }
                                required
                                autoComplete="email"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                                placeholder="you@example.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
                        >
                            {loading
                                ? "Generating..."
                                : "Reset password"}
                        </button>
                    </form>

                    <Link
                        to="/login"
                        className="mt-6 block text-center text-sm text-slate-500 hover:text-slate-900"
                    >
                        Back to login
                    </Link>
                </div>
            </div>
        </main>
    );
}