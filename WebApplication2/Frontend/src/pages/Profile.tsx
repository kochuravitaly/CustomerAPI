import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { profileService } from '../services/profile.service';
import { UpdateProfileDto, ChangePasswordDto, ChangeEmailDto, VerifyEmailChangeDto, DeleteAccountDto } from '../types/profile';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Profile: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { logout } = useAuth();
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

    const [tempName, setTempName] = useState('');
    const [originalName, setOriginalName] = useState('');
    const [tempPictureFile, setTempPictureFile] = useState<File | null>(null);
    const [tempPicturePreview, setTempPicturePreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => (await profileService.getProfile()).data,
    });

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

    const updateNameMutation = useMutation({
        mutationFn: (data: UpdateProfileDto) => profileService.updateName(data),
    });

    const changePasswordMutation = useMutation({
        mutationFn: (data: ChangePasswordDto) => profileService.changePassword(data),
        onSuccess: () => {
            showSuccess(t.profile.passwordChanged);
            resetPasswordForm();
        },
        onError: (err: any) => {
            showError(err.response?.data?.error || t.common.error);
        },
    });

    const changeEmailMutation = useMutation({
        mutationFn: (data: ChangeEmailDto) => profileService.changeEmail(data),
        onSuccess: () => {
            setShowEmailVerification(true);
            showSuccess(t.profile.codeSent);
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
            setShowEmailVerification(false);
            setPendingNewEmail('');
            showSuccess(t.profile.emailUpdated);
            resetVerifyEmailForm();
        },
        onError: (err: any) => {
            showError(err.response?.data?.error || t.common.error);
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
                showSuccess(messages.join(' '));
                queryClient.invalidateQueries({ queryKey: ['profile'] });
                setProfilePictureVersion(prev => prev + 1);
            }

            setShowEditModal(false);
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
                        <h3>{t.profile.changeEmail}</h3>
                        {!showEmailVerification ? (
                            <form onSubmit={handleEmailSubmit(onChangeEmail)} className="profile-form">
                                <p className="verification-info">{t.auth.email}: {profile.email}</p>
                                <input type="email" placeholder={t.profile.changeEmail} {...registerEmail('newEmail', { required: true })} />
                                {emailErrors.newEmail && <span className="error-text">{t.common.error}</span>}
                                <button type="submit" className="btn btn-primary">{t.profile.sendCode}</button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyEmailSubmit(onVerifyEmailChange)} className="profile-form">
                                <p className="verification-info">{t.profile.enterCode} {pendingNewEmail}</p>
                                <input type="text" maxLength={6} placeholder={t.profile.enterCode} {...registerVerifyEmail('code', { required: true })} />
                                {verifyEmailErrors.code && <span className="error-text">{t.common.error}</span>}
                                <button type="submit" className="btn btn-primary">{t.profile.verifyEmail}</button>
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
                        <button type="button" onClick={() => setShowDeleteModal(true)} className="btn btn-danger">{t.profile.deleteAccount}</button>
                    </div>
                </div>

                {showDeleteModal && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <h3>{t.profile.deleteAccount}</h3>
                            <p>{t.profile.deleteConfirm}</p>
                            <p>{t.profile.enterPassword}</p>
                            {deleteError && <div className="alert alert-error">{deleteError}</div>}
                            <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="search-input" />
                            <div className="modal-actions">
                                <button type="button" onClick={handleDeleteAccount} className="btn btn-danger">{t.profile.deleteMyAccount}</button>
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
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{t.profile.editProfile}</h3>

                        <div className="edit-avatar-container">
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
        </div>
    );
};