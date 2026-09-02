import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productService, categoryService, productImageService } from '../../services/product.service';
import { apiService } from '../../services/api';

vi.mock('../../services/api', () => ({
    apiService: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

describe('productService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(apiService.get).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.post).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.patch).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.delete).mockResolvedValue({ data: {} } as any);
    });

    describe('getAll', () => {
        it('should call GET /products with params', async () => {
            const params = { page: 1, pageSize: 12, sortBy: 'createdAt', sortDirection: 'desc' };
            await productService.getAll(params);
            expect(apiService.get).toHaveBeenCalledWith('/products', { params });
        });

        it('should return paged response', async () => {
            const mockResponse = { items: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false };
            vi.mocked(apiService.get).mockResolvedValue({ data: mockResponse } as any);
            const result = await productService.getAll({ page: 1, pageSize: 12 });
            expect(result.data).toEqual(mockResponse);
        });
    });

    describe('getById', () => {
        it('should call GET /products/:id', async () => {
            await productService.getById(1);
            expect(apiService.get).toHaveBeenCalledWith('/products/1');
        });
    });

    describe('getBestSellers', () => {
        it('should call GET /products/best-sellers', async () => {
            await productService.getBestSellers();
            expect(apiService.get).toHaveBeenCalledWith('/products/best-sellers');
        });
    });

    describe('create', () => {
        it('should call POST /products with data', async () => {
            const data = { name: 'Product', price: 100, stockQuantity: 10, categoryId: 1 };
            await productService.create(data);
            expect(apiService.post).toHaveBeenCalledWith('/products', data);
        });
    });

    describe('update', () => {
        it('should call PATCH /products/:id with data', async () => {
            const data = { price: 150 };
            await productService.update(1, data);
            expect(apiService.patch).toHaveBeenCalledWith('/products/1', data);
        });
    });

    describe('delete', () => {
        it('should call DELETE /products/:id', async () => {
            await productService.delete(1);
            expect(apiService.delete).toHaveBeenCalledWith('/products/1');
        });
    });
});

describe('categoryService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(apiService.get).mockResolvedValue({ data: [] } as any);
        vi.mocked(apiService.post).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.patch).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.delete).mockResolvedValue({ data: {} } as any);
    });

    describe('getAll', () => {
        it('should call GET /categories', async () => {
            await categoryService.getAll();
            expect(apiService.get).toHaveBeenCalledWith('/categories');
        });
    });

    describe('getById', () => {
        it('should call GET /categories/:id', async () => {
            await categoryService.getById(1);
            expect(apiService.get).toHaveBeenCalledWith('/categories/1');
        });
    });

    describe('create', () => {
        it('should call POST /categories with data', async () => {
            const data = { name: 'Category', description: 'Description' };
            await categoryService.create(data);
            expect(apiService.post).toHaveBeenCalledWith('/categories', data);
        });
    });

    describe('update', () => {
        it('should call PATCH /categories/:id with data', async () => {
            const data = { name: 'Updated Category' };
            await categoryService.update(1, data);
            expect(apiService.patch).toHaveBeenCalledWith('/categories/1', data);
        });
    });

    describe('delete', () => {
        it('should call DELETE /categories/:id', async () => {
            await categoryService.delete(1);
            expect(apiService.delete).toHaveBeenCalledWith('/categories/1');
        });
    });
});

describe('productImageService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(apiService.post).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.delete).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.put).mockResolvedValue({ data: {} } as any);
        vi.mocked(apiService.patch).mockResolvedValue({ data: {} } as any);
    });

    describe('upload', () => {
        it('should call POST /products/:productId/images with FormData', async () => {
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            await productImageService.upload(1, file);
            expect(apiService.post).toHaveBeenCalledWith(
                '/products/1/images',
                expect.any(FormData),
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
        });
    });

    describe('delete', () => {
        it('should call DELETE /products/:productId/images/:imageId', async () => {
            await productImageService.delete(1, 2);
            expect(apiService.delete).toHaveBeenCalledWith('/products/1/images/2');
        });
    });

    describe('setMain', () => {
        it('should call PUT /products/:productId/images/:imageId/main', async () => {
            await productImageService.setMain(1, 2);
            expect(apiService.put).toHaveBeenCalledWith('/products/1/images/2/main');
        });
    });

    describe('updateColor', () => {
        it('should call PATCH /products/:productId/images/:imageId/color with colorId', async () => {
            await productImageService.updateColor(1, 2, 3);
            expect(apiService.patch).toHaveBeenCalledWith('/products/1/images/2/color', { colorId: 3 });
        });
    });
});