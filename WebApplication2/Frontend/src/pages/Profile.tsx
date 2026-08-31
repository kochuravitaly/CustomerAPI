import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { profileService } from '../services/profile.service';
import { UpdateProfileDto, ChangePasswordDto, ChangeEmailDto, VerifyEmailChangeDto, DeleteAccountDto, ProfileAccountDto, TwoFactorSetupDto, SessionDto } from '../types/profile';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { accountService } from '../services/account.service';
import { QRCodeSVG } from 'qrcode.react';

export const Profile: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showExpandedPicture, setShowExpandedPicture] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showEmailVerification, setShowEmailVerification] = useState(false);
    const [pendingNewEmail, setPendingNewEmail] = useState('');
    const [profilePictureVersion, setProfilePictureVersion] = useState(0);
    const [profilePicBlob, setProfilePicBlob] = useState<string | null>(null);
    const [showRemoveAccounts, setShowRemoveAccounts] = useState(false);
    const [accountToRemove, setAccountToRemove] = useState<ProfileAccountDto | null>(null);
    const [showConfirmRemove, setShowConfirmRemove] = useState(false);
    const [switchingAccount, setSwitchingAccount] = useState(false);
    const [showDeletePictureConfirm, setShowDeletePictureConfirm] = useState(false);
    const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [twoFASetup, setTwoFASetup] = useState<TwoFactorSetupDto | null>(null);
    const [twoFACode, setTwoFACode] = useState('');
    const [showEmail2FAModal, setShowEmail2FAModal] = useState(false);
    const [email2FACode, setEmail2FACode] = useState('');
    const [emailCodeSent, setEmailCodeSent] = useState(false);
    const [editModalSuccess, setEditModalSuccess] = useState('');
    const [changeEmailSuccess, setChangeEmailSuccess] = useState('');
    const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);

    const [tempName, setTempName] = useState('');
    const [originalName, setOriginalName] = useState('');
    const [tempPictureFile, setTempPictureFile] = useState<File | null>(null);
    const [tempPicturePreview, setTempPicturePreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => (await profileService.getProfile()).data,
    });

    const { data: savedAccounts, refetch: refetchAccounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => (await accountService.getAccounts()).data,
        retry: false,
    });

    const { data: sessions, refetch: refetchSessions } = useQuery({
        queryKey: ['sessions'],
        queryFn: async () => (await profileService.getSessions()).data,
        retry: false,
    });

    useEffect(() => {
        const check2FAStatus = async () => {
            try {
                const response = await profileService.get2FAStatus();
                setIs2FAEnabled(response.data);
            } catch (err) {
                setIs2FAEnabled(false);
            }
        };
        check2FAStatus();
    }, []);

    useEffect(() => {
        const loadProfilePicture = async () => {
            if (profile?.hasProfilePicture) {
                try {
                    const response = await apiService.get('/profile/picture', {
                        responseType: 'blob',
                    });
                    const blobUrl = URL.createObjectURL(response.data as Blob);
                    setProfilePicBlob(blobUrl);
                } catch {
                    setProfilePicBlob(null);
                }
            } else {
                setProfilePicBlob(null);
            }
        };

        loadProfilePicture();

        return () => {
            if (profilePicBlob) {
                URL.revokeObjectURL(profilePicBlob);
            }
        };
    }, [profile?.hasProfilePicture, profilePictureVersion]);

    const showSuccess = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const showError = (msg: string) => {
        setErrorMessage(msg);
        setTimeout(() => setErrorMessage(''), 3000);
    };

    const uploadPictureMutation = useMutation({
        mutationFn: (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            return apiService.post('/profile/picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        },
    });

    const deletePictureMutation = useMutation({
        mutationFn: () => profileService.deleteProfilePicture(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            setProfilePicBlob(null);
            setTempPicturePreview(null);
            setShowDeletePictureConfirm(false);
            setProfilePictureVersion(prev => prev + 1);
            setEditModalSuccess(t.profile.pictureDeleted);
        },
        onError: (err: any) => {
            showError(err.response?.data?.error || t.common.error);
        },
    });

    const updateNameMutation = useMutation({
        mutationFn: (data: UpdateProfileDto) => profileService.updateName(data),
    });

    const changePasswordMutation = useMutation({
        mutationFn: (data: ChangePasswordDto) => profileService.changePassword(data),
        onSuccess: () => {
            setChangePasswordSuccess(t.profile.passwordChanged);
            resetPasswordForm();
            setTimeout(() => {
                setShowChangePasswordModal(false);
                setChangePasswordSuccess('');
            }, 1500);
        },
        onError: (err: any) => {
            showError(err.response?.data?.error || t.common.error);
        },
    });

    const changeEmailMutation = useMutation({
        mutationFn: (data: ChangeEmailDto) => profileService.changeEmail(data),
        onSuccess: () => {
            setShowEmailVerification(true);
            resetEmailForm();
        },
        onError: (err: any) => {
            showError(err.response?.data?.error || t.common.error);
        },
    });

    const verifyEmailChangeMutation = useMutation({
        mutationFn: (data: VerifyEmailChangeDto) => profileService.verifyEmailChange(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            setChangeEmailSuccess(t.profile.emailUpdated);
            setShowEmailVerification(false);
            setPendingNewEmail('');
            resetVerifyEmailForm();
            setTimeout(() => {
                setShowChangeEmailModal(false);
                setChangeEmailSuccess('');
            }, 1500);
        },
        onError: (err: any) => {
            showError(err.response?.data?.error || t.common.error);
        },
    });

    const enable2FAMutation = useMutation({
        mutationFn: (code: string) => profileService.enable2FA(code),
        onSuccess: () => {
            setShow2FAModal(false);
            setTwoFACode('');
            setIs2FAEnabled(true);
            showSuccess(t.profile.twoFAEnabled);
        },
        onError: (err: any) => {
            showError(err.response?.data?.error || 'Failed to enable 2FA');
        },
    });

    const setupEmail2FAMutation = useMutation({
        mutationFn: () => profileService.setupEmail2FA(),
        onSuccess: () => {
            setEmailCodeSent(true);
        },
        onError: (err: any) => {
            showError(err.response?.data?.error || 'Failed to send code');
        },
    });

    const verifyEmail2FAMutation = useMutation({
        mutationFn: (code: string) => profileService.verifyEmail2FA(code),
        onSuccess: () => {
            setShowEmail2FAModal(false);
            setEmailCodeSent(false);
            setEmail2FACode('');
            setIs2FAEnabled(true);
            showSuccess(t.profile.twoFAEnabled);
        },
        onError: (err: any) => {
            showError(err.response?.data?.error || 'Failed to verify code');
        },
    });

    const revokeSessionMutation = useMutation({
        mutationFn: (sessionId: number) => profileService.revokeSession(sessionId),
        onSuccess: () => {
            refetchSessions();
            showSuccess(t.profile.sessionsRevoked);
        },
        onError: (err: any) => {
            showError(err.response?.data?.error || 'Failed to revoke session');
        },
    });

    const {
        register: registerPassword,
        handleSubmit: handlePasswordSubmit,
        reset: resetPasswordForm,
        formState: { errors: passwordErrors },
    } = useForm<ChangePasswordDto>();

    const {
        register: registerEmail,
        handleSubmit: handleEmailSubmit,
        reset: resetEmailForm,
        formState: { errors: emailErrors },
    } = useForm<ChangeEmailDto>();

    const {
        register: registerVerifyEmail,
        handleSubmit: handleVerifyEmailSubmit,
        reset: resetVerifyEmailForm,
        formState: { errors: verifyEmailErrors },
    } = useForm<VerifyEmailChangeDto>();

    const onChangePassword = (data: ChangePasswordDto) => {
        changePasswordMutation.mutate(data);
    };

    const onChangeEmail = (data: ChangeEmailDto) => {
        setPendingNewEmail(data.newEmail);
        changeEmailMutation.mutate(data);
    };

    const onVerifyEmailChange = (data: VerifyEmailChangeDto) => {
        verifyEmailChangeMutation.mutate({
            newEmail: pendingNewEmail,
            code: data.code,
        });
    };

    const handleOpenEditModal = () => {
        if (!profile) return;
        setTempName(profile.name);
        setOriginalName(profile.name);
        setTempPictureFile(null);
        setTempPicturePreview(profilePicBlob);
        setEditModalSuccess('');
        setShowEditModal(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setTempPictureFile(file);
            setTempPicturePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const messages: string[] = [];

        try {
            if (tempName !== originalName && tempName.trim().length >= 3) {
                await updateNameMutation.mutateAsync({ name: tempName });
                messages.push(t.profile.nameUpdated);
            }

            if (tempPictureFile) {
                await uploadPictureMutation.mutateAsync(tempPictureFile);
                messages.push(t.profile.pictureUpdated);
            }

            if (messages.length > 0) {
                setEditModalSuccess(messages.join(' '));
                queryClient.invalidateQueries({ queryKey: ['profile'] });
                setProfilePictureVersion(prev => prev + 1);
            }

            setTempPictureFile(null);
            setTempPicturePreview(null);
        } catch (err: any) {
            showError(err.response?.data?.error || t.common.error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setShowEditModal(false);
        setTempPictureFile(null);
        setTempPicturePreview(null);
        setEditModalSuccess('');
        if (tempPicturePreview && tempPicturePreview !== profilePicBlob) {
            URL.revokeObjectURL(tempPicturePreview);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        setDeleteError('');
        try {
            await profileService.deleteAccount({ password: deletePassword } as DeleteAccountDto);
            await logout();
            navigate('/');
        } catch (err: any) {
            setDeleteError(err.response?.data?.error || err.response?.data || t.common.error);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleRemoveAccount = async () => {
        if (!accountToRemove) return;

        try {
            await accountService.removeAccount(accountToRemove.id);
            refetchAccounts();
            setShowConfirmRemove(false);
            setAccountToRemove(null);
            showSuccess(t.profile.accountRemoved);
        } catch (err: any) {
            showError(err.response?.data?.error || t.profile.failedToRemoveAccount);
        }
    };

    const handleSwitchAccount = async (accountId: string) => {
        setSwitchingAccount(true);
        try {
            const response = await accountService.switchAccount(accountId);
            const { token, refreshToken } = response.data;

            if (!token || !refreshToken) {
                throw new Error('Invalid response');
            }

            localStorage.setItem('accessToken', token);
            localStorage.setItem('refreshToken', refreshToken);

            window.location.reload();
        } catch (err: any) {
            showError(err.response?.data?.error || 'Failed to switch account');
            setSwitchingAccount(false);
        }
    };

    const handleOpen2FASetup = async () => {
        try {
            const response = await profileService.get2FASetup();
            setTwoFASetup(response.data);
            setShow2FAModal(true);
        } catch (err: any) {
            showError('Failed to load 2FA setup');
        }
    };

    if (isLoading) return <LoadingSpinner />;
    if (!profile) return <div>{t.common.error}</div>;

    if (showSettings) {
        return (
            <div className="profile-page">
                <button type="button" onClick={() => setShowSettings(false)} className="btn btn-outline back-btn">← {t.admin.back}</button>
                <h1>{t.profile.settings}</h1>

                {successMessage && <div className="alert alert-success">{successMessage}</div>}
                {errorMessage && <div className="alert alert-error">{errorMessage}</div>}

                <div className="profile-sections">
                    <div className="profile-section">
                        <h3>{t.profile.theme}</h3>
                        <select
                            value={theme}
                            onChange={(e) => {
                                if (e.target.value !== theme) toggleTheme();
                            }}
                            className="sort-select"
                            style={{ width: '100%' }}
                        >
                            <option value="light">{t.profile.lightMode}</option>
                            <option value="dark">{t.profile.darkMode}</option>
                        </select>
                    </div>

                    <div className="profile-section">
                        <h3>{t.profile.accountSwitching}</h3>

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
                    </div>

                    <div className="profile-section">
                        <h3>{t.profile.changeEmail}</h3>
                        <button
                            type="button"
                            onClick={() => setShowChangeEmailModal(true)}
                            className="btn btn-outline"
                            style={{ width: '100%' }}
                        >
                            {t.profile.changeEmail}
                        </button>
                    </div>

                    <div className="profile-section">
                        <h3>{t.profile.changePassword}</h3>
                        <button
                            type="button"
                            onClick={() => setShowChangePasswordModal(true)}
                            className="btn btn-outline"
                            style={{ width: '100%' }}
                        >
                            {t.profile.changePassword}
                        </button>
                    </div>

                    <div className="profile-section">
                        <h3>{t.profile.twoFactorAuth}</h3>

                        {is2FAEnabled ? (
                            <p style={{ color: '#4CAF50', fontWeight: '600', fontSize: '14px' }}>
                                ✅ {t.profile.twoFactorEnabled}
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={handleOpen2FASetup}
                                    className="btn btn-outline"
                                    style={{ width: '100%' }}
                                >
                                    📱 {t.profile.authenticatorApp}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowEmail2FAModal(true)}
                                    className="btn btn-outline"
                                    style={{ width: '100%' }}
                                >
                                    📧 {t.profile.email2FA}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="profile-section">
                        <h3>{t.profile.activeSessions}</h3>
                        {sessions && sessions.length > 0 ? (
                            sessions.map((session: SessionDto) => (
                                <div
                                    key={session.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        marginBottom: '8px',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>
                                            {session.deviceInfo || 'Unknown device'}
                                            {session.isCurrentSession && (
                                                <span style={{ color: '#4CAF50', fontSize: '12px', marginLeft: '8px' }}>
                                                    ({t.profile.currentSession})
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            {session.ipAddress || 'Unknown IP'} • {new Date(session.lastActiveAt).toLocaleString()}
                                        </div>
                                    </div>
                                    {!session.isCurrentSession && (
                                        <button
                                            type="button"
                                            onClick={() => revokeSessionMutation.mutate(session.id)}
                                            className="btn btn-danger btn-small"
                                        >
                                            {t.profile.revoke}
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                {t.profile.noActiveSessions}
                            </p>
                        )}
                    </div>

                    <div className="profile-section">
                        <h3>{t.nav.logout}</h3>
                        <button
                            type="button"
                            onClick={() => setShowLogoutConfirm(true)}
                            className="btn btn-outline"
                            style={{ width: '100%' }}
                        >
                            {t.nav.logout}
                        </button>
                    </div>

                    <div className="profile-section danger-zone">
                        <h3>{t.profile.dangerZone}</h3>
                        <button type="button" onClick={() => setShowDeleteModal(true)} className="btn btn-danger">{t.profile.deleteAccount}</button>
                    </div>
                </div>

                {showChangeEmailModal && (
                    <div className="modal-overlay" onClick={() => setShowChangeEmailModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => setShowChangeEmailModal(false)}
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
                            <h3>{t.profile.changeEmail}</h3>
                            {changeEmailSuccess && (
                                <div className="alert alert-success" style={{ marginTop: '12px' }}>{changeEmailSuccess}</div>
                            )}
                            {!showEmailVerification ? (
                                <form onSubmit={handleEmailSubmit(onChangeEmail)} className="profile-form" style={{ marginTop: '16px' }}>
                                    <p className="verification-info">{t.auth.email}: {profile.email}</p>
                                    <input type="email" placeholder={t.profile.changeEmail} {...registerEmail('newEmail', { required: true })} />
                                    {emailErrors.newEmail && <span className="error-text">{t.common.error}</span>}
                                    <div className="modal-actions">
                                        <button type="submit" className="btn btn-primary">{t.profile.sendCode}</button>
                                        <button type="button" onClick={() => setShowChangeEmailModal(false)} className="btn btn-outline">{t.admin.cancel}</button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyEmailSubmit(onVerifyEmailChange)} className="profile-form" style={{ marginTop: '16px' }}>
                                    <p className="verification-info">{t.profile.enterCode} {pendingNewEmail}</p>
                                    <input type="text" maxLength={6} placeholder={t.profile.enterCode} {...registerVerifyEmail('code', { required: true })} />
                                    {verifyEmailErrors.code && <span className="error-text">{t.common.error}</span>}
                                    <div className="modal-actions">
                                        <button type="submit" className="btn btn-primary">{t.profile.verifyEmail}</button>
                                        <button type="button" onClick={() => setShowChangeEmailModal(false)} className="btn btn-outline">{t.admin.cancel}</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}

                {showChangePasswordModal && (
                    <div className="modal-overlay" onClick={() => setShowChangePasswordModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => setShowChangePasswordModal(false)}
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
                            <h3>{t.profile.changePassword}</h3>
                            {changePasswordSuccess && (
                                <div className="alert alert-success" style={{ marginTop: '12px' }}>{changePasswordSuccess}</div>
                            )}
                            <form onSubmit={handlePasswordSubmit(onChangePassword)} className="profile-form" style={{ marginTop: '16px' }}>
                                <input type="password" placeholder={t.profile.currentPassword} {...registerPassword('currentPassword', { required: true })} />
                                {passwordErrors.currentPassword && <span className="error-text">{t.common.error}</span>}
                                <input type="password" placeholder={t.profile.newPassword} {...registerPassword('newPassword', { required: true, minLength: 8 })} />
                                {passwordErrors.newPassword && <span className="error-text">Min 8</span>}
                                <input type="password" placeholder={t.profile.confirmNewPassword} {...registerPassword('confirmNewPassword', { required: true })} />
                                {passwordErrors.confirmNewPassword && <span className="error-text">{t.common.error}</span>}
                                <div className="modal-actions">
                                    <button type="submit" className="btn btn-primary">{t.profile.changePassword}</button>
                                    <button type="button" onClick={() => setShowChangePasswordModal(false)} className="btn btn-outline">{t.admin.cancel}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {show2FAModal && twoFASetup && (
                    <div className="modal-overlay" onClick={() => setShow2FAModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '400px' }}>
                            <button
                                type="button"
                                onClick={() => setShow2FAModal(false)}
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
                            <h3>{t.profile.setUpAuthenticatorApp}</h3>

                            <div style={{ marginTop: '16px' }}>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                    {t.profile.downloadAuthApp}
                                </p>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                    {t.profile.scanQrCodeWithApp}
                                </p>

                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                                    <QRCodeSVG value={twoFASetup.qrCodeUri} size={180} />
                                </div>

                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', textAlign: 'center' }}>
                                    {t.profile.cantScanEnterKey} <strong>{twoFASetup.secretKey}</strong>
                                </p>

                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                    {t.profile.enterCodeFromApp}
                                </p>

                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={twoFACode}
                                    onChange={(e) => setTwoFACode(e.target.value)}
                                    className="search-input"
                                    style={{ marginBottom: '16px', textAlign: 'center', fontSize: '20px', letterSpacing: '8px' }}
                                />

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        onClick={() => enable2FAMutation.mutate(twoFACode)}
                                        className="btn btn-primary"
                                        disabled={twoFACode.length !== 6}
                                        style={{ width: '100%' }}
                                    >
                                        {t.profile.verifyAndEnable}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showEmail2FAModal && (
                    <div className="modal-overlay" onClick={() => setShowEmail2FAModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => setShowEmail2FAModal(false)}
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
                            <h3>{t.profile.setUpEmail2FA}</h3>

                            {!emailCodeSent ? (
                                <div style={{ marginTop: '16px' }}>
                                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                        {t.profile.wellSendCodeToEmail}
                                    </p>
                                    <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>
                                        {profile.email}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setupEmail2FAMutation.mutate()}
                                        className="btn btn-primary"
                                        style={{ width: '100%' }}
                                        disabled={setupEmail2FAMutation.isPending}
                                    >
                                        {setupEmail2FAMutation.isPending ? '...' : t.profile.sendCode}
                                    </button>
                                </div>
                            ) : (
                                <div style={{ marginTop: '16px' }}>
                                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                        {t.profile.enterCodeSentToEmail}
                                    </p>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="000000"
                                        value={email2FACode}
                                        onChange={(e) => setEmail2FACode(e.target.value)}
                                        className="search-input"
                                        style={{ marginBottom: '16px', textAlign: 'center', fontSize: '20px', letterSpacing: '8px' }}
                                    />
                                    <div className="modal-actions">
                                        <button
                                            type="button"
                                            onClick={() => verifyEmail2FAMutation.mutate(email2FACode)}
                                            className="btn btn-primary"
                                            disabled={email2FACode.length !== 6}
                                            style={{ width: '100%' }}
                                        >
                                            {t.profile.verifyAndEnable}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {showLogoutConfirm && (
                    <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => setShowLogoutConfirm(false)}
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
                            <h3>{t.nav.logout}</h3>
                            <p style={{ marginTop: '12px' }}>{t.profile.logoutConfirm}</p>
                            <div className="modal-actions" style={{ marginTop: '16px' }}>
                                <button type="button" onClick={() => logout()} className="btn btn-danger">{t.nav.logout}</button>
                                <button type="button" onClick={() => setShowLogoutConfirm(false)} className="btn btn-outline">{t.admin.cancel}</button>
                            </div>
                        </div>
                    </div>
                )}

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
                            <p style={{ marginTop: '12px' }}>{t.profile.deleteConfirm}</p>
                            <div className="modal-actions" style={{ marginTop: '16px' }}>
                                <button type="button" onClick={handleRemoveAccount} className="btn btn-danger">{t.profile.remove}</button>
                                <button type="button" onClick={() => setShowConfirmRemove(false)} className="btn btn-outline">{t.admin.cancel}</button>
                            </div>
                        </div>
                    </div>
                )}

                {showDeleteModal && (
                    <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
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
                            <h3>{t.profile.deleteAccount}</h3>
                            <p style={{ marginTop: '12px' }}>{t.profile.deleteConfirm}</p>
                            <p>{t.profile.enterPassword}</p>
                            {deleteError && <div className="alert alert-error">{deleteError}</div>}
                            <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="search-input" style={{ marginTop: '12px' }} />
                            <div className="modal-actions" style={{ marginTop: '16px' }}>
                                <button type="button" onClick={handleDeleteAccount} className="btn btn-danger" disabled={deleteLoading}>
                                    {deleteLoading ? '...' : t.profile.deleteMyAccount}
                                </button>
                                <button type="button" onClick={() => setShowDeleteModal(false)} className="btn btn-outline">{t.admin.cancel}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="profile-page">
            <Link to="/" className="profile-logo">CheyenneShop</Link>

            {successMessage && <div className="alert alert-success">{successMessage}</div>}
            {errorMessage && <div className="alert alert-error">{errorMessage}</div>}

            <div className="profile-header-account">
                <div className="profile-avatar-circle" onClick={() => profilePicBlob && setShowExpandedPicture(true)} style={{ cursor: profilePicBlob ? 'pointer' : 'default' }}>
                    {profilePicBlob ? (
                        <img src={profilePicBlob} alt="Profile" className="profile-avatar-img" />
                    ) : (
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                        </svg>
                    )}
                </div>
                <div className="profile-name-container">
                    <h1>{profile.name}</h1>
                    <button type="button" onClick={handleOpenEditModal} className="edit-pencil-btn">✏️</button>
                </div>
                <button type="button" onClick={() => setShowSettings(true)} className="settings-gear-btn">⚙️</button>
            </div>

            <div className="profile-menu-list">
                <Link to="/orders" className="profile-menu-item">
                    <span className="profile-menu-icon">📦</span>
                    {t.profile.myOrders}
                    <span className="profile-menu-arrow">→</span>
                </Link>
                <Link to="/my-reviews" className="profile-menu-item">
                    <span className="profile-menu-icon">⭐</span>
                    {t.profile.myReviews}
                    <span className="profile-menu-arrow">→</span>
                </Link>
                <button type="button" className="profile-menu-item">
                    <span className="profile-menu-icon">🔄</span>
                    {t.profile.reorder}
                    <span className="profile-menu-arrow">→</span>
                </button>
            </div>

            {showExpandedPicture && profilePicBlob && (
                <div className="media-overlay" onClick={() => setShowExpandedPicture(false)}>
                    <div className="media-expanded" onClick={(e) => e.stopPropagation()}>
                        <button className="media-close" onClick={() => setShowExpandedPicture(false)}>✕</button>
                        <img src={profilePicBlob} alt="Profile" className="media-image" />
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="modal-overlay" onClick={handleCancelEdit}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                        <button
                            type="button"
                            onClick={handleCancelEdit}
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
                        <h3>{t.profile.editProfile}</h3>

                        {editModalSuccess && (
                            <div className="alert alert-success" style={{ marginTop: '12px' }}>{editModalSuccess}</div>
                        )}

                        <div className="edit-avatar-container" style={{ marginTop: '16px' }}>
                            <div className="profile-avatar-circle" style={{ width: '90px', height: '90px' }}>
                                {tempPicturePreview ? (
                                    <img src={tempPicturePreview} alt="Profile" className="profile-avatar-img" />
                                ) : (
                                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="8" r="4" />
                                        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                                    </svg>
                                )}
                            </div>
                            <button type="button" className="change-avatar-text" onClick={() => fileInputRef.current?.click()}>
                                {t.profile.changeProfilePicture}
                            </button>
                            {profile?.hasProfilePicture && !tempPictureFile && (
                                <button
                                    type="button"
                                    onClick={() => setShowDeletePictureConfirm(true)}
                                    className="btn btn-danger btn-small"
                                    style={{ marginTop: '8px' }}
                                >
                                    {t.profile.removeProfilePicture}
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </div>

                        <div className="profile-form">
                            <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                            />
                            <div className="modal-actions">
                                <button type="button" onClick={handleCancelEdit} className="btn btn-outline">{t.admin.cancel}</button>
                                <button type="button" onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
                                    {isSaving ? '...' : t.profile.save}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDeletePictureConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeletePictureConfirm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                        <button
                            type="button"
                            onClick={() => setShowDeletePictureConfirm(false)}
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
                        <h3>{t.profile.removeProfilePicture}</h3>
                        <p style={{ marginTop: '12px' }}>{t.profile.deleteConfirm}</p>
                        <div className="modal-actions" style={{ marginTop: '16px' }}>
                            <button type="button" onClick={() => deletePictureMutation.mutate()} className="btn btn-danger">
                                {t.profile.removeProfilePicture}
                            </button>
                            <button type="button" onClick={() => setShowDeletePictureConfirm(false)} className="btn btn-outline">
                                {t.admin.cancel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};