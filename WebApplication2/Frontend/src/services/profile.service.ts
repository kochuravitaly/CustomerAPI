import { apiService } from './api';
import { ProfileDto, UpdateProfileDto, ChangePasswordDto, DeleteAccountDto, ChangeEmailDto, VerifyEmailChangeDto, TwoFactorSetupDto, TwoFactorInfoDto, SessionDto } from '../types/profile';

const getLanguage = () => {
    return localStorage.getItem('language') || 'en';
};

export const profileService = {
    getProfile: () =>
        apiService.get<ProfileDto>('/profile'),

    updateName: (data: UpdateProfileDto) =>
        apiService.patch('/profile/name', data),

    changeEmail: (data: ChangeEmailDto) => {
        const language = getLanguage();
        return apiService.post('/profile/change-email', { ...data, language });
    },

    verifyEmailChange: (data: VerifyEmailChangeDto) =>
        apiService.post('/profile/verify-email-change', data),

    changePassword: (data: ChangePasswordDto) =>
        apiService.post('/profile/change-password', data),

    deleteAccount: (data: DeleteAccountDto) =>
        apiService.delete('/profile', { data }),

    uploadProfilePicture: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiService.post('/profile/picture', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    deleteProfilePicture: () =>
        apiService.delete('/profile/picture'),

    getProfilePictureUrl: () =>
        `${(import.meta as any).env?.VITE_API_URL}/api/profile/picture?t=${Date.now()}`,

    get2FASetup: () =>
        apiService.get<TwoFactorSetupDto>('/profile/2fa/setup'),

    get2FAStatus: () =>
        apiService.get<boolean>('/profile/2fa/status'),

    get2FAInfo: () =>
        apiService.get<TwoFactorInfoDto>('/profile/2fa/info'),

    enable2FA: (code: string) =>
        apiService.post('/profile/2fa/enable', { code }),

    disable2FA: (code: string) =>
        apiService.post('/profile/2fa/disable', { code }),

    setupEmail2FA: () =>
        apiService.post('/profile/2fa/email-setup'),

    verifyEmail2FA: (code: string) =>
        apiService.post('/profile/2fa/email-verify', { code }),

    sendDisable2FACode: () =>
        apiService.post('/profile/2fa/send-disable-code'),

    getSessions: () =>
        apiService.get<SessionDto[]>('/profile/sessions'),

    revokeSession: (sessionId: number) =>
        apiService.delete(`/profile/sessions/${sessionId}`),
};