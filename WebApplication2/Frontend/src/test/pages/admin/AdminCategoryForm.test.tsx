import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminCategoryForm } from '../../../pages/admin/AdminCategoryForm';
import { LanguageProvider } from '../../../context/LanguageContext';
import { categoryService } from '../../../services/product.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
        useParams: vi.fn(() => ({})),
    };
});

vi.mock('../../../services/product.service', () => ({
    categoryService: {
        getById: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
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

describe('AdminCategoryForm', () => {
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
        vi.mocked(categoryService.getById).mockResolvedValue(mockAxiosResponse(null));
    });

    const renderAdminCategoryForm = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <AdminCategoryForm />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Create Mode', () => {
        it('should show form in create mode', () => {
            renderAdminCategoryForm();
            expect(screen.getByRole('heading', { name: /add/i })).toBeInTheDocument();
        });

        it('should show name input', () => {
            renderAdminCategoryForm();
            const textboxes = screen.getAllByRole('textbox');
            expect(textboxes).toHaveLength(2);
        });

        it('should show description textarea', () => {
            renderAdminCategoryForm();
            const textboxes = screen.getAllByRole('textbox');
            expect(textboxes[1].tagName).toBe('TEXTAREA');
        });

        it('should show error when name is empty', async () => {
            renderAdminCategoryForm();
            const submitButton = screen.getByText(/create/i);
            await userEvent.click(submitButton);
            expect(await screen.findByText('Name is required')).toBeInTheDocument();
        });

        it('should create category when submitted', async () => {
            vi.mocked(categoryService.create).mockResolvedValue(mockAxiosResponse({}));
            renderAdminCategoryForm();

            const textboxes = screen.getAllByRole('textbox');
            await userEvent.type(textboxes[0], 'New Category');

            const submitButton = screen.getByText(/create/i);
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(categoryService.create)).toHaveBeenCalledWith({
                    name: 'New Category',
                    description: undefined,
                });
            });
        });

        it('should create category with description', async () => {
            vi.mocked(categoryService.create).mockResolvedValue(mockAxiosResponse({}));
            renderAdminCategoryForm();

            const textboxes = screen.getAllByRole('textbox');
            await userEvent.type(textboxes[0], 'New Category');
            await userEvent.type(textboxes[1], 'Description here');

            const submitButton = screen.getByText(/create/i);
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(categoryService.create)).toHaveBeenCalledWith({
                    name: 'New Category',
                    description: 'Description here',
                });
            });
        });

        it('should navigate back after create', async () => {
            vi.mocked(categoryService.create).mockResolvedValue(mockAxiosResponse({}));
            renderAdminCategoryForm();

            const textboxes = screen.getAllByRole('textbox');
            await userEvent.type(textboxes[0], 'New Category');

            const submitButton = screen.getByText(/create/i);
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/admin/categories');
            });
        });

        it('should disable button while creating', async () => {
            vi.mocked(categoryService.create).mockImplementation(() => new Promise(() => { }));
            renderAdminCategoryForm();

            const textboxes = screen.getAllByRole('textbox');
            await userEvent.type(textboxes[0], 'New Category');

            const submitButton = screen.getByText(/create/i);
            await userEvent.click(submitButton);

            expect(submitButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });

        it('should show error when create fails', async () => {
            vi.mocked(categoryService.create).mockRejectedValue({
                response: { data: 'Failed to create' },
            });
            renderAdminCategoryForm();

            const textboxes = screen.getAllByRole('textbox');
            await userEvent.type(textboxes[0], 'New Category');

            const submitButton = screen.getByText(/create/i);
            await userEvent.click(submitButton);

            expect(await screen.findByText('Failed to create')).toBeInTheDocument();
        });
    });

    describe('Edit Mode', () => {
        beforeEach(() => {
            vi.mocked(useParams).mockReturnValue({ id: '1' });
            vi.mocked(categoryService.getById).mockResolvedValue(mockAxiosResponse({
                id: 1,
                name: 'Existing Category',
                nameTranslations: { en: 'Existing Category' },
                description: 'Existing description',
            }));
        });

        it('should show form in edit mode', async () => {
            renderAdminCategoryForm();
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /edit/i })).toBeInTheDocument();
            });
        });

        it('should load existing name', async () => {
            renderAdminCategoryForm();
            await waitFor(() => {
                expect(screen.getByDisplayValue('Existing Category')).toBeInTheDocument();
            });
        });

        it('should update category when submitted', async () => {
            vi.mocked(categoryService.update).mockResolvedValue(mockAxiosResponse({}));
            renderAdminCategoryForm();

            await waitFor(() => {
                expect(screen.getByDisplayValue('Existing Category')).toBeInTheDocument();
            });

            const nameInput = screen.getByDisplayValue('Existing Category');
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, 'Updated Category');

            const submitButton = screen.getByText(/update/i);
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(categoryService.update)).toHaveBeenCalledWith(1, {
                    name: 'Updated Category',
                    description: 'Existing description',
                });
            });
        });

        it('should show error when update fails', async () => {
            vi.mocked(categoryService.update).mockRejectedValue({
                response: { data: 'Failed to update' },
            });
            renderAdminCategoryForm();

            await waitFor(() => {
                expect(screen.getByDisplayValue('Existing Category')).toBeInTheDocument();
            });

            const submitButton = screen.getByText(/update/i);
            await userEvent.click(submitButton);

            expect(await screen.findByText('Failed to update')).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should navigate back when back button clicked', () => {
            renderAdminCategoryForm();
            const backButton = screen.getByText(/back/i);
            backButton.click();
            expect(mockNavigate).toHaveBeenCalledWith('/admin/categories');
        });

        it('should navigate back when cancel clicked', () => {
            renderAdminCategoryForm();
            const cancelButton = screen.getByText(/cancel/i);
            cancelButton.click();
            expect(mockNavigate).toHaveBeenCalledWith('/admin/categories');
        });
    });
});