import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../services/auth.service';
import { ResetPasswordDto } from '../types/auth';

export const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const tokenFromUrl = searchParams.get('token') || '';

    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordDto>();

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
                    <h2>Password Reset Successful!</h2>
                    <p>You can now login with your new password.</p>
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
                <h2>Reset Password</h2>
                <p className="auth-subtitle">Enter your new password</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
                    {!tokenFromUrl && (
                        <div className="form-group">
                            <label htmlFor="token">Reset Token</label>
                            <input
                                id="token"
                                type="text"
                                {...register('token', {
                                    required: 'Token is required',
                                })}
                                className={errors.token ? 'input-error' : ''}
                                placeholder="Enter reset token"
                            />
                            {errors.token && (
                                <span className="error-text">{errors.token.message}</span>
                            )}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                            id="newPassword"
                            type="password"
                            {...register('newPassword', {
                                required: 'Password is required',
                                minLength: {
                                    value: 8,
                                    message: 'Password must be at least 8 characters',
                                },
                                pattern: {
                                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/,
                                    message:
                                        'Must contain uppercase, lowercase, number, and special character',
                                },
                            })}
                            className={errors.newPassword ? 'input-error' : ''}
                            placeholder="Enter new password"
                        />
                        {errors.newPassword && (
                            <span className="error-text">{errors.newPassword.message}</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={loading}
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <div className="auth-links">
                    <Link to="/login">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};