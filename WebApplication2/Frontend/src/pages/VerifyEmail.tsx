import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../services/auth.service';
import { VerifyEmailDto } from '../types/auth';
import { useLanguage } from '../context/LanguageContext';

export const VerifyEmail: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
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
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data || 'Invalid or expired verification code');
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
                    <h2>{t.auth.registrationSuccess}</h2>
                    <p>{t.auth.redirecting}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>{t.profile.verifyEmail}</h2>
                <p className="auth-subtitle">{t.profile.enterCode}</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                    {!emailFromUrl && (
                        <div className="form-group">
                            <label htmlFor="email">{t.auth.email}</label>
                            <input
                                id="email"
                                type="email"
                                {...register('email', {
                                    required: t.auth.email,
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
                        <label htmlFor="code">{t.profile.enterCode}</label>
                        <input
                            id="code"
                            type="text"
                            maxLength={6}
                            {...register('code', {
                                required: t.profile.enterCode,
                                pattern: {
                                    value: /^\d{6}$/,
                                    message: 'Code must be exactly 6 digits',
                                },
                            })}
                            className={errors.code ? 'input-error' : ''}
                            placeholder="123456"
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
                        {loading ? t.profile.verifying : t.profile.verifyEmail}
                    </button>
                </form>

                <div className="auth-links">
                    <button onClick={handleResend} className="btn-link">
                        {t.profile.sendCode}
                    </button>
                    <Link to="/login">{t.auth.backToLogin}</Link>
                </div>
            </div>
        </div>
    );
};