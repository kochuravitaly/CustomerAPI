import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../services/account.service';
import { AddAccountDto } from '../types/profile';
import { useLanguage } from '../context/LanguageContext';
import { authService } from '../services/auth.service';

export const AddAccount: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t } = useLanguage();
    const [step, setStep] = useState<'email' | 'password' | '2fa'>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [twoFACode, setTwoFACode] = useState('');
    const [twoFAMethod, setTwoFAMethod] = useState<'app' | 'email'>('app');
    const [challengeToken, setChallengeToken] = useState('');

    const addAccountMutation = useMutation({
        mutationFn: (data: AddAccountDto) => accountService.addAccount(data),
        onSuccess: (response: any) => {
            if (response.data?.requiresTwoFactor) {
                setChallengeToken(response.data.twoFactorChallengeToken || '');
                setTwoFAMethod(response.data.twoFactorMethod === 'email' ? 'email' : 'app');
                setStep('2fa');
            } else {
                queryClient.invalidateQueries({ queryKey: ['accounts'] });
                navigate('/profile');
            }
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || t.profile.failedToAddAccount);
        },
    });

    const verify2FAMutation = useMutation({
        mutationFn: (code: string) => {
            return authService.verify2FA({ challengeToken, code });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            navigate('/profile');
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || t.common.error);
        },
    });

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError(t.profile.emailRequired);
            return;
        }

        const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        if (!emailPattern.test(email)) {
            setError(t.auth.email);
            return;
        }

        setStep('password');
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!password.trim()) {
            setError(t.profile.passwordRequired);
            return;
        }

        addAccountMutation.mutate({ email, password });
    };

    const handle2FASubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        verify2FAMutation.mutate(twoFACode);
    };

    const handleTwoFACodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 6) {
            setTwoFACode(value);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <Link to="/" style={{
                    display: 'block',
                    textAlign: 'center',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    marginBottom: '30px',
                }}>
                    CheyenneShop
                </Link>

                <h2>{t.profile.addAccount}</h2>

                {error && <div className="alert alert-error">{error}</div>}

                {step === 'email' && (
                    <form onSubmit={handleEmailSubmit} className="auth-form" noValidate>
                        <div className="form-group">
                            <label htmlFor="email">{t.profile.enterEmail}</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t.auth.email}
                                autoFocus
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-block">
                            {t.profile.continue}
                        </button>
                    </form>
                )}

                {step === 'password' && (
                    <form onSubmit={handlePasswordSubmit} className="auth-form" noValidate>
                        <div className="form-group">
                            <label>{t.auth.email}</label>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                                <span style={{ color: '#666', fontWeight: '600' }}>{email}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('email');
                                        setPassword('');
                                        setError('');
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#0066c0',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                    }}
                                >
                                    {t.profile.change}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">{t.profile.enterPasswordForAccount}</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t.auth.password}
                                autoFocus
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-block" disabled={addAccountMutation.isPending}>
                            {addAccountMutation.isPending ? t.profile.signingIn : t.profile.signIn}
                        </button>
                    </form>
                )}

                {step === '2fa' && (
                    <form onSubmit={handle2FASubmit} className="auth-form" noValidate>
                        <div className="form-group">
                            <label htmlFor="twoFACode">
                                {twoFAMethod === 'email' ? t.auth.enterCodeFromEmail : t.auth.enterCodeFromApp}
                            </label>
                            <input
                                id="twoFACode"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={twoFACode}
                                onChange={handleTwoFACodeChange}
                                placeholder="000000"
                                style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '8px' }}
                                autoFocus
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-block" disabled={twoFACode.length !== 6 || verify2FAMutation.isPending}>
                            {verify2FAMutation.isPending ? '...' : t.auth.verify}
                        </button>
                    </form>
                )}

                <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="btn btn-outline btn-block"
                    style={{ marginTop: '10px' }}
                >
                    {t.admin.back}
                </button>
            </div>
        </div>
    );
};