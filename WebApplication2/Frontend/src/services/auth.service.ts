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

export const authService = {
    register: (data: RegisterCustomerDto) =>
        apiService.post('/auth/register', data),

    login: (data: LoginDto) =>
        apiService.post<TokenResponseDto>('/auth/login', data),

    forgotPassword: (data: EmailDto) =>
        apiService.post('/auth/forgot-password', data),

    resetPassword: (data: ResetPasswordDto) =>
        apiService.post('/auth/reset-password', data),

    verifyEmail: (data: VerifyEmailDto) =>
        apiService.post('/auth/verify-email', data),

    resendVerification: (data: EmailDto) =>
        apiService.post('/auth/resend-verification', data),

    refresh: (data: RefreshTokenDto) =>
        apiService.post<TokenResponseDto>('/auth/refresh', data),

    logout: (data: RefreshTokenDto) =>
        apiService.post('/auth/logout', data),
};