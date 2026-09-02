import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { RegisterCustomerDto } from '../types/auth';

export const Register: React.FC = () => {
    const { register: registerUser } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterCustomerDto>();

    const password = watch('password');

    const onSubmit = async (data: RegisterCustomerDto) => {
        setLoading(true);
        setError('');
        try {
            await registerUser(data);
            setSuccess(true);
            setTimeout(() => {
                navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data || 'Error');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="success-icon">✅</div>
                    <h2>{t.auth.registrationSuccess}</h2>
                    <p>{t.auth.checkEmail}</p>
                    <p>{t.auth.redirecting}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>{t.auth.createAccount}</h2>
                <p className="auth-subtitle">{t.auth.registerSubtitle}</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
                    <div className="form-group">
                        <label htmlFor="name">{t.auth.name}</label>
                        <input
                            id="name"
                            type="text"
                            {...register('name', {
                                required: 'Name is required',
                                minLength: { value: 3, message: 'Name must be at least 3 characters' },
                            })}
                            placeholder={t.auth.name}
                        />
                        {errors.name && <span className="error-text">{errors.name.message}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">{t.auth.email}</label>
                        <input
                            id="email"
                            type="email"
                            {...register('email', {
                                required: 'Email is required',
                                pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Please enter a valid email address' },
                            })}
                            placeholder={t.auth.email}
                        />
                        {errors.email && <span className="error-text">{errors.email.message}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">{t.auth.password}</label>
                        <input
                            id="password"
                            type="password"
                            {...register('password', {
                                required: 'Password is required',
                                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                            })}
                            placeholder={t.auth.password}
                        />
                        {errors.password && <span className="error-text">{errors.password.message}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">{t.auth.confirmPassword}</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            {...register('confirmPassword', {
                                required: 'Please confirm your password',
                                validate: (value) => value === password || 'Passwords do not match',
                            })}
                            placeholder={t.auth.confirmPassword}
                        />
                        {errors.confirmPassword && <span className="error-text">{errors.confirmPassword.message}</span>}
                    </div>

                    <div className="checkbox-group">
                        <input type="checkbox" id="privacy" {...register('privacy', { required: 'You must agree to the Privacy Policy' })} />
                        <label htmlFor="privacy">{t.auth.agreeToPrivacy}</label>
                    </div>
                    {errors.privacy && <span className="error-text">{errors.privacy.message}</span>}

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? '...' : t.auth.register}
                    </button>
                </form>

                <div className="auth-links">
                    <Link to="/login">{t.auth.haveAccount}</Link>
                </div>
            </div>
        </div>
    );
};