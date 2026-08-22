import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../services/auth.service';
import { EmailDto } from '../types/auth';

export const ForgotPassword: React.FC = () => {
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resetToken, setResetToken] = useState<string>('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<EmailDto>();

    const onSubmit = async (data: EmailDto) => {
        setLoading(true);
        setError('');
        try {
            const response = await authService.forgotPassword(data);
            setResetToken(response.data.token);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data || 'Email not found');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="success-icon">📧</div>
                    <h2>Check Your Email</h2>
                    <p>We've sent a password reset link to your email.</p>
                    {resetToken && (
                        <div className="dev-token">
                            <p>Development Token:</p>
                            <code>{resetToken}</code>
                        </div>
                    )}
                    <Link to={`/reset-password?token=${resetToken}`} className="btn btn-primary">
                        Continue to Reset Password
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>Forgot Password</h2>
                <p className="auth-subtitle">Enter your email to reset password</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Invalid email address',
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
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="auth-links">
                    <Link to="/login">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};