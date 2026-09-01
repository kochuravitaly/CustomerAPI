import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { profileService } from '../services/profile.service';
import { UpdateProfileDto } from '../types/profile';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AccountSwitching } from '../components/profile/AccountSwitching';
import { TwoFactorSection } from '../components/profile/TwoFactorSection';
import { ActiveSessions } from '../components/profile/ActiveSessions';
import { ProfileModals } from '../components/profile/ProfileModals';

export const Profile: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { t } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showExpandedPicture, setShowExpandedPicture] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [profilePictureVersion, setProfilePictureVersion] = useState(0);
    const [profilePicBlob, setProfilePicBlob] = useState<string | null>(null);
    const [showDeletePictureConfirm, setShowDeletePictureConfirm] = useState(false);
    const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [editModalSuccess, setEditModalSuccess] = useState('');
    const [openSections, setOpenSections] = useState<string[]>(['appearance']);

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
        if (showSettings) {
            document.body.classList.add('hide-bottom-nav');
        } else {
            document.body.classList.remove('hide-bottom-nav');
        }
        return () => {
            document.body.classList.remove('hide-bottom-nav');
        };
    }, [showSettings]);

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
    };

    const showError = (msg: string) => {
        setErrorMessage(msg);
    };

    const toggleSection = (section: string) => {
        setOpenSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
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

    if (isLoading) return <LoadingSpinner />;
    if (!profile) return <div>{t.common.error}</div>;

    if (showSettings) {
        return (
            <div className="profile-page">
                <button type="button" onClick={() => setShowSettings(false)} className="btn btn-outline back-btn">← {t.admin.back}</button>
                <h1>{t.profile.settings}</h1>

                {/* APPEARANCE */}
                <div className="settings-section">
                    <button
                        type="button"
                        className="settings-section-header"
                        onClick={() => toggleSection('appearance')}
                    >
                        <span>🎨 {t.profile.appearance}</span>
                        <span>{openSections.includes('appearance') ? '▼' : '▶'}</span>
                    </button>
                    {openSections.includes('appearance') && (
                        <div className="settings-section-content">
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
                        </div>
                    )}
                </div>

                {/* ACCOUNT */}
                <div className="settings-section">
                    <button
                        type="button"
                        className="settings-section-header"
                        onClick={() => toggleSection('account')}
                    >
                        <span>👤 {t.profile.account}</span>
                        <span>{openSections.includes('account') ? '▼' : '▶'}</span>
                    </button>
                    {openSections.includes('account') && (
                        <div className="settings-section-content">
                            <AccountSwitching onError={showError} />
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
                        </div>
                    )}
                </div>

                {/* SECURITY */}
                <div className="settings-section">
                    <button
                        type="button"
                        className="settings-section-header"
                        onClick={() => toggleSection('security')}
                    >
                        <span>🔒 {t.profile.security}</span>
                        <span>{openSections.includes('security') ? '▼' : '▶'}</span>
                    </button>
                    {openSections.includes('security') && (
                        <div className="settings-section-content">
                            <TwoFactorSection onError={showError} />
                            <ActiveSessions onError={showError} />
                        </div>
                    )}
                </div>

                {/* DANGER ZONE */}
                <div className="settings-section">
                    <button
                        type="button"
                        className="settings-section-header"
                        onClick={() => toggleSection('danger')}
                    >
                        <span>⚠️ {t.profile.dangerZone}</span>
                        <span>{openSections.includes('danger') ? '▼' : '▶'}</span>
                    </button>
                    {openSections.includes('danger') && (
                        <div className="settings-section-content">
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
                                <h3>{t.profile.deleteAccount}</h3>
                                <button type="button" onClick={() => setShowDeleteModal(true)} className="btn btn-danger">{t.profile.deleteAccount}</button>
                            </div>
                        </div>
                    )}
                </div>

                <ProfileModals
                    showChangeEmailModal={showChangeEmailModal}
                    setShowChangeEmailModal={setShowChangeEmailModal}
                    showChangePasswordModal={showChangePasswordModal}
                    setShowChangePasswordModal={setShowChangePasswordModal}
                    showLogoutConfirm={showLogoutConfirm}
                    setShowLogoutConfirm={setShowLogoutConfirm}
                    showDeleteModal={showDeleteModal}
                    setShowDeleteModal={setShowDeleteModal}
                    profile={profile}
                    onError={showError}
                />
            </div>
        );
    }

    return (
        <div className="profile-page">
            <Link to="/" className="profile-logo">CheyenneShop</Link>

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
                <div className="modal-overlay" onClick={() => setShowExpandedPicture(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                        <button
                            type="button"
                            onClick={() => setShowExpandedPicture(false)}
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
                        <img src={profilePicBlob} alt="Profile" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px' }} />
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