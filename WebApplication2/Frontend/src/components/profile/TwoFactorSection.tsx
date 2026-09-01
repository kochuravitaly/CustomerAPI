import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { profileService } from '../../services/profile.service';
import { TwoFactorSetupDto } from '../../types/profile';
import { useLanguage } from '../../context/LanguageContext';
import { QRCodeSVG } from 'qrcode.react';

interface TwoFactorSectionProps {
    onError: (msg: string) => void;
}

export const TwoFactorSection: React.FC<TwoFactorSectionProps> = ({ onError }) => {
    const { t } = useLanguage();
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [twoFAMethod, setTwoFAMethod] = useState<'app' | 'email'>('app');
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [twoFASetup, setTwoFASetup] = useState<TwoFactorSetupDto | null>(null);
    const [twoFACode, setTwoFACode] = useState('');
    const [showEmail2FAModal, setShowEmail2FAModal] = useState(false);
    const [email2FACode, setEmail2FACode] = useState('');
    const [emailCodeSent, setEmailCodeSent] = useState(false);
    const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
    const [disableCodeSent, setDisableCodeSent] = useState(false);
    const [localError, setLocalError] = useState('');
    const [localSuccess, setLocalSuccess] = useState('');
    const [cooldownSeconds, setCooldownSeconds] = useState(0);

    useEffect(() => {
        const check2FAStatus = async () => {
            try {
                const response = await profileService.get2FAInfo();
                setIs2FAEnabled(response.data.isEnabled);
                setTwoFAMethod(response.data.method === 'email' ? 'email' : 'app');
            } catch (err) {
                setIs2FAEnabled(false);
            }
        };
        check2FAStatus();
    }, []);

    useEffect(() => {
        if (cooldownSeconds > 0) {
            const timer = setTimeout(() => {
                setCooldownSeconds(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setLocalError('');
        }
    }, [cooldownSeconds]);

    const enable2FAMutation = useMutation({
        mutationFn: (code: string) => profileService.enable2FA(code),
        onSuccess: () => {
            setShow2FAModal(false);
            setTwoFACode('');
            setIs2FAEnabled(true);
            setTwoFAMethod('app');
            setLocalSuccess(t.profile.twoFAEnabled);
            setTimeout(() => setLocalSuccess(''), 3000);
        },
        onError: (err: any) => {
            setLocalError(err.response?.data?.error || 'Failed to enable 2FA');
        },
    });

    const disable2FAMutation = useMutation({
        mutationFn: (code: string) => profileService.disable2FA(code),
        onSuccess: () => {
            setShowDisable2FAModal(false);
            setTwoFACode('');
            setDisableCodeSent(false);
            setIs2FAEnabled(false);
            setLocalSuccess(t.profile.twoFADisabled);
            setTimeout(() => setLocalSuccess(''), 3000);
        },
        onError: (err: any) => {
            setLocalError(err.response?.data?.error || 'Failed to disable 2FA');
        },
    });

    const setupEmail2FAMutation = useMutation({
        mutationFn: () => profileService.setupEmail2FA(),
        onSuccess: () => {
            setEmailCodeSent(true);
        },
        onError: (err: any) => {
            setLocalError(err.response?.data?.error || 'Failed to send code');
        },
    });

    const verifyEmail2FAMutation = useMutation({
        mutationFn: (code: string) => profileService.verifyEmail2FA(code),
        onSuccess: () => {
            setShowEmail2FAModal(false);
            setEmailCodeSent(false);
            setEmail2FACode('');
            setIs2FAEnabled(true);
            setTwoFAMethod('email');
            setLocalSuccess(t.profile.twoFAEnabled);
            setTimeout(() => setLocalSuccess(''), 3000);
        },
        onError: (err: any) => {
            setLocalError(err.response?.data?.error || 'Failed to verify code');
        },
    });

    const handleOpen2FASetup = async () => {
        try {
            const response = await profileService.get2FASetup();
            setTwoFASetup(response.data);
            setLocalError('');
            setShow2FAModal(true);
        } catch (err: any) {
            setLocalError('Failed to load 2FA setup');
        }
    };

    const handleOpenDisableModal = () => {
        setDisableCodeSent(false);
        setTwoFACode('');
        setLocalError('');
        setCooldownSeconds(0);
        setShowDisable2FAModal(true);
    };

    const handleSendDisableCode = async () => {
        try {
            await profileService.sendDisable2FACode();
            setDisableCodeSent(true);
            setLocalError('');
            setCooldownSeconds(0);
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Failed to send code';
            if (errorMsg.includes('Please wait')) {
                setLocalError(errorMsg);
                setCooldownSeconds(60);
            } else {
                setLocalError(errorMsg);
            }
        }
    };

    const handleCodeChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 6) {
            setter(value);
        }
    };

    return (
        <div className="profile-section">
            <h3>{t.profile.twoFactorAuth}</h3>

            {localSuccess && (
                <div className="alert alert-success" style={{ marginBottom: '12px' }}>{localSuccess}</div>
            )}
            {localError && !cooldownSeconds && (
                <div className="alert alert-error" style={{ marginBottom: '12px' }}>{localError}</div>
            )}
            {cooldownSeconds > 0 && (
                <div className="alert alert-error" style={{ marginBottom: '12px' }}>
                    {t.profile.pleaseWait} {cooldownSeconds}s
                </div>
            )}

            {is2FAEnabled ? (
                <div>
                    <p style={{ color: '#4CAF50', fontWeight: '600', fontSize: '14px', marginBottom: '12px' }}>
                        ✅ {t.profile.twoFactorEnabled}
                    </p>
                    <button
                        type="button"
                        onClick={handleOpenDisableModal}
                        className="btn btn-danger btn-small"
                    >
                        {t.profile.disable2FA}
                    </button>
                </div>
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
                        onClick={() => {
                            setEmailCodeSent(false);
                            setEmail2FACode('');
                            setLocalError('');
                            setCooldownSeconds(0);
                            setShowEmail2FAModal(true);
                        }}
                        className="btn btn-outline"
                        style={{ width: '100%' }}
                    >
                        📧 {t.profile.email2FA}
                    </button>
                </div>
            )}

            {/* Authenticator App Setup Modal */}
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

                        {localError && <div className="alert alert-error" style={{ marginTop: '12px' }}>{localError}</div>}

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
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="000000"
                                value={twoFACode}
                                onChange={handleCodeChange(setTwoFACode)}
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

            {/* Email 2FA Setup Modal */}
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

                        {localError && <div className="alert alert-error" style={{ marginTop: '12px' }}>{localError}</div>}

                        {!emailCodeSent ? (
                            <div style={{ marginTop: '16px' }}>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                    {t.profile.wellSendCodeToEmail}
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
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={email2FACode}
                                    onChange={handleCodeChange(setEmail2FACode)}
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

            {/* Disable 2FA Modal */}
            {showDisable2FAModal && (
                <div className="modal-overlay" onClick={() => setShowDisable2FAModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                        <button
                            type="button"
                            onClick={() => setShowDisable2FAModal(false)}
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
                        <h3>{t.profile.disable2FA}</h3>

                        {localError && !cooldownSeconds && <div className="alert alert-error" style={{ marginTop: '12px' }}>{localError}</div>}
                        {cooldownSeconds > 0 && (
                            <div className="alert alert-error" style={{ marginTop: '12px' }}>
                                {t.profile.pleaseWait} {cooldownSeconds}s
                            </div>
                        )}

                        {twoFAMethod === 'email' ? (
                            <div style={{ marginTop: '16px' }}>
                                {!disableCodeSent ? (
                                    <>
                                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                            {t.profile.wellSendCodeToEmail}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleSendDisableCode}
                                            className="btn btn-primary"
                                            style={{ width: '100%' }}
                                            disabled={cooldownSeconds > 0}
                                        >
                                            {cooldownSeconds > 0 ? `${t.profile.pleaseWait} ${cooldownSeconds}s` : t.profile.sendCode}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                            {t.profile.enterCodeSentToEmail}
                                        </p>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            placeholder="000000"
                                            value={twoFACode}
                                            onChange={handleCodeChange(setTwoFACode)}
                                            className="search-input"
                                            style={{ marginBottom: '16px', textAlign: 'center', fontSize: '20px', letterSpacing: '8px' }}
                                        />
                                        <div className="modal-actions">
                                            <button
                                                type="button"
                                                onClick={() => disable2FAMutation.mutate(twoFACode)}
                                                className="btn btn-danger"
                                                disabled={twoFACode.length !== 6}
                                            >
                                                {t.profile.disable2FA}
                                            </button>
                                            <button type="button" onClick={() => setShowDisable2FAModal(false)} className="btn btn-outline">
                                                {t.admin.cancel}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div style={{ marginTop: '16px' }}>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                    {t.profile.enterCodeFromApp}
                                </p>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="000000"
                                    value={twoFACode}
                                    onChange={handleCodeChange(setTwoFACode)}
                                    className="search-input"
                                    style={{ marginBottom: '16px', textAlign: 'center', fontSize: '20px', letterSpacing: '8px' }}
                                />
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        onClick={() => disable2FAMutation.mutate(twoFACode)}
                                        className="btn btn-danger"
                                        disabled={twoFACode.length !== 6}
                                    >
                                        {t.profile.disable2FA}
                                    </button>
                                    <button type="button" onClick={() => setShowDisable2FAModal(false)} className="btn btn-outline">
                                        {t.admin.cancel}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};