import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LoginDto } from '../types/auth';

export const Login: React.FC = () => {
    const { login } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginDto>();

    const onSubmit = async (data: LoginDto) => {
        setLoading(true);
        setError('');
        try {
            await login(data);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data || 'Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>{t.auth.welcomeBack}</h2>
                <p className="auth-subtitle">{t.auth.loginSubtitle}</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">{t.auth.email}</label>
                        <input
                            id="email"
                            type="email"
                            {...register('email', {
                                required: t.auth.email,
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Email',
                                },
                            })}
                            className={errors.email ? 'input-error' : ''}
                            placeholder={t.auth.email}
                        />
                        {errors.email && <span className="error-text">{errors.email.message}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">{t.auth.password}</label>
                        <input
                            id="password"
                            type="password"
                            {...register('password', { required: t.auth.password })}
                            className={errors.password ? 'input-error' : ''}
                            placeholder={t.auth.password}
                        />
                        {errors.password && <span className="error-text">{errors.password.message}</span>}
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? '...' : t.auth.login}
                    </button>
                </form>

                <div className="auth-links">
                    <Link to="/forgot-password">{t.auth.forgotPassword}</Link>
                    <Link to="/register">{t.auth.noAccount}</Link>
                </div>
            </div>
        </div>
    );
};