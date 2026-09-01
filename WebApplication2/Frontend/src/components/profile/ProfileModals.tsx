import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { profileService } from '../../services/profile.service';
import { ChangePasswordDto, ChangeEmailDto, VerifyEmailChangeDto, DeleteAccountDto } from '../../types/profile';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface ProfileModalsProps {
    showChangeEmailModal: boolean;
    setShowChangeEmailModal: (show: boolean) => void;
    showChangePasswordModal: boolean;
    setShowChangePasswordModal: (show: boolean) => void;
    showLogoutConfirm: boolean;
    setShowLogoutConfirm: (show: boolean) => void;
    showDeleteModal: boolean;
    setShowDeleteModal: (show: boolean) => void;
    profile: any;
    onError: (msg: string) => void;
}

export const ProfileModals: React.FC<ProfileModalsProps> = ({
    showChangeEmailModal,
    setShowChangeEmailModal,
    showChangePasswordModal,
    setShowChangePasswordModal,
    showLogoutConfirm,
    setShowLogoutConfirm,
    showDeleteModal,
    setShowDeleteModal,
    profile,
    onError,
}) => {
    const { t } = useLanguage();
    const { logout } = useAuth();
    const queryClient = useQueryClient();

    const [showEmailVerification, setShowEmailVerification] = useState(false);
    const [pendingNewEmail, setPendingNewEmail] = useState('');
    const [changeEmailError, setChangeEmailError] = useState('');
    const [changePasswordError, setChangePasswordError] = useState('');
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    const changePasswordMutation = useMutation({
        mutationFn: (data: ChangePasswordDto) => profileService.changePassword(data),
        onSuccess: () => {
            resetPasswordForm();
            setShowChangePasswordModal(false);
        },
        onError: (err: any) => {
            setChangePasswordError(err.response?.data?.error || err.response?.data || 'Failed to change password');
        },
    });

    const changeEmailMutation = useMutation({
        mutationFn: (data: ChangeEmailDto) => profileService.changeEmail(data),
        onSuccess: () => {
            setShowEmailVerification(true);
            setChangeEmailError('');
            resetEmailForm();
        },
        onError: (err: any) => {
            setChangeEmailError(err.response?.data?.error || err.response?.data || 'Failed to change email');
        },
    });

    const verifyEmailChangeMutation = useMutation({
        mutationFn: (data: VerifyEmailChangeDto) => profileService.verifyEmailChange(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            setShowEmailVerification(false);
            setPendingNewEmail('');
            resetVerifyEmailForm();
            setShowChangeEmailModal(false);
        },
        onError: (err: any) => {
            setChangeEmailError(err.response?.data?.error || err.response?.data || 'Failed to verify email');
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
        setChangePasswordError('');
        if (data.currentPassword === data.newPassword) {
            setChangePasswordError(t.profile.samePassword);
            return;
        }
        changePasswordMutation.mutate(data);
    };

    const onChangeEmail = (data: ChangeEmailDto) => {
        setChangeEmailError('');
        changeEmailMutation.mutate(data);
    };

    const onVerifyEmailChange = (data: VerifyEmailChangeDto) => {
        setChangeEmailError('');
        verifyEmailChangeMutation.mutate({
            newEmail: pendingNewEmail,
            code: data.code,
        });
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword.trim()) {
            setDeleteError(t.profile.passwordRequired);
            return;
        }
        setDeleteLoading(true);
        setDeleteError('');
        try {
            await profileService.deleteAccount({ password: deletePassword } as DeleteAccountDto);
            await logout();
            window.location.href = '/';
        } catch (err: any) {
            setDeleteError(err.response?.data?.error || err.response?.data || 'Failed to delete account');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <>
            {/* Change Email Modal */}
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

                        {changeEmailError && (
                            <div className="alert alert-error" style={{ marginTop: '12px' }}>{changeEmailError}</div>
                        )}

                        {!showEmailVerification ? (
                            <form onSubmit={handleEmailSubmit(onChangeEmail)} className="profile-form" style={{ marginTop: '16px' }}>
                                <p className="verification-info">{t.auth.email}: {profile.email}</p>
                                <input
                                    type="password"
                                    placeholder={t.profile.passwordRequired}
                                    {...registerEmail('password', { required: t.profile.passwordRequired })}
                                />
                                {emailErrors.password && <span className="error-text">{t.profile.passwordRequired}</span>}
                                <input
                                    type="email"
                                    placeholder={t.profile.emailRequired}
                                    {...registerEmail('newEmail', { required: t.profile.emailRequired })}
                                />
                                {emailErrors.newEmail && <span className="error-text">{t.profile.emailRequired}</span>}
                                <div className="modal-actions">
                                    <button type="submit" className="btn btn-primary">{t.profile.sendCode}</button>
                                    <button type="button" onClick={() => setShowChangeEmailModal(false)} className="btn btn-outline">{t.admin.cancel}</button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyEmailSubmit(onVerifyEmailChange)} className="profile-form" style={{ marginTop: '16px' }}>
                                <p className="verification-info">{t.profile.enterCode} {pendingNewEmail}</p>
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder={t.profile.codeRequired}
                                    {...registerVerifyEmail('code', { required: t.profile.codeRequired })}
                                />
                                {verifyEmailErrors.code && <span className="error-text">{t.profile.codeRequired}</span>}
                                <div className="modal-actions">
                                    <button type="submit" className="btn btn-primary">{t.profile.verifyEmail}</button>
                                    <button type="button" onClick={() => setShowChangeEmailModal(false)} className="btn btn-outline">{t.admin.cancel}</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
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

                        {changePasswordError && (
                            <div className="alert alert-error" style={{ marginTop: '12px' }}>{changePasswordError}</div>
                        )}

                        <form onSubmit={handlePasswordSubmit(onChangePassword)} className="profile-form" style={{ marginTop: '16px' }}>
                            <input
                                type="password"
                                placeholder={t.profile.currentPasswordRequired}
                                {...registerPassword('currentPassword', { required: t.profile.currentPasswordRequired })}
                            />
                            {passwordErrors.currentPassword && <span className="error-text">{t.profile.currentPasswordRequired}</span>}
                            <input
                                type="password"
                                placeholder={t.profile.newPasswordRequired}
                                {...registerPassword('newPassword', { required: t.profile.newPasswordRequired, minLength: 8 })}
                            />
                            {passwordErrors.newPassword && <span className="error-text">Min 8</span>}
                            <input
                                type="password"
                                placeholder={t.profile.confirmPasswordRequired}
                                {...registerPassword('confirmNewPassword', { required: t.profile.confirmPasswordRequired })}
                            />
                            {passwordErrors.confirmNewPassword && <span className="error-text">{t.profile.confirmPasswordRequired}</span>}
                            <div className="modal-actions">
                                <button type="submit" className="btn btn-primary">{t.profile.changePassword}</button>
                                <button type="button" onClick={() => setShowChangePasswordModal(false)} className="btn btn-outline">{t.admin.cancel}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Logout Confirmation */}
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

            {/* Delete Account Modal */}
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
        </>
    );
};