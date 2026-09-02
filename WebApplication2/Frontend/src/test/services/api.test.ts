import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/api', () => ({
    apiService: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

import { apiService } from '../../services/api';

describe('apiService', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('get', () => {
        it('should call get with URL', async () => {
            await apiService.get('/test');
            expect(vi.mocked(apiService.get)).toHaveBeenCalledWith('/test');
        });

        it('should call get with URL and config', async () => {
            const config = { params: { page: 1 } };
            await apiService.get('/test', config);
            expect(vi.mocked(apiService.get)).toHaveBeenCalledWith('/test', config);
        });

        it('should return response from get', async () => {
            const mockResponse = { data: { id: 1 } };
            vi.mocked(apiService.get).mockResolvedValue(mockResponse as any);
            const result = await apiService.get('/test');
            expect(result).toEqual(mockResponse);
        });

        it('should throw error from get', async () => {
            vi.mocked(apiService.get).mockRejectedValue(new Error('Network error'));
            await expect(apiService.get('/test')).rejects.toThrow('Network error');
        });
    });

    describe('post', () => {
        it('should call post with URL and data', async () => {
            const data = { name: 'Test' };
            await apiService.post('/test', data);
            expect(vi.mocked(apiService.post)).toHaveBeenCalledWith('/test', data);
        });

        it('should call post with URL, data, and config', async () => {
            const data = { name: 'Test' };
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };
            await apiService.post('/test', data, config);
            expect(vi.mocked(apiService.post)).toHaveBeenCalledWith('/test', data, config);
        });

        it('should return response from post', async () => {
            const mockResponse = { data: { id: 1 } };
            vi.mocked(apiService.post).mockResolvedValue(mockResponse as any);
            const result = await apiService.post('/test', {});
            expect(result).toEqual(mockResponse);
        });

        it('should throw error from post', async () => {
            vi.mocked(apiService.post).mockRejectedValue(new Error('Post failed'));
            await expect(apiService.post('/test', {})).rejects.toThrow('Post failed');
        });
    });

    describe('patch', () => {
        it('should call patch with URL and data', async () => {
            const data = { name: 'Updated' };
            await apiService.patch('/test', data);
            expect(vi.mocked(apiService.patch)).toHaveBeenCalledWith('/test', data);
        });

        it('should return response from patch', async () => {
            const mockResponse = { data: { id: 1 } };
            vi.mocked(apiService.patch).mockResolvedValue(mockResponse as any);
            const result = await apiService.patch('/test', {});
            expect(result).toEqual(mockResponse);
        });

        it('should throw error from patch', async () => {
            vi.mocked(apiService.patch).mockRejectedValue(new Error('Patch failed'));
            await expect(apiService.patch('/test', {})).rejects.toThrow('Patch failed');
        });
    });

    describe('put', () => {
        it('should call put with URL and data', async () => {
            const data = { name: 'Updated' };
            await apiService.put('/test', data);
            expect(vi.mocked(apiService.put)).toHaveBeenCalledWith('/test', data);
        });

        it('should return response from put', async () => {
            const mockResponse = { data: { id: 1 } };
            vi.mocked(apiService.put).mockResolvedValue(mockResponse as any);
            const result = await apiService.put('/test', {});
            expect(result).toEqual(mockResponse);
        });

        it('should throw error from put', async () => {
            vi.mocked(apiService.put).mockRejectedValue(new Error('Put failed'));
            await expect(apiService.put('/test', {})).rejects.toThrow('Put failed');
        });
    });

    describe('delete', () => {
        it('should call delete with URL', async () => {
            await apiService.delete('/test');
            expect(vi.mocked(apiService.delete)).toHaveBeenCalledWith('/test');
        });

        it('should call delete with URL and config', async () => {
            const config = { data: { id: 1 } };
            await apiService.delete('/test', config);
            expect(vi.mocked(apiService.delete)).toHaveBeenCalledWith('/test', config);
        });

        it('should return response from delete', async () => {
            const mockResponse = { data: { success: true } };
            vi.mocked(apiService.delete).mockResolvedValue(mockResponse as any);
            const result = await apiService.delete('/test');
            expect(result).toEqual(mockResponse);
        });

        it('should throw error from delete', async () => {
            vi.mocked(apiService.delete).mockRejectedValue(new Error('Delete failed'));
            await expect(apiService.delete('/test')).rejects.toThrow('Delete failed');
        });
    });
});