import { apiService } from './api';
import { ProfileDto, UpdateProfileDto, ChangePasswordDto, DeleteAccountDto, ChangeEmailDto, VerifyEmailChangeDto } from '../types/profile';

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
};