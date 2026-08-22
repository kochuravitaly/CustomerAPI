import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../services/auth.service';
import { VerifyEmailDto } from '../types/auth';

export const VerifyEmail: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const emailFromUrl = searchParams.get('email') || '';

    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<VerifyEmailDto>();

    const onSubmit = async (data: VerifyEmailDto) => {
        setLoading(true);
        setError('');
        try {
            await authService.verifyEmail({
                email: data.email || emailFromUrl,
                code: data.code,
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.response?.data || 'Invalid or expired verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            await authService.resendVerification({ email: emailFromUrl });
            alert('Verification code sent!');
        } catch (err: any) {
            alert(err.response?.data || 'Failed to send code');
        }
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="success-icon">🎉</div>
                    <h2>Email Verified!</h2>
                    <p>Your email has been verified successfully.</p>
                    <Link to="/login" className="btn btn-primary">
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>Verify Email</h2>
                <p className="auth-subtitle">Enter the 6-digit code sent to your email</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                    {!emailFromUrl && (
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                {...register('email', {
                                    required: 'Email is required',
                                })}
                                className={errors.email ? 'input-error' : ''}
                                placeholder="you@example.com"
                            />
                            {errors.email && (
                                <span className="error-text">{errors.email.message}</span>
                            )}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="code">Verification Code</label>
                        <input
                            id="code"
                            type="text"
                            maxLength={6}
                            {...register('code', {
                                required: 'Code is required',
                                pattern: {
                                    value: /^\d{6}$/,
                                    message: 'Code must be exactly 6 digits',
                                },
                            })}
                            className={errors.code ? 'input-error' : ''}
                            placeholder="Enter 6-digit code"
                        />
                        {errors.code && (
                            <span className="error-text">{errors.code.message}</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={loading}
                    >
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>

                <div className="auth-links">
                    <button onClick={handleResend} className="btn-link">
                        Resend verification code
                    </button>
                    <Link to="/login">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};