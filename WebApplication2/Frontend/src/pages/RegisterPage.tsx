import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/authApi";

export default function RegisterPage() {
    const navigate = useNavigate();

    const [name, setName] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");

        if (
            password !==
            confirmPassword
        ) {
            setError(
                "Passwords do not match."
            );
            return;
        }

        setLoading(true);

        try {
            await register({
                name,
                email,
                password,
                confirmPassword,
            });

            navigate(
                `/verify-email?email=${encodeURIComponent(
                    email
                )}`
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Registration failed."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-12">
            <div className="mx-auto max-w-lg">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-slate-900">
                            Create your account
                        </h1>

                        <p className="mt-2 text-slate-500">
                            Join us and start shopping.
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
                                Name
                            </label>

                            <input
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value
                                    )
                                }
                                required
                                minLength={3}
                                maxLength={50}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                                placeholder="Your name"
                            />
                        </div>

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
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Password
                            </label>

                            <input
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(
                                        event.target.value
                                    )
                                }
                                required
                                minLength={8}
                                maxLength={100}
                                autoComplete="new-password"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                                placeholder="Create a strong password"
                            />

                            <p className="mt-2 text-xs text-slate-500">
                                Use uppercase, lowercase, a number and a special character.
                            </p>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Confirm password
                            </label>

                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(event) =>
                                    setConfirmPassword(
                                        event.target.value
                                    )
                                }
                                required
                                autoComplete="new-password"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                                placeholder="Repeat your password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                        >
                            {loading
                                ? "Creating account..."
                                : "Create account"}
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm text-slate-500">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="font-semibold text-slate-900 hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}