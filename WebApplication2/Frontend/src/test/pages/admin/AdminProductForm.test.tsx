import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminProductForm } from '../../../pages/admin/AdminProductForm';
import { LanguageProvider } from '../../../context/LanguageContext';
import { productService, categoryService, productImageService } from '../../../services/product.service';
import { attributeService } from '../../../services/attribute.service';
import { variantService } from '../../../services/variant.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
        useParams: vi.fn(() => ({})),
    };
});

vi.mock('../../../services/product.service', () => ({
    productService: {
        getById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
    categoryService: {
        getAll: vi.fn(),
    },
    productImageService: {
        upload: vi.fn(),
        delete: vi.fn(),
        updateColor: vi.fn(),
    },
}));

vi.mock('../../../services/attribute.service', () => ({
    attributeService: {
        getMaterials: vi.fn(),
        getStyles: vi.fn(),
        getOccasions: vi.fn(),
        getPatterns: vi.fn(),
    },
}));

vi.mock('../../../services/variant.service', () => ({
    variantService: {
        getColors: vi.fn(),
        getVariants: vi.fn(),
        getSizes: vi.fn(),
        createColor: vi.fn(),
        deleteColor: vi.fn(),
        createSize: vi.fn(),
        createVariant: vi.fn(),
        deleteVariant: vi.fn(),
    },
}));

vi.mock('../../../components/LoadingSpinner', () => ({
    LoadingSpinner: () => <div>Loading...</div>,
}));

const mockAxiosResponse = (data: any = {}) => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {
        headers: {},
    },
} as any);

const mockCategories = [
    { id: 1, name: 'Category 1', nameTranslations: { en: 'Category 1' }, description: '' },
];

const mockMaterials = [{ id: 1, name: 'Cotton' }];
const mockStyles = [{ id: 1, name: 'Casual' }];
const mockOccasions = [{ id: 1, name: 'Daily' }];
const mockPatterns = [{ id: 1, name: 'Solid' }];

const mockProduct = {
    id: 1,
    name: 'Existing Product',
    nameTranslations: { en: 'Existing Product' },
    description: 'Existing description',
    descriptionTranslations: { en: 'Existing description' },
    price: 100,
    stockQuantity: 10,
    categoryId: 1,
    categoryName: 'Category 1',
    gender: 0,
    styleId: 1,
    occasionId: 1,
    patternId: 1,
    seasonsJson: '["Summer"]',
    ageGroupsJson: '["Adult"]',
    materialCompositionJson: '[{"materialId":1,"percentage":100}]',
    images: [
        { id: 1, productId: 1, fileName: 'image1.jpg', contentType: 'image/jpeg', fileSize: 1000, sortOrder: 1, isMain: true, objectKey: 'key1', colorId: 1 },
    ],
    createdAt: '',
    updatedAt: '',
};

describe('AdminProductForm', () => {
    let queryClient: QueryClient;
    const mockNavigate = vi.fn();

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useParams).mockReturnValue({});
        vi.mocked(productService.getById).mockResolvedValue(mockAxiosResponse(null));
        vi.mocked(categoryService.getAll).mockResolvedValue(mockAxiosResponse(mockCategories));
        vi.mocked(attributeService.getMaterials).mockResolvedValue(mockAxiosResponse(mockMaterials));
        vi.mocked(attributeService.getStyles).mockResolvedValue(mockAxiosResponse(mockStyles));
        vi.mocked(attributeService.getOccasions).mockResolvedValue(mockAxiosResponse(mockOccasions));
        vi.mocked(attributeService.getPatterns).mockResolvedValue(mockAxiosResponse(mockPatterns));
        vi.mocked(variantService.getColors).mockResolvedValue(mockAxiosResponse([]));
        vi.mocked(variantService.getVariants).mockResolvedValue(mockAxiosResponse([]));
        vi.mocked(variantService.getSizes).mockResolvedValue(mockAxiosResponse([]));
        URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    });

    const renderAdminProductForm = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <AdminProductForm />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Create Mode - Display', () => {
        it('should show form in create mode', () => {
            renderAdminProductForm();
            expect(screen.getByRole('heading', { name: /add/i })).toBeInTheDocument();
        });

        it('should show name input', () => {
            renderAdminProductForm();
            expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0);
        });

        it('should show price and stock inputs', () => {
            renderAdminProductForm();
            expect(screen.getAllByRole('spinbutton').length).toBeGreaterThanOrEqual(2);
        });

        it('should show category select', async () => {
            renderAdminProductForm();
            expect(await screen.findByText('Category 1')).toBeInTheDocument();
        });

        it('should show add color button', () => {
            renderAdminProductForm();
            expect(screen.getByText(/add color/i)).toBeInTheDocument();
        });

        it('should show add material button', () => {
            renderAdminProductForm();
            expect(screen.getByText(/add material/i)).toBeInTheDocument();
        });

        it('should show file upload input', () => {
            renderAdminProductForm();
            expect(document.querySelector('.file-input')).toBeInTheDocument();
        });

        it('should show submit button', () => {
            renderAdminProductForm();
            expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
        });
    });

    describe('Create Mode - Validation', () => {
        it('should show error when name is empty', async () => {
            renderAdminProductForm();
            await userEvent.click(screen.getByRole('button', { name: /create/i }));
            expect(await screen.findByText('Name is required')).toBeInTheDocument();
        });

        it('should show error when price is invalid', async () => {
            renderAdminProductForm();
            await userEvent.type(screen.getAllByRole('textbox')[0], 'Test Product');
            await userEvent.click(screen.getByRole('button', { name: /create/i }));
            expect(await screen.findByText('Price must be greater than 0')).toBeInTheDocument();
        });

        it('should show error when stock is invalid', async () => {
            renderAdminProductForm();
            await userEvent.type(screen.getAllByRole('textbox')[0], 'Test Product');
            const spinbuttons = screen.getAllByRole('spinbutton');
            await userEvent.type(spinbuttons[0], '100');
            await userEvent.type(spinbuttons[1], '-1');
            await userEvent.click(screen.getByRole('button', { name: /create/i }));
            expect(await screen.findByText('Stock must be 0 or greater')).toBeInTheDocument();
        });

        it('should show error when category is not selected', async () => {
            renderAdminProductForm();
            await userEvent.type(screen.getAllByRole('textbox')[0], 'Test Product');
            const spinbuttons = screen.getAllByRole('spinbutton');
            await userEvent.type(spinbuttons[0], '100');
            await userEvent.type(spinbuttons[1], '10');
            await userEvent.click(screen.getByRole('button', { name: /create/i }));
            expect(await screen.findByText('Category is required')).toBeInTheDocument();
        });

        it('should show error when material percentage is not 100', async () => {
            renderAdminProductForm();
            await userEvent.click(screen.getByText(/add material/i));
            await userEvent.type(screen.getAllByRole('textbox')[0], 'Test Product');
            const spinbuttons = screen.getAllByRole('spinbutton');
            await userEvent.type(spinbuttons[0], '100');
            await userEvent.type(spinbuttons[1], '10');
            await userEvent.selectOptions(screen.getAllByRole('combobox')[0], '1');
            await userEvent.click(screen.getByRole('button', { name: /create/i }));
            expect(await screen.findAllByText(/must be 100%/i)).toHaveLength(2);
        });

        it('should show error when color has no image', async () => {
            renderAdminProductForm();
            await userEvent.type(screen.getByPlaceholderText(/color name/i), 'Red');
            await userEvent.click(screen.getByText(/add color/i));
            await userEvent.type(screen.getAllByRole('textbox')[0], 'Test Product');
            const spinbuttons = screen.getAllByRole('spinbutton');
            await userEvent.type(spinbuttons[0], '100');
            await userEvent.type(spinbuttons[1], '10');
            await userEvent.selectOptions(screen.getAllByRole('combobox')[0], '1');
            await userEvent.click(screen.getByRole('button', { name: /create/i }));
            expect(await screen.findByText(/must have at least one image/i)).toBeInTheDocument();
        });
    });

    describe('Create Mode - Color Management', () => {
        it('should add color', async () => {
            renderAdminProductForm();
            await userEvent.type(screen.getByPlaceholderText(/color name/i), 'Red');
            await userEvent.click(screen.getByText(/add color/i));
            expect(screen.getByText('Red')).toBeInTheDocument();
        });

        it('should remove color', async () => {
            renderAdminProductForm();
            await userEvent.type(screen.getByPlaceholderText(/color name/i), 'Red');
            await userEvent.click(screen.getByText(/add color/i));
            await userEvent.click(screen.getByText('✕'));
            expect(screen.queryByText('Red')).not.toBeInTheDocument();
        });

        it('should toggle size for color', async () => {
            renderAdminProductForm();
            await userEvent.type(screen.getByPlaceholderText(/color name/i), 'Red');
            await userEvent.click(screen.getByText(/add color/i));
            const sizeS = screen.getByText('S');
            await userEvent.click(sizeS);
            expect(sizeS).toHaveClass('active');
        });
    });

    describe('Create Mode - Material Management', () => {
        it('should add material composition', async () => {
            renderAdminProductForm();
            await userEvent.click(screen.getByText(/add material/i));
            expect(screen.getByText(/total:/i)).toBeInTheDocument();
        });

        it('should remove material composition', async () => {
            renderAdminProductForm();
            await userEvent.click(screen.getByText(/add material/i));
            await userEvent.click(screen.getByText('✕'));
            expect(screen.queryByText(/total:/i)).not.toBeInTheDocument();
        });
    });

    describe('Create Mode - Seasons and Age Groups', () => {
        it('should toggle season', async () => {
            renderAdminProductForm();
            const summerButton = screen.getByText(/summer/i);
            await userEvent.click(summerButton);
            expect(summerButton).toHaveClass('active');
        });

        it('should toggle age group', async () => {
            renderAdminProductForm();
            const adultButton = screen.getByText(/adult/i);
            await userEvent.click(adultButton);
            expect(adultButton).toHaveClass('active');
        });

        it('should toggle all season exclusively', async () => {
            renderAdminProductForm();
            const allSeasonButton = screen.getByText(/all season/i);
            await userEvent.click(allSeasonButton);
            expect(allSeasonButton).toHaveClass('active');
            const summerButton = screen.getByText(/summer/i);
            await userEvent.click(summerButton);
            expect(allSeasonButton).not.toHaveClass('active');
            expect(summerButton).toHaveClass('active');
        });
    });

    describe('Create Mode - Successful Submit', () => {
        it('should create product when form is valid', async () => {
            vi.mocked(productService.create).mockResolvedValue(mockAxiosResponse({ id: 1 }));
            vi.mocked(variantService.createColor).mockResolvedValue(mockAxiosResponse({ id: 1 }));
            vi.mocked(variantService.createSize).mockResolvedValue(mockAxiosResponse({ id: 1 }));
            vi.mocked(variantService.createVariant).mockResolvedValue(mockAxiosResponse({}));
            vi.mocked(productImageService.upload).mockResolvedValue(mockAxiosResponse({ id: 1 }));

            renderAdminProductForm();
            await userEvent.type(screen.getAllByRole('textbox')[0], 'Test Product');
            const spinbuttons = screen.getAllByRole('spinbutton');
            await userEvent.type(spinbuttons[0], '100');
            await userEvent.type(spinbuttons[1], '10');
            await userEvent.selectOptions(screen.getAllByRole('combobox')[0], '1');
            await userEvent.click(screen.getByRole('button', { name: /create/i }));
            await waitFor(() => {
                expect(vi.mocked(productService.create)).toHaveBeenCalled();
            });
        });

        it('should navigate to admin after create', async () => {
            vi.mocked(productService.create).mockResolvedValue(mockAxiosResponse({ id: 1 }));
            vi.mocked(variantService.createColor).mockResolvedValue(mockAxiosResponse({ id: 1 }));
            vi.mocked(variantService.createSize).mockResolvedValue(mockAxiosResponse({ id: 1 }));
            vi.mocked(variantService.createVariant).mockResolvedValue(mockAxiosResponse({}));

            renderAdminProductForm();
            await userEvent.type(screen.getAllByRole('textbox')[0], 'Test Product');
            const spinbuttons = screen.getAllByRole('spinbutton');
            await userEvent.type(spinbuttons[0], '100');
            await userEvent.type(spinbuttons[1], '10');
            await userEvent.selectOptions(screen.getAllByRole('combobox')[0], '1');
            await userEvent.click(screen.getByRole('button', { name: /create/i }));
            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/admin');
            });
        });

        it('should disable button while creating', async () => {
            vi.mocked(productService.create).mockImplementation(() => new Promise(() => { }));

            renderAdminProductForm();
            await userEvent.type(screen.getAllByRole('textbox')[0], 'Test Product');
            const spinbuttons = screen.getAllByRole('spinbutton');
            await userEvent.type(spinbuttons[0], '100');
            await userEvent.type(spinbuttons[1], '10');
            await userEvent.selectOptions(screen.getAllByRole('combobox')[0], '1');
            const submitButton = screen.getByRole('button', { name: /create/i });
            await userEvent.click(submitButton);
            expect(submitButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });
    });

    describe('Edit Mode', () => {
        beforeEach(() => {
            vi.mocked(useParams).mockReturnValue({ id: '1' });
            vi.mocked(productService.getById).mockResolvedValue(mockAxiosResponse(mockProduct));
            vi.mocked(variantService.getColors).mockResolvedValue(mockAxiosResponse([{ id: 1, name: 'Red', hexCode: '#FF0000' }]));
            vi.mocked(variantService.getVariants).mockResolvedValue(mockAxiosResponse([{ colorId: 1, sizeName: 'M', stockQuantity: 5 }]));
        });

        it('should show loading spinner while product loads', () => {
            vi.mocked(productService.getById).mockImplementation(() => new Promise(() => { }));
            renderAdminProductForm();
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });

        it('should show form in edit mode', async () => {
            renderAdminProductForm();
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /edit/i })).toBeInTheDocument();
            });
        });

        it('should load existing name', async () => {
            renderAdminProductForm();
            await waitFor(() => {
                expect(screen.getByDisplayValue('Existing Product')).toBeInTheDocument();
            });
        });

        it('should load existing price', async () => {
            renderAdminProductForm();
            await waitFor(() => {
                expect(screen.getAllByDisplayValue('100').length).toBeGreaterThan(0);
            });
        });

        it('should load existing colors', async () => {
            renderAdminProductForm();
            await waitFor(() => {
                expect(screen.getAllByText('Red').length).toBeGreaterThan(0);
            });
        });

        it('should load existing images', async () => {
            renderAdminProductForm();
            await waitFor(() => {
                expect(screen.getByText(/existing images/i)).toBeInTheDocument();
            });
        });

        it('should load existing seasons', async () => {
            renderAdminProductForm();
            await waitFor(() => {
                const summerButton = screen.getByText(/summer/i);
                expect(summerButton).toHaveClass('active');
            });
        });

        it('should load existing age groups', async () => {
            renderAdminProductForm();
            await waitFor(() => {
                const adultButton = screen.getByText(/adult/i);
                expect(adultButton).toHaveClass('active');
            });
        });

        it('should update product when submitted', async () => {
            vi.mocked(productService.update).mockResolvedValue(mockAxiosResponse({}));
            vi.mocked(variantService.deleteVariant).mockResolvedValue(mockAxiosResponse({}));
            vi.mocked(variantService.deleteColor).mockResolvedValue(mockAxiosResponse({}));

            renderAdminProductForm();
            await waitFor(() => {
                expect(screen.getByDisplayValue('Existing Product')).toBeInTheDocument();
            });
            await userEvent.click(screen.getByRole('button', { name: /update/i }));
            await waitFor(() => {
                expect(vi.mocked(productService.update)).toHaveBeenCalled();
            });
        });

        it('should navigate to admin after update', async () => {
            vi.mocked(productService.update).mockResolvedValue(mockAxiosResponse({}));
            vi.mocked(variantService.deleteVariant).mockResolvedValue(mockAxiosResponse({}));
            vi.mocked(variantService.deleteColor).mockResolvedValue(mockAxiosResponse({}));

            renderAdminProductForm();
            await waitFor(() => {
                expect(screen.getByDisplayValue('Existing Product')).toBeInTheDocument();
            });
            await userEvent.click(screen.getByRole('button', { name: /update/i }));
            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/admin');
            });
        });

        it('should mark image for deletion', async () => {
            renderAdminProductForm();
            await waitFor(() => {
                expect(screen.getByText(/existing images/i)).toBeInTheDocument();
            });
            await userEvent.click(screen.getByText('🗑️'));
            expect(screen.getByText('↩')).toBeInTheDocument();
        });

        it('should undo image deletion', async () => {
            renderAdminProductForm();
            await waitFor(() => {
                expect(screen.getByText(/existing images/i)).toBeInTheDocument();
            });
            await userEvent.click(screen.getByText('🗑️'));
            await userEvent.click(screen.getByText('↩'));
            expect(screen.getByText('🗑️')).toBeInTheDocument();
        });
    });

    describe('Color Picker Modal', () => {
        beforeEach(() => {
            vi.mocked(useParams).mockReturnValue({ id: '1' });
            vi.mocked(productService.getById).mockResolvedValue(mockAxiosResponse(mockProduct));
            vi.mocked(variantService.getColors).mockResolvedValue(mockAxiosResponse([{ id: 1, name: 'Red', hexCode: '#FF0000' }, { id: 2, name: 'Blue', hexCode: '#0000FF' }]));
            vi.mocked(variantService.getVariants).mockResolvedValue(mockAxiosResponse([{ colorId: 1, sizeName: 'M', stockQuantity: 5 }]));
        });

        it('should open color picker for existing image', async () => {
            renderAdminProductForm();
            await waitFor(() => {
                expect(screen.getByText(/existing images/i)).toBeInTheDocument();
            });
            const colorDisplayButtons = screen.getAllByText(/red/i);
            await userEvent.click(colorDisplayButtons[1]);
            expect(await screen.findByText(/assign color/i)).toBeInTheDocument();
        });

        it('should assign color to existing image', async () => {
            renderAdminProductForm();
            await waitFor(() => {
                expect(screen.getByText(/existing images/i)).toBeInTheDocument();
            });
            const colorDisplayButtons = screen.getAllByText(/red/i);
            await userEvent.click(colorDisplayButtons[1]);
            const blueOptions = await screen.findAllByText(/blue/i);
            await userEvent.click(blueOptions[1]);
            await waitFor(() => {
                expect(screen.queryByText(/assign color/i)).not.toBeInTheDocument();
            });
        });

        it('should close color picker when clicking overlay', async () => {
            renderAdminProductForm();
            await waitFor(() => {
                expect(screen.getByText(/existing images/i)).toBeInTheDocument();
            });
            const colorDisplayButtons = screen.getAllByText(/red/i);
            await userEvent.click(colorDisplayButtons[1]);
            const overlay = document.querySelector('.modal-overlay') as HTMLElement;
            await userEvent.click(overlay);
            await waitFor(() => {
                expect(screen.queryByText(/assign color/i)).not.toBeInTheDocument();
            });
        });
    });

    describe('Image Expansion', () => {
        beforeEach(() => {
            vi.mocked(useParams).mockReturnValue({ id: '1' });
            vi.mocked(productService.getById).mockResolvedValue(mockAxiosResponse(mockProduct));
            vi.mocked(variantService.getColors).mockResolvedValue(mockAxiosResponse([{ id: 1, name: 'Red', hexCode: '#FF0000' }]));
            vi.mocked(variantService.getVariants).mockResolvedValue(mockAxiosResponse([{ colorId: 1, sizeName: 'M', stockQuantity: 5 }]));
        });

        it('should expand existing image when clicked', async () => {
            renderAdminProductForm();
            await waitFor(() => {
                expect(screen.getByText(/existing images/i)).toBeInTheDocument();
            });
            await userEvent.click(screen.getByAltText('image1.jpg'));
            expect(document.querySelector('.media-close')).toBeInTheDocument();
        });

        it('should close expanded image', async () => {
            renderAdminProductForm();
            await waitFor(() => {
                expect(screen.getByText(/existing images/i)).toBeInTheDocument();
            });
            await userEvent.click(screen.getByAltText('image1.jpg'));
            const closeButton = document.querySelector('.media-close') as HTMLElement;
            await userEvent.click(closeButton);
            expect(document.querySelector('.media-close')).not.toBeInTheDocument();
        });
    });

    describe('Error Modal', () => {
        it('should show error modal when create fails', async () => {
            vi.mocked(productService.create).mockRejectedValue({
                response: { data: { error: 'Failed to create' } },
            });

            renderAdminProductForm();
            await userEvent.type(screen.getAllByRole('textbox')[0], 'Test Product');
            const spinbuttons = screen.getAllByRole('spinbutton');
            await userEvent.type(spinbuttons[0], '100');
            await userEvent.type(spinbuttons[1], '10');
            await userEvent.selectOptions(screen.getAllByRole('combobox')[0], '1');
            await userEvent.click(screen.getByRole('button', { name: /create/i }));
            expect(await screen.findByText('Failed to create')).toBeInTheDocument();
        });

        it('should close error modal when OK clicked', async () => {
            vi.mocked(productService.create).mockRejectedValue({
                response: { data: { error: 'Failed to create' } },
            });

            renderAdminProductForm();
            await userEvent.type(screen.getAllByRole('textbox')[0], 'Test Product');
            const spinbuttons = screen.getAllByRole('spinbutton');
            await userEvent.type(spinbuttons[0], '100');
            await userEvent.type(spinbuttons[1], '10');
            await userEvent.selectOptions(screen.getAllByRole('combobox')[0], '1');
            await userEvent.click(screen.getByRole('button', { name: /create/i }));
            const okButton = await screen.findByText(/ok/i);
            await userEvent.click(okButton);
            expect(screen.queryByText('Failed to create')).not.toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should navigate back when back button clicked', () => {
            renderAdminProductForm();
            screen.getByText(/back/i).click();
            expect(mockNavigate).toHaveBeenCalledWith('/admin');
        });

        it('should navigate back when cancel clicked', () => {
            renderAdminProductForm();
            screen.getByText(/cancel/i).click();
            expect(mockNavigate).toHaveBeenCalledWith('/admin');
        });
    });

    describe('Create Mode - File Upload', () => {
        it('should upload files and show previews', async () => {
            renderAdminProductForm();
            const fileInput = document.querySelector('.file-input') as HTMLElement;
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            await userEvent.upload(fileInput, file);
            expect(screen.getByAltText(/preview 1/i)).toBeInTheDocument();
        });

        it('should upload multiple files and show multiple previews', async () => {
            renderAdminProductForm();
            const fileInput = document.querySelector('.file-input') as HTMLElement;
            const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
            const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
            await userEvent.upload(fileInput, [file1, file2]);
            expect(screen.getByAltText(/preview 1/i)).toBeInTheDocument();
            expect(screen.getByAltText(/preview 2/i)).toBeInTheDocument();
        });

        it('should remove uploaded file', async () => {
            renderAdminProductForm();
            const fileInput = document.querySelector('.file-input') as HTMLElement;
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            await userEvent.upload(fileInput, file);
            const removeButtons = screen.getAllByText('✕');
            await userEvent.click(removeButtons[removeButtons.length - 1]);
            expect(screen.queryByAltText(/preview 1/i)).not.toBeInTheDocument();
        });

        it('should expand new image when clicked', async () => {
            renderAdminProductForm();
            const fileInput = document.querySelector('.file-input') as HTMLElement;
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            await userEvent.upload(fileInput, file);
            await userEvent.click(screen.getByAltText(/preview 1/i));
            expect(document.querySelector('.media-close')).toBeInTheDocument();
        });

        it('should close expanded new image', async () => {
            renderAdminProductForm();
            const fileInput = document.querySelector('.file-input') as HTMLElement;
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            await userEvent.upload(fileInput, file);
            await userEvent.click(screen.getByAltText(/preview 1/i));
            const closeButton = document.querySelector('.media-close') as HTMLElement;
            await userEvent.click(closeButton);
            expect(document.querySelector('.media-close')).not.toBeInTheDocument();
        });
    });

    describe('Create Mode - Material with 100% Validation', () => {
        it('should allow submit when material is 100%', async () => {
            vi.mocked(productService.create).mockResolvedValue(mockAxiosResponse({ id: 1 }));
            vi.mocked(variantService.createColor).mockResolvedValue(mockAxiosResponse({ id: 1 }));
            vi.mocked(variantService.createSize).mockResolvedValue(mockAxiosResponse({ id: 1 }));
            vi.mocked(variantService.createVariant).mockResolvedValue(mockAxiosResponse({}));

            renderAdminProductForm();
            await userEvent.click(screen.getByText(/add material/i));

            const selects = screen.getAllByRole('combobox');
            const materialSelect = selects[selects.length - 1];
            await userEvent.selectOptions(materialSelect, '1');

            const percentageInput = screen.getByPlaceholderText('%');
            await userEvent.type(percentageInput, '100');

            await userEvent.type(screen.getAllByRole('textbox')[0], 'Test Product');
            const spinbuttons = screen.getAllByRole('spinbutton');
            await userEvent.type(spinbuttons[0], '100');
            await userEvent.type(spinbuttons[1], '10');
            await userEvent.selectOptions(screen.getAllByRole('combobox')[0], '1');

            await userEvent.click(screen.getByRole('button', { name: /create/i }));

            await waitFor(() => {
                expect(vi.mocked(productService.create)).toHaveBeenCalled();
            });
        });

        it('should show total percentage ok when 100%', async () => {
            renderAdminProductForm();
            await userEvent.click(screen.getByText(/add material/i));
            const percentageInput = screen.getByPlaceholderText('%');
            await userEvent.type(percentageInput, '100');
            expect(screen.getByText(/total: 100%/i)).toBeInTheDocument();
        });
    });

    describe('Create Mode - Multiple Colors', () => {
        it('should add multiple colors', async () => {
            renderAdminProductForm();

            await userEvent.type(screen.getByPlaceholderText(/color name/i), 'Red');
            await userEvent.click(screen.getByText(/add color/i));

            await userEvent.type(screen.getByPlaceholderText(/color name/i), 'Blue');
            await userEvent.click(screen.getByText(/add color/i));

            expect(screen.getByText('Red')).toBeInTheDocument();
            expect(screen.getByText('Blue')).toBeInTheDocument();
        });

        it('should assign different sizes to different colors', async () => {
            renderAdminProductForm();

            await userEvent.type(screen.getByPlaceholderText(/color name/i), 'Red');
            await userEvent.click(screen.getByText(/add color/i));

            const sizeSButtons = screen.getAllByText('S');
            await userEvent.click(sizeSButtons[0]);

            await userEvent.type(screen.getByPlaceholderText(/color name/i), 'Blue');
            await userEvent.click(screen.getByText(/add color/i));

            const sizeMButtons = screen.getAllByText('M');
            await userEvent.click(sizeMButtons[1]);

            expect(sizeSButtons[0]).toHaveClass('active');
            expect(sizeMButtons[1]).toHaveClass('active');
        });
    });

    describe('Create Mode - Description and Optional Fields', () => {
        it('should allow typing description', async () => {
            renderAdminProductForm();
            const descriptionInput = screen.getAllByRole('textbox')[1];
            await userEvent.type(descriptionInput, 'Test description');
            expect(descriptionInput).toHaveValue('Test description');
        });

        it('should allow selecting gender', async () => {
            renderAdminProductForm();
            const genderSelect = document.querySelector('select[name="gender"]') as HTMLElement;
            await userEvent.selectOptions(genderSelect, '0');
            expect(genderSelect).toHaveValue('0');
        });

        it('should allow selecting style', async () => {
            renderAdminProductForm();
            await screen.findByText('Casual');
            const styleSelect = document.querySelector('select[name="styleId"]') as HTMLElement;
            await userEvent.selectOptions(styleSelect, '1');
            expect(styleSelect).toHaveValue('1');
        });

        it('should allow selecting occasion', async () => {
            renderAdminProductForm();
            await screen.findByText('Daily');
            const occasionSelect = document.querySelector('select[name="occasionId"]') as HTMLElement;
            await userEvent.selectOptions(occasionSelect, '1');
            expect(occasionSelect).toHaveValue('1');
        });

        it('should allow selecting pattern', async () => {
            renderAdminProductForm();
            await screen.findByText('Solid');
            const patternSelect = document.querySelector('select[name="patternId"]') as HTMLElement;
            await userEvent.selectOptions(patternSelect, '1');
            expect(patternSelect).toHaveValue('1');
        });
    });

    describe('Edit Mode - Multiple Images', () => {
        beforeEach(() => {
            vi.mocked(useParams).mockReturnValue({ id: '1' });
            vi.mocked(productService.getById).mockResolvedValue(mockAxiosResponse({
                ...mockProduct,
                images: [
                    { id: 1, productId: 1, fileName: 'image1.jpg', contentType: 'image/jpeg', fileSize: 1000, sortOrder: 1, isMain: true, objectKey: 'key1', colorId: 1 },
                    { id: 2, productId: 1, fileName: 'image2.jpg', contentType: 'image/jpeg', fileSize: 1000, sortOrder: 2, isMain: false, objectKey: 'key2', colorId: 1 },
                ],
            }));
            vi.mocked(variantService.getColors).mockResolvedValue(mockAxiosResponse([{ id: 1, name: 'Red', hexCode: '#FF0000' }]));
            vi.mocked(variantService.getVariants).mockResolvedValue(mockAxiosResponse([{ colorId: 1, sizeName: 'M', stockQuantity: 5 }]));
        });

        it('should show multiple existing images', async () => {
            renderAdminProductForm();
            await waitFor(() => {
                expect(screen.getByAltText('image1.jpg')).toBeInTheDocument();
                expect(screen.getByAltText('image2.jpg')).toBeInTheDocument();
            });
        });

        it('should navigate between expanded images', async () => {
            renderAdminProductForm();
            await waitFor(() => {
                expect(screen.getByAltText('image1.jpg')).toBeInTheDocument();
            });
            await userEvent.click(screen.getByAltText('image1.jpg'));
            const nextButton = document.querySelector('.media-nav.next') as HTMLElement;
            await userEvent.click(nextButton);
            const prevButton = document.querySelector('.media-nav.prev') as HTMLElement;
            await userEvent.click(prevButton);
            expect(document.querySelector('.media-image')).toBeInTheDocument();
        });
    });

    describe('Edit Mode - Multiple Colors', () => {
        beforeEach(() => {
            vi.mocked(useParams).mockReturnValue({ id: '1' });
            vi.mocked(productService.getById).mockResolvedValue(mockAxiosResponse(mockProduct));
            vi.mocked(variantService.getColors).mockResolvedValue(mockAxiosResponse([
                { id: 1, name: 'Red', hexCode: '#FF0000' },
                { id: 2, name: 'Blue', hexCode: '#0000FF' },
            ]));
            vi.mocked(variantService.getVariants).mockResolvedValue(mockAxiosResponse([
                { colorId: 1, sizeName: 'M', stockQuantity: 5 },
                { colorId: 2, sizeName: 'L', stockQuantity: 3 },
            ]));
        });

        it('should load multiple colors', async () => {
            renderAdminProductForm();
            await waitFor(() => {
                expect(screen.getAllByText('Red').length).toBeGreaterThan(0);
                expect(screen.getAllByText('Blue').length).toBeGreaterThan(0);
            });
        });

        it('should remove one color from multiple', async () => {
            renderAdminProductForm();
            await waitFor(() => {
                expect(screen.getAllByText('Red').length).toBeGreaterThan(0);
            });
            const removeButtons = document.querySelectorAll('.color-size-section .remove-color-btn');
            await userEvent.click(removeButtons[0] as HTMLElement);
            await waitFor(() => {
                const redSpans = document.querySelectorAll('.color-size-section .color-tag-row span');
                const redTexts = Array.from(redSpans).filter(span => span.textContent === 'Red');
                expect(redTexts.length).toBe(0);
            });
        });
    });

    describe('Error Handling', () => {
        it('should show error modal with error message', async () => {
            vi.mocked(productService.create).mockRejectedValue({
                response: { data: { error: 'Custom error message' } },
            });

            renderAdminProductForm();
            await userEvent.type(screen.getAllByRole('textbox')[0], 'Test Product');
            const spinbuttons = screen.getAllByRole('spinbutton');
            await userEvent.type(spinbuttons[0], '100');
            await userEvent.type(spinbuttons[1], '10');
            await userEvent.selectOptions(screen.getAllByRole('combobox')[0], '1');
            await userEvent.click(screen.getByRole('button', { name: /create/i }));

            expect(await screen.findByText('Custom error message')).toBeInTheDocument();
        });

        it('should close error modal by clicking overlay', async () => {
            vi.mocked(productService.create).mockRejectedValue({
                response: { data: { error: 'Failed to create' } },
            });

            renderAdminProductForm();
            await userEvent.type(screen.getAllByRole('textbox')[0], 'Test Product');
            const spinbuttons = screen.getAllByRole('spinbutton');
            await userEvent.type(spinbuttons[0], '100');
            await userEvent.type(spinbuttons[1], '10');
            await userEvent.selectOptions(screen.getAllByRole('combobox')[0], '1');
            await userEvent.click(screen.getByRole('button', { name: /create/i }));

            await screen.findByText('Failed to create');
            const overlay = document.querySelector('.modal-overlay') as HTMLElement;
            await userEvent.click(overlay);

            await waitFor(() => {
                expect(screen.queryByText('Failed to create')).not.toBeInTheDocument();
            });
        });
    });
});