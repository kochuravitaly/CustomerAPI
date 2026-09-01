import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../services/account.service';
import { AddAccountDto } from '../types/profile';
import { useLanguage } from '../context/LanguageContext';

export const AddAccount: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const addAccountMutation = useMutation({
        mutationFn: (data: AddAccountDto) => accountService.addAccount(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            navigate('/profile');
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || t.profile.failedToAddAccount);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            setError(t.auth.email + ' ' + t.common.error);
            return;
        }
        if (!password.trim()) {
            setError(t.auth.password + ' ' + t.common.error);
            return;
        }
        addAccountMutation.mutate({ email, password });
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

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">{t.auth.email}</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t.auth.email}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">{t.auth.password}</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t.auth.password}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={addAccountMutation.isPending}>
                        {addAccountMutation.isPending ? t.profile.signingIn : t.profile.signIn}
                    </button>
                </form>
            </div>
        </div>
    );
};