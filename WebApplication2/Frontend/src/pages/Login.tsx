import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LoginDto } from '../types/auth';
import yandexLogo from '../assets/yandex-logo.webp';

export const Login: React.FC = () => {
    const { login, verify2FA } = useAuth();
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const switchState = location.state as any;
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [requires2FA, setRequires2FA] = useState(false);
    const [challengeToken, setChallengeToken] = useState('');
    const [twoFACode, setTwoFACode] = useState('');
    const [twoFAMethod, setTwoFAMethod] = useState<'app' | 'email'>('app');
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        if (switchState?.requires2FA) {
            setChallengeToken(switchState.challengeToken || '');
            setTwoFAMethod(switchState.twoFactorMethod === 'email' ? 'email' : 'app');
            setRequires2FA(true);
        }
    }, [switchState]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('error') === 'oauth_failed') {
            setError(t.auth.oauthFailed || 'OAuth login failed. Please try again.');
        }
    }, [t]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginDto>();

    const onSubmit = async (data: LoginDto) => {
        setLoading(true);
        setError('');
        try {
            const response = await login({ ...data, language, rememberMe });
            if (response.requiresTwoFactor) {
                setChallengeToken(response.challengeToken || '');
                setTwoFAMethod(response.twoFactorMethod === 'email' ? 'email' : 'app');
                setRequires2FA(true);
            } else {
                navigate('/');
            }
        } catch (err: any) {
            setError(err.response?.data || t.auth.error || 'Error');
        } finally {
            setLoading(false);
        }
    };

    const onVerify2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await verify2FA(challengeToken, twoFACode);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data || t.auth.invalidCode || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    const handleTwoFACodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 6) {
            setTwoFACode(value);
        }
    };

    const handleYandexLogin = () => {
        window.location.href = `https://cheyenneshop.ru/api/oauth/yandex/login?rememberMe=${rememberMe}`;
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <h2>{requires2FA ? t.auth.twoFactorAuth : t.auth.welcomeBack}</h2>
                <p className="auth-subtitle">
                    {requires2FA
                        ? (twoFAMethod === 'email'
                            ? t.auth.enterCodeFromEmail
                            : t.auth.enterCodeFromApp)
                        : t.auth.loginSubtitle}
                </p>

                {error && <div className="alert alert-error">{error}</div>}

                {!requires2FA ? (
                    <>
                        <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
                            <div className="form-group">
                                <label htmlFor="email">{t.auth.email}</label>
                                <input
                                    id="email"
                                    type="email"
                                    {...register('email', {
                                        required: t.auth.emailRequired || 'Email is required',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: t.auth.invalidEmail || 'Please enter a valid email address',
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
                                    {...register('password', { required: t.auth.passwordRequired || 'Password is required' })}
                                    className={errors.password ? 'input-error' : ''}
                                    placeholder={t.auth.password}
                                />
                                {errors.password && <span className="error-text">{errors.password.message}</span>}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        cursor: 'pointer',
                                        margin: 0,
                                        flexShrink: 0,
                                    }}
                                />
                                <label
                                    htmlFor="rememberMe"
                                    style={{
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        color: 'var(--text-secondary)',
                                        margin: 0,
                                        lineHeight: '16px',
                                    }}
                                >
                                    {t.auth.rememberMe || 'Remember me'}
                                </label>
                            </div>

                            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                                {loading ? '...' : t.auth.login}
                            </button>
                        </form>

                        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', margin: '16px 0' }}>
                            {t.auth.or || 'or'}
                        </div>

                        <button
                            type="button"
                            onClick={handleYandexLogin}
                            className="btn btn-outline btn-block"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <img
                                src={yandexLogo}
                                alt="Yandex"
                                style={{ width: '24px', height: '24px' }}
                            />
                            {t.auth.loginWithYandex || 'Log in with Yandex'}
                        </button>
                    </>
                ) : (
                    <form onSubmit={onVerify2FA} className="auth-form" noValidate>
                        <div className="form-group">
                            <label htmlFor="twoFACode">{t.auth.enter6DigitCode}</label>
                            <input
                                id="twoFACode"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={twoFACode}
                                onChange={handleTwoFACodeChange}
                                placeholder="000000"
                                style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '8px' }}
                            />
                            {twoFACode.length !== 6 && (
                                <span className="error-text">{t.auth.enterCode || 'Please enter the 6-digit code'}</span>
                            )}
                        </div>

                        <button type="submit" className="btn btn-primary btn-block" disabled={loading || twoFACode.length !== 6}>
                            {loading ? '...' : t.auth.verify}
                        </button>
                    </form>
                )}

                <div className="auth-links">
                    <Link to="/forgot-password">{t.auth.forgotPassword}</Link>
                    <Link to="/register">{t.auth.noAccount}</Link>
                </div>
            </div>
        </div>
    );
};