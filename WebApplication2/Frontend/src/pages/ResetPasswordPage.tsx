import { FormEvent, useState } from "react";
import {
    Link,
    useNavigate,
    useSearchParams,
} from "react-router-dom";
import { resetPassword } from "../api/authApi";

export default function ResetPasswordPage() {
    const navigate = useNavigate();

    const [searchParams] =
        useSearchParams();

    const [token, setToken] =
        useState(
            searchParams.get("token") ?? ""
        );

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
            await resetPassword({
                token,
                newPassword: password,
            });

            navigate("/login");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Invalid or expired reset token."
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
                        Set a new password
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Choose a new secure password for your account.
                    </p>

                    {error && (
                        <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="mt-7 space-y-5"
                    >
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Reset token
                            </label>

                            <textarea
                                value={token}
                                onChange={(event) =>
                                    setToken(
                                        event.target.value
                                    )
                                }
                                required
                                rows={3}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-xs outline-none focus:border-slate-900"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                New password
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
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                            />
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
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
                        >
                            {loading
                                ? "Updating..."
                                : "Update password"}
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