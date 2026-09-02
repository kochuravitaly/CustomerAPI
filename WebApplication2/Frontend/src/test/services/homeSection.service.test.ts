import { describe, it, expect, vi, beforeEach } from 'vitest';
import { homeSectionService } from '../../services/homeSection.service';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
    apiService: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('homeSectionService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(apiService.get).mockResolvedValue({ data: [] } as any);
        vi.mocked(apiService.post).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.patch).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.delete).mockResolvedValue({ data: {} } as any);
    });

    describe('getActive', () => {
        it('should call GET /homesections', async () => {
            await homeSectionService.getActive();
            expect(apiService.get).toHaveBeenCalledWith('/homesections');
        });

        it('should return home sections array', async () => {
            const mockSections = [{ id: 1, title: 'Best Sellers', displayOrder: 1, productsToShow: 4, isActive: true, filterJson: '{}' }];
            vi.mocked(apiService.get).mockResolvedValue({ data: mockSections } as any);
            const result = await homeSectionService.getActive();
            expect(result.data).toEqual(mockSections);
        });

        it('should throw error when API fails', async () => {
            vi.mocked(apiService.get).mockRejectedValue(new Error('Failed to get sections'));
            await expect(homeSectionService.getActive()).rejects.toThrow('Failed to get sections');
        });
    });

    describe('getAll', () => {
        it('should call GET /homesections/all', async () => {
            await homeSectionService.getAll();
            expect(apiService.get).toHaveBeenCalledWith('/homesections/all');
        });
    });

    describe('create', () => {
        it('should call POST /homesections with data', async () => {
            const data = { title: 'New Section', displayOrder: 1, productsToShow: 4, filterJson: '{}' };
            await homeSectionService.create(data);
            expect(apiService.post).toHaveBeenCalledWith('/homesections', data);
        });

        it('should return created section', async () => {
            const mockSection = { id: 1, title: 'New Section', displayOrder: 1, productsToShow: 4, isActive: true, filterJson: '{}' };
            vi.mocked(apiService.post).mockResolvedValue({ data: mockSection } as any);
            const result = await homeSectionService.create({ title: 'New Section', displayOrder: 1, productsToShow: 4, filterJson: '{}' });
            expect(result.data).toEqual(mockSection);
        });
    });

    describe('update', () => {
        it('should call PATCH /homesections/:id with data', async () => {
            const data = { title: 'Updated Section', displayOrder: 2, productsToShow: 6, filterJson: '{}' };
            await homeSectionService.update(1, data);
            expect(apiService.patch).toHaveBeenCalledWith('/homesections/1', data);
        });
    });

    describe('delete', () => {
        it('should call DELETE /homesections/:id', async () => {
            await homeSectionService.delete(1);
            expect(apiService.delete).toHaveBeenCalledWith('/homesections/1');
        });
    });

    describe('getProducts', () => {
        it('should call GET /homesections/:id/products with default params', async () => {
            await homeSectionService.getProducts(1);
            expect(apiService.get).toHaveBeenCalledWith('/homesections/1/products', {
                params: { page: 1, pageSize: 4 },
            });
        });

        it('should call GET /homesections/:id/products with custom params', async () => {
            await homeSectionService.getProducts(1, 2, 10);
            expect(apiService.get).toHaveBeenCalledWith('/homesections/1/products', {
                params: { page: 2, pageSize: 10 },
            });
        });

        it('should return products response', async () => {
            const mockProducts = { items: [], page: 1, pageSize: 4, totalCount: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false };
            vi.mocked(apiService.get).mockResolvedValue({ data: mockProducts } as any);
            const result = await homeSectionService.getProducts(1);
            expect(result.data).toEqual(mockProducts);
        });
    });
});