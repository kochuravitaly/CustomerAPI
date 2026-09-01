import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../../services/account.service';
import { ProfileAccountDto } from '../../types/profile';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface AccountSwitchingProps {
    onError: (msg: string) => void;
}

export const AccountSwitching: React.FC<AccountSwitchingProps> = ({ onError }) => {
    const { user, switchAccount } = useAuth();
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const [showRemoveAccounts, setShowRemoveAccounts] = useState(false);
    const [accountToRemove, setAccountToRemove] = useState<ProfileAccountDto | null>(null);
    const [showConfirmRemove, setShowConfirmRemove] = useState(false);
    const [switchingAccount, setSwitchingAccount] = useState(false);
    const [localError, setLocalError] = useState('');

    const { data: savedAccounts, refetch: refetchAccounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => (await accountService.getAccounts()).data,
        retry: false,
    });

    const handleSwitchAccount = async (accountId: string) => {
        setSwitchingAccount(true);
        try {
            await switchAccount(accountId);
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
        } catch (err: any) {
            setLocalError(err.response?.data?.error || 'Failed to switch account');
            onError(err.response?.data?.error || 'Failed to switch account');
            setTimeout(() => setLocalError(''), 3000);
        } finally {
            setSwitchingAccount(false);
        }
    };

    const handleRemoveAccount = async () => {
        if (!accountToRemove) return;

        try {
            await accountService.removeAccount(accountToRemove.id);
            refetchAccounts();
            setShowConfirmRemove(false);
            setAccountToRemove(null);
        } catch (err: any) {
            setLocalError(err.response?.data?.error || t.profile.failedToRemoveAccount);
            onError(err.response?.data?.error || t.profile.failedToRemoveAccount);
            setTimeout(() => setLocalError(''), 3000);
        }
    };

    return (
        <div className="profile-section">
            <h3>{t.profile.accountSwitching}</h3>

            {localError && (
                <div className="alert alert-error" style={{ marginBottom: '12px' }}>{localError}</div>
            )}

            {savedAccounts && savedAccounts.length > 0 ? (
                savedAccounts.map((account: ProfileAccountDto) => (
                    <div
                        key={account.id}
                        onClick={() => {
                            if (account.id !== user?.id && !switchingAccount) {
                                handleSwitchAccount(account.id);
                            }
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px',
                            border: account.id === user?.id ? '2px solid #4CAF50' : '1px solid var(--border-color)',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            cursor: account.id === user?.id ? 'default' : 'pointer',
                            transition: 'all 0.2s',
                            background: account.id === user?.id ? 'rgba(76, 175, 80, 0.08)' : 'var(--bg-primary)',
                            opacity: switchingAccount ? 0.5 : 1,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--bg-tertiary)',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                flexShrink: 0,
                                color: 'var(--text-tertiary)',
                            }}>
                                {account.hasProfilePicture ? (
                                    <img
                                        src={`${(import.meta as any).env?.VITE_API_URL}/api/profile/picture/${account.id}`}
                                        alt={account.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="8" r="4" />
                                        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>{account.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{account.email}</div>
                            </div>
                        </div>

                        {account.id === user?.id && (
                            <span style={{ color: '#4CAF50', fontSize: '12px', fontWeight: '600' }}>
                                {t.profile.current}
                            </span>
                        )}

                        {showRemoveAccounts && account.id !== user?.id && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setAccountToRemove(account);
                                    setShowConfirmRemove(true);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    color: 'var(--danger)',
                                    padding: '5px',
                                }}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                ))
            ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {t.profile.noSavedAccounts}
                </p>
            )}

            <Link
                to="/add-account"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '10px', textAlign: 'center', display: 'block' }}
            >
                {t.profile.addAccount}
            </Link>

            <button
                type="button"
                onClick={() => setShowRemoveAccounts(!showRemoveAccounts)}
                className="btn btn-outline"
                style={{ width: '100%', marginTop: '10px' }}
            >
                {showRemoveAccounts ? t.admin.cancel : t.profile.remove}
            </button>

            {showConfirmRemove && (
                <div className="modal-overlay" onClick={() => setShowConfirmRemove(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                        <button
                            type="button"
                            onClick={() => setShowConfirmRemove(false)}
                            style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background: 'none',
                                border: 'none',
                                fontSize: '20px',
                                cursor: 'pointer',
                                color: 'var(--text-tertiary)',
                            }}
                        >
                            ✕
                        </button>
                        <h3>{t.profile.remove}</h3>
                        <p style={{ marginTop: '12px' }}>{t.profile.removeAccountConfirm}</p>
                        <div className="modal-actions" style={{ marginTop: '16px' }}>
                            <button type="button" onClick={handleRemoveAccount} className="btn btn-danger">{t.profile.remove}</button>
                            <button type="button" onClick={() => setShowConfirmRemove(false)} className="btn btn-outline">{t.admin.cancel}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};