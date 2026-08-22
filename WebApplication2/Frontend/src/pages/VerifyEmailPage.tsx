import { FormEvent, useState } from "react";
import {
    Link,
    useNavigate,
    useSearchParams,
} from "react-router-dom";
import {
    resendVerification,
    verifyEmail,
} from "../api/authApi";

export default function VerifyEmailPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [email, setEmail] = useState(
        searchParams.get("email") ?? ""
    );

    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    async function handleVerify(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");
        setMessage("");
        setLoading(true);

        try {
            await verifyEmail({
                email,
                code,
            });

            setMessage(
                "Email verified successfully. You can now sign in."
            );

            setTimeout(() => {
                navigate("/login", {
                    replace: true,
                });
            }, 1200);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Invalid or expired verification code."
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleResend() {
        setError("");
        setMessage("");
        setResending(true);

        try {
            await resendVerification({
                email,
            });

            setMessage(
                "A new verification code has been sent."
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to resend the verification code."
            );
        } finally {
            setResending(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-12">
            <div className="mx-auto max-w-md">
                <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                            ✉
                        </div>

                        <h1 className="text-3xl font-bold text-slate-900">
                            Verify your email
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Enter the 6-digit code we sent to your email.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {message}
                        </div>
                    )}

                    <form
                        onSubmit={handleVerify}
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
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Verification code
                            </label>

                            <input
                                value={code}
                                onChange={(e) =>
                                    setCode(
                                        e.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 6)
                                    )
                                }
                                required
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                className="w-full rounded-xl border border-slate-300 px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10"
                                placeholder="000000"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={
                                loading ||
                                code.length !== 6
                            }
                            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? "Verifying..."
                                : "Verify email"}
                        </button>
                    </form>

                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={
                            resending ||
                            !email
                        }
                        className="mt-5 w-full text-sm font-semibold text-slate-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {resending
                            ? "Sending..."
                            : "Resend verification code"}
                    </button>

                    <Link
                        to="/login"
                        className="mt-5 block text-center text-sm text-slate-500 hover:text-slate-900"
                    >
                        Back to login
                    </Link>
                </div>
            </div>
        </main>
    );
}