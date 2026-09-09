import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../services/auth.service';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
    apiService: {
        post: vi.fn(),
    },
}));

describe('authService', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        vi.mocked(apiService.post).mockResolvedValue({ data: {} } as any);
    });

    describe('register', () => {
        it('should call POST /auth/register with data and language', async () => {
            localStorage.setItem('language', 'ru');
            const data = { name: 'Test', email: 'test@example.com', password: 'password123', confirmPassword: 'password123' };
            await authService.register(data);
            expect(apiService.post).toHaveBeenCalledWith('/auth/register', { ...data, language: 'ru' });
        });

        it('should default to en language', async () => {
            const data = { name: 'Test', email: 'test@example.com', password: 'password123', confirmPassword: 'password123' };
            await authService.register(data);
            expect(apiService.post).toHaveBeenCalledWith('/auth/register', { ...data, language: 'en' });
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.post).mockRejectedValue(new Error('Register failed'));
            await expect(authService.register({ name: 'Test', email: 'test@example.com', password: 'password123', confirmPassword: 'password123' })).rejects.toThrow('Register failed');
        });
    });

    describe('login', () => {
        it('should call POST /auth/login with data', async () => {
            const data = { email: 'test@example.com', password: 'password123' };
            await authService.login(data);
            expect(apiService.post).toHaveBeenCalledWith('/auth/login', data);
        });

        it('should return TokenResponseDto', async () => {
            const mockToken = { token: 'token123', refreshToken: 'refresh123' };
            vi.mocked(apiService.post).mockResolvedValue({ data: mockToken } as any);
            const result = await authService.login({ email: 'test@example.com', password: 'password123' });
            expect(result.data).toEqual(mockToken);
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.post).mockRejectedValue(new Error('Login failed'));
            await expect(authService.login({ email: 'test@example.com', password: 'password123' })).rejects.toThrow('Login failed');
        });
    });

    describe('verify2FA', () => {
        it('should call POST /auth/verify-2fa with data', async () => {
            const data = { challengeToken: 'challenge-token-123', code: '123456' };
            await authService.verify2FA(data);
            expect(apiService.post).toHaveBeenCalledWith('/auth/verify-2fa', data);
        });

        it('should return TokenResponseDto', async () => {
            const mockToken = { token: 'token123', refreshToken: 'refresh123' };
            vi.mocked(apiService.post).mockResolvedValue({ data: mockToken } as any);
            const result = await authService.verify2FA({ challengeToken: 'challenge-token-123', code: '123456' });
            expect(result.data).toEqual(mockToken);
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.post).mockRejectedValue(new Error('2FA failed'));
            await expect(authService.verify2FA({ challengeToken: 'challenge-token-123', code: '123456' })).rejects.toThrow('2FA failed');
        });
    });

    describe('forgotPassword', () => {
        it('should call POST /auth/forgot-password with email and language', async () => {
            localStorage.setItem('language', 'ru');
            const data = { email: 'test@example.com' };
            await authService.forgotPassword(data);
            expect(apiService.post).toHaveBeenCalledWith('/auth/forgot-password', { ...data, language: 'ru' });
        });

        it('should default to en language', async () => {
            const data = { email: 'test@example.com' };
            await authService.forgotPassword(data);
            expect(apiService.post).toHaveBeenCalledWith('/auth/forgot-password', { ...data, language: 'en' });
        });
    });

    describe('resetPassword', () => {
        it('should call POST /auth/reset-password with data', async () => {
            const data = { token: 'token123', newPassword: 'newpassword123' };
            await authService.resetPassword(data);
            expect(apiService.post).toHaveBeenCalledWith('/auth/reset-password', data);
        });
    });

    describe('verifyEmail', () => {
        it('should call POST /auth/verify-email with data', async () => {
            const data = { email: 'test@example.com', code: '123456' };
            await authService.verifyEmail(data);
            expect(apiService.post).toHaveBeenCalledWith('/auth/verify-email', data);
        });
    });

    describe('resendVerification', () => {
        it('should call POST /auth/resend-verification with email and language', async () => {
            localStorage.setItem('language', 'ru');
            const data = { email: 'test@example.com' };
            await authService.resendVerification(data);
            expect(apiService.post).toHaveBeenCalledWith('/auth/resend-verification', { ...data, language: 'ru' });
        });

        it('should default to en language', async () => {
            const data = { email: 'test@example.com' };
            await authService.resendVerification(data);
            expect(apiService.post).toHaveBeenCalledWith('/auth/resend-verification', { ...data, language: 'en' });
        });
    });

    describe('refresh', () => {
        it('should call POST /auth/refresh with data', async () => {
            const data = { refreshToken: 'refresh123' };
            await authService.refresh(data);
            expect(apiService.post).toHaveBeenCalledWith('/auth/refresh', data);
        });

        it('should return TokenResponseDto', async () => {
            const mockToken = { token: 'token123', refreshToken: 'refresh123' };
            vi.mocked(apiService.post).mockResolvedValue({ data: mockToken } as any);
            const result = await authService.refresh({ refreshToken: 'refresh123' });
            expect(result.data).toEqual(mockToken);
        });
    });

    describe('logout', () => {
        it('should call POST /auth/logout with data', async () => {
            const data = { refreshToken: 'refresh123' };
            await authService.logout(data);
            expect(apiService.post).toHaveBeenCalledWith('/auth/logout', data);
        });
    });
});