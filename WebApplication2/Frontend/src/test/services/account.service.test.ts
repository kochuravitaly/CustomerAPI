import { describe, it, expect, vi, beforeEach } from 'vitest';
import { accountService } from '../../services/account.service';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
    apiService: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('accountService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAccounts', () => {
        it('should call GET /profile/accounts', async () => {
            const mockData = [{ id: 'user-1', name: 'User One', email: 'user1@test.com', role: 'Customer' }];
            vi.mocked(apiService.get).mockResolvedValue({ data: mockData } as any);

            await accountService.getAccounts();

            expect(apiService.get).toHaveBeenCalledWith('/profile/accounts');
        });

        it('should return data from response', async () => {
            const mockData = [{ id: 'user-1', name: 'User One', email: 'user1@test.com', role: 'Customer' }];
            vi.mocked(apiService.get).mockResolvedValue({ data: mockData } as any);

            const result = await accountService.getAccounts();

            expect(result.data).toEqual(mockData);
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.get).mockRejectedValue(new Error('Network error'));

            await expect(accountService.getAccounts()).rejects.toThrow('Network error');
        });
    });

    describe('addAccount', () => {
        it('should call POST /profile/accounts with data', async () => {
            const mockData = { email: 'new@test.com', password: 'password123' };
            vi.mocked(apiService.post).mockResolvedValue({ data: {} } as any);

            await accountService.addAccount(mockData);

            expect(apiService.post).toHaveBeenCalledWith('/profile/accounts', mockData);
        });

        it('should return data from response', async () => {
            const mockResponse = { data: { success: true } };
            vi.mocked(apiService.post).mockResolvedValue(mockResponse as any);

            const result = await accountService.addAccount({ email: 'new@test.com', password: 'password123' });

            expect(result.data).toEqual({ success: true });
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.post).mockRejectedValue(new Error('Failed to add account'));

            await expect(accountService.addAccount({ email: 'new@test.com', password: 'password123' })).rejects.toThrow('Failed to add account');
        });
    });

    describe('removeAccount', () => {
        it('should call DELETE /profile/accounts/:id', async () => {
            vi.mocked(apiService.delete).mockResolvedValue({ data: {} } as any);

            await accountService.removeAccount('user-1');

            expect(apiService.delete).toHaveBeenCalledWith('/profile/accounts/user-1');
        });

        it('should return data from response', async () => {
            const mockResponse = { data: { success: true } };
            vi.mocked(apiService.delete).mockResolvedValue(mockResponse as any);

            const result = await accountService.removeAccount('user-1');

            expect(result.data).toEqual({ success: true });
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.delete).mockRejectedValue(new Error('Failed to remove account'));

            await expect(accountService.removeAccount('user-1')).rejects.toThrow('Failed to remove account');
        });
    });

    describe('switchAccount', () => {
        it('should call POST /profile/switch-account/:id', async () => {
            const mockToken = { token: 'token123', refreshToken: 'refresh123' };
            vi.mocked(apiService.post).mockResolvedValue({ data: mockToken } as any);

            await accountService.switchAccount('user-1');

            expect(apiService.post).toHaveBeenCalledWith('/profile/switch-account/user-1');
        });

        it('should return token data from response', async () => {
            const mockToken = { token: 'token123', refreshToken: 'refresh123' };
            vi.mocked(apiService.post).mockResolvedValue({ data: mockToken } as any);

            const result = await accountService.switchAccount('user-1');

            expect(result.data).toEqual(mockToken);
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.post).mockRejectedValue(new Error('Failed to switch account'));

            await expect(accountService.switchAccount('user-1')).rejects.toThrow('Failed to switch account');
        });
    });
});