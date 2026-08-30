import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { profileService } from '../services/profile.service';
import { UpdateProfileDto, ChangePasswordDto, ChangeEmailDto, VerifyEmailChangeDto } from '../types/profile';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Profile: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { logout } = useAuth();
    const { t } = useLanguage();

    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showEmailVerification, setShowEmailVerification] = useState(false);
    const [pendingNewEmail, setPendingNewEmail] = useState('');

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const response = await profileService.getProfile();
            return response.data;
        },
    });

    const updateNameMutation = useMutation({
        mutationFn: (data: UpdateProfileDto) => profileService.updateName(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            setSuccessMessage(t.profile.nameUpdated);
            setShowEditModal(false);
            setTimeout(() => setSuccessMessage(''), 3000);
        },
    });

    const changePasswordMutation = useMutation({
        mutationFn: (data: ChangePasswordDto) => profileService.changePassword(data),
        onSuccess: () => {
            setSuccessMessage(t.profile.passwordChanged);
            setTimeout(() => setSuccessMessage(''), 3000);
            resetPasswordForm();
        },
        onError: (err: any) => {
            alert(err.response?.data?.error || t.common.error);
        },
    });

    const changeEmailMutation = useMutation({
        mutationFn: (data: ChangeEmailDto) => profileService.changeEmail(data),
        onSuccess: () => {
            setShowEmailVerification(true);
            setSuccessMessage(t.profile.codeSent);
            setTimeout(() => setSuccessMessage(''), 3000);
            resetEmailForm();
        },
        onError: (err: any) => {
            alert(err.response?.data?.error || t.common.error);
        },
    });

    const verifyEmailChangeMutation = useMutation({
        mutationFn: (data: VerifyEmailChangeDto) => profileService.verifyEmailChange(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            setShowEmailVerification(false);
            setPendingNewEmail('');
            setSuccessMessage(t.profile.emailUpdated);
            setTimeout(() => setSuccessMessage(''), 3000);
            resetVerifyEmailForm();
        },
        onError: (err: any) => {
            alert(err.response?.data?.error || t.common.error);
        },
    });

    const {
        register: registerName,
        handleSubmit: handleNameSubmit,
        formState: { errors: nameErrors },
    } = useForm<UpdateProfileDto>();

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

    const onUpdateName = (data: UpdateProfileDto) => {
        updateNameMutation.mutate(data);
    };

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

    const handleDeleteAccount = async () => {
        setDeleteLoading(true);
        setDeleteError('');
        try {
            await profileService.deleteAccount({ password: deletePassword });
            await logout();
            navigate('/');
        } catch (err: any) {
            setDeleteError(err.response?.data?.error || t.common.error);
        } finally {
            setDeleteLoading(false);
        }
    };

    if (isLoading) return <LoadingSpinner />;

    if (!profile) return <div>{t.common.error}</div>;

    if (showSettings) {
        return (
            <div className="profile-page">
                <button onClick={() => setShowSettings(false)} className="btn btn-outline back-btn">← {t.admin.back}</button>
                <h1>{t.profile.settings}</h1>

                {successMessage && <div className="alert alert-success">{successMessage}</div>}

                <div className="profile-sections">
                    <div className="profile-section">
                        <h3>{t.profile.changeEmail}</h3>
                        {!showEmailVerification ? (
                            <form onSubmit={handleEmailSubmit(onChangeEmail)} className="profile-form">
                                <p className="verification-info">{t.auth.email}: {profile.email}</p>
                                <input
                                    type="email"
                                    placeholder={t.profile.changeEmail}
                                    {...registerEmail('newEmail', { required: true })}
                                />
                                {emailErrors.newEmail && <span className="error-text">{t.common.error}</span>}
                                <button type="submit" className="btn btn-primary">
                                    {t.profile.sendCode}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyEmailSubmit(onVerifyEmailChange)} className="profile-form">
                                <p className="verification-info">{t.profile.enterCode} {pendingNewEmail}</p>
                                <input
                                    type="text"
                                    maxLength={6}
                                    placeholder={t.profile.enterCode}
                                    {...registerVerifyEmail('code', { required: true })}
                                />
                                {verifyEmailErrors.code && <span className="error-text">{t.common.error}</span>}
                                <button type="submit" className="btn btn-primary">
                                    {t.profile.verifyEmail}
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="profile-section">
                        <h3>{t.profile.changePassword}</h3>
                        <form onSubmit={handlePasswordSubmit(onChangePassword)} className="profile-form">
                            <input type="password" placeholder={t.profile.currentPassword} {...registerPassword('currentPassword', { required: true })} />
                            {passwordErrors.currentPassword && <span className="error-text">{t.common.error}</span>}
                            <input type="password" placeholder={t.profile.newPassword} {...registerPassword('newPassword', { required: true, minLength: 8 })} />
                            {passwordErrors.newPassword && <span className="error-text">Min 8</span>}
                            <input type="password" placeholder={t.profile.confirmNewPassword} {...registerPassword('confirmNewPassword', { required: true })} />
                            {passwordErrors.confirmNewPassword && <span className="error-text">{t.common.error}</span>}
                            <button type="submit" className="btn btn-primary">{t.profile.changePassword}</button>
                        </form>
                    </div>

                    <div className="profile-section danger-zone">
                        <h3>{t.profile.dangerZone}</h3>
                        <button onClick={() => setShowDeleteModal(true)} className="btn btn-danger">
                            {t.profile.deleteAccount}
                        </button>
                    </div>
                </div>

                {showDeleteModal && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <h3>{t.profile.deleteAccount}</h3>
                            <p>{t.profile.deleteConfirm}</p>
                            <p>{t.profile.enterPassword}</p>
                            {deleteError && <div className="alert alert-error">{deleteError}</div>}
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                className="search-input"
                            />
                            <div className="modal-actions">
                                <button onClick={handleDeleteAccount} className="btn btn-danger">{t.profile.deleteMyAccount}</button>
                                <button onClick={() => setShowDeleteModal(false)} className="btn btn-outline">{t.admin.cancel}</button>
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

            <div className="profile-header-account">
                <div className="profile-avatar-default">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                    </svg>
                </div>
                <div className="profile-name-container">
                    <h1>{profile.name}</h1>
                    <button onClick={() => setShowEditModal(true)} className="edit-pencil-btn">✏️</button>
                </div>
                <button onClick={() => setShowSettings(true)} className="settings-gear-btn">⚙️</button>
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
                <button className="profile-menu-item">
                    <span className="profile-menu-icon">❤️</span>
                    {t.profile.wishlist}
                    <span className="profile-menu-arrow">→</span>
                </button>
                <button className="profile-menu-item">
                    <span className="profile-menu-icon">🔄</span>
                    {t.profile.reorder}
                    <span className="profile-menu-arrow">→</span>
                </button>
            </div>

            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{t.profile.editProfile}</h3>
                        <div className="edit-avatar-container">
                            <div className="profile-avatar-default-large">
                                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="12" cy="8" r="4" />
                                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                                </svg>
                            </div>
                            <button className="change-avatar-text">{t.profile.changeProfilePicture}</button>
                        </div>
                        <form onSubmit={handleNameSubmit(onUpdateName)} className="profile-form">
                            <input
                                type="text"
                                defaultValue={profile.name}
                                {...registerName('name', { required: true, minLength: 3 })}
                            />
                            {nameErrors.name && <span className="error-text">Min 3</span>}
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-outline">{t.admin.cancel}</button>
                                <button type="submit" className="btn btn-primary">{t.profile.save}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};