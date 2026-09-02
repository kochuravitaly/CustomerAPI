import { describe, it, expect, vi, beforeEach } from 'vitest';
import { variantService } from '../../services/variant.service';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
    apiService: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('variantService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(apiService.get).mockResolvedValue({ data: [] } as any);
        vi.mocked(apiService.post).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.delete).mockResolvedValue({ data: {} } as any);
    });

    describe('getColors', () => {
        it('should call GET /products/:productId/variants/colors', async () => {
            await variantService.getColors(1);
            expect(apiService.get).toHaveBeenCalledWith('/products/1/variants/colors');
        });

        it('should return colors array', async () => {
            const mockColors = [{ id: 1, name: 'Red', hexCode: '#FF0000' }];
            vi.mocked(apiService.get).mockResolvedValue({ data: mockColors } as any);
            const result = await variantService.getColors(1);
            expect(result.data).toEqual(mockColors);
        });
    });

    describe('getSizes', () => {
        it('should call GET /products/:productId/variants/sizes', async () => {
            await variantService.getSizes(1);
            expect(apiService.get).toHaveBeenCalledWith('/products/1/variants/sizes');
        });

        it('should return sizes array', async () => {
            const mockSizes = [{ id: 1, name: 'S' }];
            vi.mocked(apiService.get).mockResolvedValue({ data: mockSizes } as any);
            const result = await variantService.getSizes(1);
            expect(result.data).toEqual(mockSizes);
        });
    });

    describe('getVariants', () => {
        it('should call GET /products/:productId/variants', async () => {
            await variantService.getVariants(1);
            expect(apiService.get).toHaveBeenCalledWith('/products/1/variants');
        });

        it('should return variants array', async () => {
            const mockVariants = [{ id: 1, colorId: 1, colorName: 'Red', hexCode: '#FF0000', sizeId: 1, sizeName: 'S', stockQuantity: 10, sku: 'SKU1' }];
            vi.mocked(apiService.get).mockResolvedValue({ data: mockVariants } as any);
            const result = await variantService.getVariants(1);
            expect(result.data).toEqual(mockVariants);
        });
    });

    describe('createColor', () => {
        it('should call POST /products/:productId/variants/colors with data', async () => {
            const data = { name: 'Blue', hexCode: '#0000FF' };
            await variantService.createColor(1, data);
            expect(apiService.post).toHaveBeenCalledWith('/products/1/variants/colors', data);
        });
    });

    describe('createSize', () => {
        it('should call POST /products/:productId/variants/sizes with data', async () => {
            const data = { name: 'M' };
            await variantService.createSize(1, data);
            expect(apiService.post).toHaveBeenCalledWith('/products/1/variants/sizes', data);
        });
    });

    describe('createVariant', () => {
        it('should call POST /products/:productId/variants with data', async () => {
            const data = { colorId: 1, sizeId: 1, stockQuantity: 10, sku: 'SKU1' };
            await variantService.createVariant(1, data);
            expect(apiService.post).toHaveBeenCalledWith('/products/1/variants', data);
        });
    });

    describe('deleteColor', () => {
        it('should call DELETE /products/:productId/variants/colors/:colorId', async () => {
            await variantService.deleteColor(1, 2);
            expect(apiService.delete).toHaveBeenCalledWith('/products/1/variants/colors/2');
        });
    });

    describe('deleteSize', () => {
        it('should call DELETE /products/:productId/variants/sizes/:sizeId', async () => {
            await variantService.deleteSize(1, 2);
            expect(apiService.delete).toHaveBeenCalledWith('/products/1/variants/sizes/2');
        });
    });

    describe('deleteVariant', () => {
        it('should call DELETE /products/:productId/variants/:variantId', async () => {
            await variantService.deleteVariant(1, 2);
            expect(apiService.delete).toHaveBeenCalledWith('/products/1/variants/2');
        });
    });
});