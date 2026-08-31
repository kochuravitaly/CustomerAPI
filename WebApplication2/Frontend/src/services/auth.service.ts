import { apiService } from './api';
import {
    LoginDto,
    RegisterCustomerDto,
    TokenResponseDto,
    EmailDto,
    ResetPasswordDto,
    VerifyEmailDto,
    RefreshTokenDto,
} from '../types/auth';

const getLanguage = () => {
    return localStorage.getItem('language') || 'en';
};

export const authService = {
    register: (data: RegisterCustomerDto) => {
        const language = getLanguage();
        return apiService.post('/auth/register', { ...data, language });
    },

    login: (data: LoginDto) =>
        apiService.post<TokenResponseDto>('/auth/login', data),

    verify2FA: (data: { customerId: string; code: string }) =>
        apiService.post<TokenResponseDto>('/auth/verify-2fa', data),

    forgotPassword: (data: EmailDto) => {
        const language = getLanguage();
        return apiService.post('/auth/forgot-password', { ...data, language });
    },

    resetPassword: (data: ResetPasswordDto) =>
        apiService.post('/auth/reset-password', data),

    verifyEmail: (data: VerifyEmailDto) =>
        apiService.post('/auth/verify-email', data),

    resendVerification: (data: EmailDto) => {
        const language = getLanguage();
        return apiService.post('/auth/resend-verification', { ...data, language });
    },

    refresh: (data: RefreshTokenDto) =>
        apiService.post<TokenResponseDto>('/auth/refresh', data),

    logout: (data: RefreshTokenDto) =>
        apiService.post('/auth/logout', data),
};