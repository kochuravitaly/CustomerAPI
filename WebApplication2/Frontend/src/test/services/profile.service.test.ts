import { describe, it, expect, vi, beforeEach } from 'vitest';
import { profileService } from '../../services/profile.service';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
    apiService: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('profileService', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        vi.mocked(apiService.get).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.post).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.patch).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.delete).mockResolvedValue({ data: {} } as any);
    });

    describe('getProfile', () => {
        it('should call GET /profile', async () => {
            await profileService.getProfile();
            expect(apiService.get).toHaveBeenCalledWith('/profile');
        });
    });

    describe('updateName', () => {
        it('should call PATCH /profile/name with data', async () => {
            await profileService.updateName({ name: 'New Name' });
            expect(apiService.patch).toHaveBeenCalledWith('/profile/name', { name: 'New Name' });
        });
    });

    describe('changeEmail', () => {
        it('should call POST /profile/change-email with data and language', async () => {
            localStorage.setItem('language', 'ru');
            const data = { newEmail: 'new@test.com', password: 'password123' };
            await profileService.changeEmail(data);
            expect(apiService.post).toHaveBeenCalledWith('/profile/change-email', { ...data, language: 'ru' });
        });

        it('should default to en language', async () => {
            const data = { newEmail: 'new@test.com', password: 'password123' };
            await profileService.changeEmail(data);
            expect(apiService.post).toHaveBeenCalledWith('/profile/change-email', { ...data, language: 'en' });
        });
    });

    describe('verifyEmailChange', () => {
        it('should call POST /profile/verify-email-change with data', async () => {
            await profileService.verifyEmailChange({ newEmail: 'new@test.com', code: '123456' });
            expect(apiService.post).toHaveBeenCalledWith('/profile/verify-email-change', { newEmail: 'new@test.com', code: '123456' });
        });
    });

    describe('changePassword', () => {
        it('should call POST /profile/change-password with data', async () => {
            const data = { currentPassword: 'old', newPassword: 'new', confirmNewPassword: 'new' };
            await profileService.changePassword(data);
            expect(apiService.post).toHaveBeenCalledWith('/profile/change-password', data);
        });
    });

    describe('deleteAccount', () => {
        it('should call DELETE /profile with data', async () => {
            await profileService.deleteAccount({ password: 'password123' });
            expect(apiService.delete).toHaveBeenCalledWith('/profile', { data: { password: 'password123' } });
        });
    });

    describe('uploadProfilePicture', () => {
        it('should call POST /profile/picture with FormData', async () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            await profileService.uploadProfilePicture(file);
            expect(apiService.post).toHaveBeenCalledWith(
                '/profile/picture',
                expect.any(FormData),
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
        });
    });

    describe('deleteProfilePicture', () => {
        it('should call DELETE /profile/picture', async () => {
            await profileService.deleteProfilePicture();
            expect(apiService.delete).toHaveBeenCalledWith('/profile/picture');
        });
    });

    describe('getProfilePictureUrl', () => {
        it('should return URL with API URL', () => {
            const url = profileService.getProfilePictureUrl();
            expect(url).toContain('/api/profile/picture');
            expect(url).toContain('t=');
        });
    });

    describe('get2FASetup', () => {
        it('should call GET /profile/2fa/setup', async () => {
            await profileService.get2FASetup();
            expect(apiService.get).toHaveBeenCalledWith('/profile/2fa/setup');
        });
    });

    describe('get2FAStatus', () => {
        it('should call GET /profile/2fa/status', async () => {
            await profileService.get2FAStatus();
            expect(apiService.get).toHaveBeenCalledWith('/profile/2fa/status');
        });
    });

    describe('get2FAInfo', () => {
        it('should call GET /profile/2fa/info', async () => {
            await profileService.get2FAInfo();
            expect(apiService.get).toHaveBeenCalledWith('/profile/2fa/info');
        });
    });

    describe('enable2FA', () => {
        it('should call POST /profile/2fa/enable with code', async () => {
            await profileService.enable2FA('123456');
            expect(apiService.post).toHaveBeenCalledWith('/profile/2fa/enable', { code: '123456' });
        });
    });

    describe('disable2FA', () => {
        it('should call POST /profile/2fa/disable with code', async () => {
            await profileService.disable2FA('123456');
            expect(apiService.post).toHaveBeenCalledWith('/profile/2fa/disable', { code: '123456' });
        });
    });

    describe('setupEmail2FA', () => {
        it('should call POST /profile/2fa/email-setup', async () => {
            await profileService.setupEmail2FA();
            expect(apiService.post).toHaveBeenCalledWith('/profile/2fa/email-setup');
        });
    });

    describe('verifyEmail2FA', () => {
        it('should call POST /profile/2fa/email-verify with code', async () => {
            await profileService.verifyEmail2FA('123456');
            expect(apiService.post).toHaveBeenCalledWith('/profile/2fa/email-verify', { code: '123456' });
        });
    });

    describe('sendDisable2FACode', () => {
        it('should call POST /profile/2fa/send-disable-code', async () => {
            await profileService.sendDisable2FACode();
            expect(apiService.post).toHaveBeenCalledWith('/profile/2fa/send-disable-code');
        });
    });

    describe('getSessions', () => {
        it('should call GET /profile/sessions', async () => {
            await profileService.getSessions();
            expect(apiService.get).toHaveBeenCalledWith('/profile/sessions');
        });
    });

    describe('revokeSession', () => {
        it('should call DELETE /profile/sessions/:sessionId', async () => {
            await profileService.revokeSession(1);
            expect(apiService.delete).toHaveBeenCalledWith('/profile/sessions/1');
        });
    });
});