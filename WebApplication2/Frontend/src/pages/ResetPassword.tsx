import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../services/auth.service';
import { ResetPasswordDto } from '../types/auth';
import { useLanguage } from '../context/LanguageContext';

export const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [searchParams] = useSearchParams();
    const tokenFromUrl = searchParams.get('token') || '';

    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ResetPasswordDto>();

    const newPassword = watch('newPassword');

    const onSubmit = async (data: ResetPasswordDto) => {
        setLoading(true);
        setError('');
        try {
            await authService.resetPassword({
                token: data.token || tokenFromUrl,
                newPassword: data.newPassword,
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.response?.data || 'Invalid or expired reset token');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="success-icon">✅</div>
                    <h2>{t.profile.passwordChanged}</h2>
                    <p>{t.auth.redirecting}</p>
                    <Link to="/login" className="btn btn-primary">
                        {t.auth.backToLogin}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>{t.auth.forgotPassword}</h2>
                <p className="auth-subtitle">{t.profile.newPassword}</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
                    {!tokenFromUrl && (
                        <div className="form-group">
                            <label htmlFor="token">Token</label>
                            <input
                                id="token"
                                type="text"
                                {...register('token', {
                                    required: 'Token is required',
                                })}
                                className={errors.token ? 'input-error' : ''}
                                placeholder="Token"
                            />
                            {errors.token && (
                                <span className="error-text">{errors.token.message}</span>
                            )}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="newPassword">{t.profile.newPassword}</label>
                        <input
                            id="newPassword"
                            type="password"
                            {...register('newPassword', {
                                required: t.profile.newPassword,
                                minLength: {
                                    value: 8,
                                    message: 'Minimum 8 characters',
                                },
                                pattern: {
                                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/,
                                    message: 'Must contain uppercase, lowercase, number, and special character',
                                },
                            })}
                            className={errors.newPassword ? 'input-error' : ''}
                            placeholder={t.profile.newPassword}
                        />
                        {errors.newPassword && (
                            <span className="error-text">{errors.newPassword.message}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">{t.auth.confirmPassword}</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            {...register('confirmPassword', {
                                required: t.auth.confirmPassword,
                                validate: (value) => value === newPassword || 'Passwords do not match',
                            })}
                            className={errors.confirmPassword ? 'input-error' : ''}
                            placeholder={t.auth.confirmPassword}
                        />
                        {errors.confirmPassword && (
                            <span className="error-text">{errors.confirmPassword.message}</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={loading}
                    >
                        {loading ? '...' : t.auth.forgotPassword}
                    </button>
                </form>

                <div className="auth-links">
                    <Link to="/login">{t.auth.backToLogin}</Link>
                </div>
            </div>
        </div>
    );
};