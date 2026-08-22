import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const { login: saveSession } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const from =
        (location.state as { from?: string } | null)?.from ??
        "/products";

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            await saveSession({
                email,
                password,
            });

            navigate(from, {
                replace: true,
            });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Invalid email or password."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-12">
            <div className="mx-auto max-w-md">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white">
                            S
                        </div>

                        <h1 className="text-3xl font-bold text-slate-900">
                            Welcome back
                        </h1>

                        <p className="mt-2 text-slate-500">
                            Sign in to continue shopping.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Email
                            </label>

                            <input
                                type="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                required
                                autoComplete="email"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700">
                                    Password
                                </label>

                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-semibold text-slate-900 hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <input
                                type="password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                required
                                autoComplete="current-password"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? "Signing in..."
                                : "Sign in"}
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm text-slate-500">
                        Don't have an account?{" "}
                        <Link
                            to="/register"
                            className="font-semibold text-slate-900 hover:underline"
                        >
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}