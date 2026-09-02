import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminHomeSectionForm } from '../../../pages/admin/AdminHomeSectionForm';
import { LanguageProvider } from '../../../context/LanguageContext';
import { homeSectionService } from '../../../services/homeSection.service';
import { attributeService } from '../../../services/attribute.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
        useParams: vi.fn(() => ({})),
    };
});

vi.mock('../../../services/homeSection.service', () => ({
    homeSectionService: {
        getAll: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
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

const mockMaterials = [{ id: 1, name: 'Cotton' }];
const mockStyles = [{ id: 1, name: 'Casual' }];
const mockOccasions = [{ id: 1, name: 'Daily' }];
const mockPatterns = [{ id: 1, name: 'Solid' }];

describe('AdminHomeSectionForm', () => {
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
        vi.mocked(homeSectionService.getAll).mockResolvedValue(mockAxiosResponse([]));
        vi.mocked(attributeService.getMaterials).mockResolvedValue(mockAxiosResponse(mockMaterials));
        vi.mocked(attributeService.getStyles).mockResolvedValue(mockAxiosResponse(mockStyles));
        vi.mocked(attributeService.getOccasions).mockResolvedValue(mockAxiosResponse(mockOccasions));
        vi.mocked(attributeService.getPatterns).mockResolvedValue(mockAxiosResponse(mockPatterns));
    });

    const renderAdminHomeSectionForm = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <AdminHomeSectionForm />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Create Mode', () => {
        it('should show form in create mode', () => {
            renderAdminHomeSectionForm();
            expect(screen.getByRole('heading', { name: /create/i })).toBeInTheDocument();
        });

        it('should show title input', () => {
            renderAdminHomeSectionForm();
            expect(screen.getByRole('textbox')).toBeInTheDocument();
        });

        it('should show products to show select', () => {
            renderAdminHomeSectionForm();
            const selects = screen.getAllByRole('combobox');
            expect(selects.length).toBeGreaterThan(0);
        });

        it('should show error when title is empty', async () => {
            renderAdminHomeSectionForm();
            const submitButton = screen.getByRole('button', { name: /create/i });
            await userEvent.click(submitButton);
            expect(await screen.findByText('Title is required')).toBeInTheDocument();
        });

        it('should show error when no filter selected', async () => {
            renderAdminHomeSectionForm();
            const titleInput = screen.getByRole('textbox');
            await userEvent.type(titleInput, 'Test Section');
            const submitButton = screen.getByRole('button', { name: /create/i });
            await userEvent.click(submitButton);
            expect(await screen.findByText('At least one filter is required')).toBeInTheDocument();
        });

        it('should create section when submitted with filter', async () => {
            vi.mocked(homeSectionService.create).mockResolvedValue(mockAxiosResponse({}));
            renderAdminHomeSectionForm();

            const titleInput = screen.getByRole('textbox');
            await userEvent.type(titleInput, 'Test Section');

            const selects = screen.getAllByRole('combobox');
            await userEvent.selectOptions(selects[2], '0');

            const submitButton = screen.getByRole('button', { name: /create/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(homeSectionService.create)).toHaveBeenCalledWith(expect.objectContaining({
                    title: 'Test Section',
                }));
            });
        });

        it('should navigate back after create', async () => {
            vi.mocked(homeSectionService.create).mockResolvedValue(mockAxiosResponse({}));
            renderAdminHomeSectionForm();

            const titleInput = screen.getByRole('textbox');
            await userEvent.type(titleInput, 'Test Section');

            const selects = screen.getAllByRole('combobox');
            await userEvent.selectOptions(selects[2], '0');

            const submitButton = screen.getByRole('button', { name: /create/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/admin/home-sections');
            });
        });

        it('should disable button while creating', async () => {
            vi.mocked(homeSectionService.create).mockImplementation(() => new Promise(() => { }));
            renderAdminHomeSectionForm();

            const titleInput = screen.getByRole('textbox');
            await userEvent.type(titleInput, 'Test Section');

            const selects = screen.getAllByRole('combobox');
            await userEvent.selectOptions(selects[2], '0');

            const submitButton = screen.getByRole('button', { name: /create/i });
            await userEvent.click(submitButton);

            expect(submitButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });

        it('should show error when create fails', async () => {
            vi.mocked(homeSectionService.create).mockRejectedValue({
                response: { data: 'Failed to create' },
            });
            renderAdminHomeSectionForm();

            const titleInput = screen.getByRole('textbox');
            await userEvent.type(titleInput, 'Test Section');

            const selects = screen.getAllByRole('combobox');
            await userEvent.selectOptions(selects[2], '0');

            const submitButton = screen.getByRole('button', { name: /create/i });
            await userEvent.click(submitButton);

            expect(await screen.findByText('Failed to create')).toBeInTheDocument();
        });
    });

    describe('Edit Mode', () => {
        beforeEach(() => {
            vi.mocked(useParams).mockReturnValue({ id: '1' });
            vi.mocked(homeSectionService.getAll).mockResolvedValue(mockAxiosResponse([{
                id: 1,
                title: 'Existing Section',
                titleTranslations: { en: 'Existing Section' },
                productsToShow: 4,
                filterJson: '{"gender":0}',
            }]));
        });

        it('should show form in edit mode', async () => {
            renderAdminHomeSectionForm();
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /update/i })).toBeInTheDocument();
            });
        });

        it('should load existing title', async () => {
            renderAdminHomeSectionForm();
            await waitFor(() => {
                expect(screen.getByDisplayValue('Existing Section')).toBeInTheDocument();
            });
        });

        it('should update section when submitted', async () => {
            vi.mocked(homeSectionService.update).mockResolvedValue(mockAxiosResponse({}));
            renderAdminHomeSectionForm();

            await waitFor(() => {
                expect(screen.getByDisplayValue('Existing Section')).toBeInTheDocument();
            });

            const submitButton = screen.getByRole('button', { name: /update/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(homeSectionService.update)).toHaveBeenCalledWith(1, expect.objectContaining({
                    title: 'Existing Section',
                }));
            });
        });

        it('should show error when update fails', async () => {
            vi.mocked(homeSectionService.update).mockRejectedValue({
                response: { data: 'Failed to update' },
            });
            renderAdminHomeSectionForm();

            await waitFor(() => {
                expect(screen.getByDisplayValue('Existing Section')).toBeInTheDocument();
            });

            const submitButton = screen.getByRole('button', { name: /update/i });
            await userEvent.click(submitButton);

            expect(await screen.findByText('Failed to update')).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should navigate back when back button clicked', () => {
            renderAdminHomeSectionForm();
            const backButton = screen.getByText(/back/i);
            backButton.click();
            expect(mockNavigate).toHaveBeenCalledWith('/admin/home-sections');
        });

        it('should navigate back when cancel clicked', () => {
            renderAdminHomeSectionForm();
            const cancelButton = screen.getByText(/cancel/i);
            cancelButton.click();
            expect(mockNavigate).toHaveBeenCalledWith('/admin/home-sections');
        });
    });
});