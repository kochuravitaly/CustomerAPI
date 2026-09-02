import { describe, it, expect, vi, beforeEach } from 'vitest';
import { attributeService } from '../../services/attribute.service';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
    apiService: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('attributeService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getMaterials', () => {
        it('should call GET /productattributes/materials', async () => {
            vi.mocked(apiService.get).mockResolvedValue({ data: [] } as any);
            await attributeService.getMaterials();
            expect(apiService.get).toHaveBeenCalledWith('/productattributes/materials');
        });
    });

    describe('getStyles', () => {
        it('should call GET /productattributes/styles', async () => {
            vi.mocked(apiService.get).mockResolvedValue({ data: [] } as any);
            await attributeService.getStyles();
            expect(apiService.get).toHaveBeenCalledWith('/productattributes/styles');
        });
    });

    describe('getOccasions', () => {
        it('should call GET /productattributes/occasions', async () => {
            vi.mocked(apiService.get).mockResolvedValue({ data: [] } as any);
            await attributeService.getOccasions();
            expect(apiService.get).toHaveBeenCalledWith('/productattributes/occasions');
        });
    });

    describe('getPatterns', () => {
        it('should call GET /productattributes/patterns', async () => {
            vi.mocked(apiService.get).mockResolvedValue({ data: [] } as any);
            await attributeService.getPatterns();
            expect(apiService.get).toHaveBeenCalledWith('/productattributes/patterns');
        });
    });

    describe('createMaterial', () => {
        it('should call POST /productattributes/materials with name', async () => {
            vi.mocked(apiService.post).mockResolvedValue({ data: {} } as any);
            await attributeService.createMaterial('Cotton');
            expect(apiService.post).toHaveBeenCalledWith('/productattributes/materials', { name: 'Cotton' });
        });
    });

    describe('createStyle', () => {
        it('should call POST /productattributes/styles with name', async () => {
            vi.mocked(apiService.post).mockResolvedValue({ data: {} } as any);
            await attributeService.createStyle('Casual');
            expect(apiService.post).toHaveBeenCalledWith('/productattributes/styles', { name: 'Casual' });
        });
    });

    describe('createOccasion', () => {
        it('should call POST /productattributes/occasions with name', async () => {
            vi.mocked(apiService.post).mockResolvedValue({ data: {} } as any);
            await attributeService.createOccasion('Daily');
            expect(apiService.post).toHaveBeenCalledWith('/productattributes/occasions', { name: 'Daily' });
        });
    });

    describe('createPattern', () => {
        it('should call POST /productattributes/patterns with name', async () => {
            vi.mocked(apiService.post).mockResolvedValue({ data: {} } as any);
            await attributeService.createPattern('Solid');
            expect(apiService.post).toHaveBeenCalledWith('/productattributes/patterns', { name: 'Solid' });
        });
    });

    describe('updateMaterial', () => {
        it('should call PATCH /productattributes/materials/:id', async () => {
            vi.mocked(apiService.patch).mockResolvedValue({ data: {} } as any);
            await attributeService.updateMaterial(1, 'Wool');
            expect(apiService.patch).toHaveBeenCalledWith('/productattributes/materials/1', { name: 'Wool' });
        });
    });

    describe('updateStyle', () => {
        it('should call PATCH /productattributes/styles/:id', async () => {
            vi.mocked(apiService.patch).mockResolvedValue({ data: {} } as any);
            await attributeService.updateStyle(1, 'Formal');
            expect(apiService.patch).toHaveBeenCalledWith('/productattributes/styles/1', { name: 'Formal' });
        });
    });

    describe('updateOccasion', () => {
        it('should call PATCH /productattributes/occasions/:id', async () => {
            vi.mocked(apiService.patch).mockResolvedValue({ data: {} } as any);
            await attributeService.updateOccasion(1, 'Party');
            expect(apiService.patch).toHaveBeenCalledWith('/productattributes/occasions/1', { name: 'Party' });
        });
    });

    describe('updatePattern', () => {
        it('should call PATCH /productattributes/patterns/:id', async () => {
            vi.mocked(apiService.patch).mockResolvedValue({ data: {} } as any);
            await attributeService.updatePattern(1, 'Striped');
            expect(apiService.patch).toHaveBeenCalledWith('/productattributes/patterns/1', { name: 'Striped' });
        });
    });

    describe('deleteMaterial', () => {
        it('should call DELETE /productattributes/materials/:id', async () => {
            vi.mocked(apiService.delete).mockResolvedValue({ data: {} } as any);
            await attributeService.deleteMaterial(1);
            expect(apiService.delete).toHaveBeenCalledWith('/productattributes/materials/1');
        });
    });

    describe('deleteStyle', () => {
        it('should call DELETE /productattributes/styles/:id', async () => {
            vi.mocked(apiService.delete).mockResolvedValue({ data: {} } as any);
            await attributeService.deleteStyle(1);
            expect(apiService.delete).toHaveBeenCalledWith('/productattributes/styles/1');
        });
    });

    describe('deleteOccasion', () => {
        it('should call DELETE /productattributes/occasions/:id', async () => {
            vi.mocked(apiService.delete).mockResolvedValue({ data: {} } as any);
            await attributeService.deleteOccasion(1);
            expect(apiService.delete).toHaveBeenCalledWith('/productattributes/occasions/1');
        });
    });

    describe('deletePattern', () => {
        it('should call DELETE /productattributes/patterns/:id', async () => {
            vi.mocked(apiService.delete).mockResolvedValue({ data: {} } as any);
            await attributeService.deletePattern(1);
            expect(apiService.delete).toHaveBeenCalledWith('/productattributes/patterns/1');
        });
    });
});