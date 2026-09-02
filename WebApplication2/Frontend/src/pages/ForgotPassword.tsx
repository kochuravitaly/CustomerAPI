import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../services/auth.service';
import { EmailDto } from '../types/auth';
import { useLanguage } from '../context/LanguageContext';

export const ForgotPassword: React.FC = () => {
    const { t } = useLanguage();
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<EmailDto>();

    const onSubmit = async (data: EmailDto) => {
        setLoading(true);
        setError('');
        try {
            await authService.forgotPassword(data);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="success-icon">📧</div>
                    <h2>{t.auth.checkEmail}</h2>
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
                <p className="auth-subtitle">{t.auth.email}</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
                    <div className="form-group">
                        <label htmlFor="email">{t.auth.email}</label>
                        <input
                            id="email"
                            type="email"
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Please enter a valid email address',
                                },
                            })}
                            className={errors.email ? 'input-error' : ''}
                            placeholder="you@example.com"
                        />
                        {errors.email && (
                            <span className="error-text">{errors.email.message}</span>
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