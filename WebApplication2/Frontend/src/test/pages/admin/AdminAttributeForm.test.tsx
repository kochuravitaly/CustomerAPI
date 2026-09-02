import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminAttributeForm } from '../../../pages/admin/AdminAttributeForm';
import { LanguageProvider } from '../../../context/LanguageContext';
import { attributeService } from '../../../services/attribute.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
        useParams: vi.fn(() => ({})),
        useSearchParams: vi.fn(() => [new URLSearchParams('type=materials'), vi.fn()]),
    };
});

vi.mock('../../../services/attribute.service', () => ({
    attributeService: {
        getMaterials: vi.fn(),
        getStyles: vi.fn(),
        getOccasions: vi.fn(),
        getPatterns: vi.fn(),
        createMaterial: vi.fn(),
        createStyle: vi.fn(),
        createOccasion: vi.fn(),
        createPattern: vi.fn(),
        updateMaterial: vi.fn(),
        updateStyle: vi.fn(),
        updateOccasion: vi.fn(),
        updatePattern: vi.fn(),
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

describe('AdminAttributeForm', () => {
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
        vi.mocked(useSearchParams).mockReturnValue([new URLSearchParams('type=materials'), vi.fn()]);
        vi.mocked(attributeService.getMaterials).mockResolvedValue(mockAxiosResponse([]));
    });

    const renderAdminAttributeForm = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <AdminAttributeForm />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Create Mode', () => {
        it('should show form in create mode', () => {
            renderAdminAttributeForm();
            expect(screen.getByRole('heading', { name: /add/i })).toBeInTheDocument();
        });

        it('should show name input', () => {
            renderAdminAttributeForm();
            expect(screen.getByRole('textbox')).toBeInTheDocument();
        });

        it('should show error when name is empty', async () => {
            renderAdminAttributeForm();
            const submitButton = screen.getByText(/create/i);
            await userEvent.click(submitButton);
            expect(await screen.findByText('Name is required')).toBeInTheDocument();
        });

        it('should create material when submitted', async () => {
            vi.mocked(attributeService.createMaterial).mockResolvedValue(mockAxiosResponse({}));
            renderAdminAttributeForm();

            const nameInput = screen.getByRole('textbox');
            await userEvent.type(nameInput, 'Cotton');

            const submitButton = screen.getByText(/create/i);
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(attributeService.createMaterial)).toHaveBeenCalledWith('Cotton');
            });
        });

        it('should navigate back after create', async () => {
            vi.mocked(attributeService.createMaterial).mockResolvedValue(mockAxiosResponse({}));
            renderAdminAttributeForm();

            const nameInput = screen.getByRole('textbox');
            await userEvent.type(nameInput, 'Cotton');

            const submitButton = screen.getByText(/create/i);
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith('/admin/attributes?type=materials');
            });
        });

        it('should disable button while creating', async () => {
            vi.mocked(attributeService.createMaterial).mockImplementation(() => new Promise(() => { }));
            renderAdminAttributeForm();

            const nameInput = screen.getByRole('textbox');
            await userEvent.type(nameInput, 'Cotton');

            const submitButton = screen.getByText(/create/i);
            await userEvent.click(submitButton);

            expect(submitButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });

        it('should show error when create fails', async () => {
            vi.mocked(attributeService.createMaterial).mockRejectedValue({
                response: { data: 'Failed to create' },
            });
            renderAdminAttributeForm();

            const nameInput = screen.getByRole('textbox');
            await userEvent.type(nameInput, 'Cotton');

            const submitButton = screen.getByText(/create/i);
            await userEvent.click(submitButton);

            expect(await screen.findByText('Failed to create')).toBeInTheDocument();
        });
    });

    describe('Edit Mode', () => {
        beforeEach(() => {
            vi.mocked(useParams).mockReturnValue({ id: '1' });
            vi.mocked(attributeService.getMaterials).mockResolvedValue(mockAxiosResponse([{ id: 1, name: 'Cotton' }]));
        });

        it('should show form in edit mode', async () => {
            renderAdminAttributeForm();
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /edit/i })).toBeInTheDocument();
            });
        });

        it('should load existing name', async () => {
            renderAdminAttributeForm();
            await waitFor(() => {
                expect(screen.getByDisplayValue('Cotton')).toBeInTheDocument();
            });
        });

        it('should update material when submitted', async () => {
            vi.mocked(attributeService.updateMaterial).mockResolvedValue(mockAxiosResponse({}));
            renderAdminAttributeForm();

            await waitFor(() => {
                expect(screen.getByDisplayValue('Cotton')).toBeInTheDocument();
            });

            const nameInput = screen.getByDisplayValue('Cotton');
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, 'Wool');

            const submitButton = screen.getByText(/update/i);
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(attributeService.updateMaterial)).toHaveBeenCalledWith(1, 'Wool');
            });
        });

        it('should show error when update fails', async () => {
            vi.mocked(attributeService.updateMaterial).mockRejectedValue({
                response: { data: 'Failed to update' },
            });
            renderAdminAttributeForm();

            await waitFor(() => {
                expect(screen.getByDisplayValue('Cotton')).toBeInTheDocument();
            });

            const submitButton = screen.getByText(/update/i);
            await userEvent.click(submitButton);

            expect(await screen.findByText('Failed to update')).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should navigate back when back button clicked', () => {
            renderAdminAttributeForm();
            const backButton = screen.getByText(/back/i);
            backButton.click();
            expect(mockNavigate).toHaveBeenCalledWith('/admin/attributes?type=materials');
        });

        it('should navigate back when cancel clicked', () => {
            renderAdminAttributeForm();
            const cancelButton = screen.getByText(/cancel/i);
            cancelButton.click();
            expect(mockNavigate).toHaveBeenCalledWith('/admin/attributes?type=materials');
        });
    });

    describe('Different Types', () => {
        it('should load styles when type is styles', async () => {
            vi.mocked(useSearchParams).mockReturnValue([new URLSearchParams('type=styles'), vi.fn()]);
            vi.mocked(attributeService.getStyles).mockResolvedValue(mockAxiosResponse([]));
            vi.mocked(attributeService.createStyle).mockResolvedValue(mockAxiosResponse({}));

            renderAdminAttributeForm();

            const nameInput = screen.getByRole('textbox');
            await userEvent.type(nameInput, 'Casual');

            const submitButton = screen.getByText(/create/i);
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(attributeService.createStyle)).toHaveBeenCalledWith('Casual');
            });
        });

        it('should load occasions when type is occasions', async () => {
            vi.mocked(useSearchParams).mockReturnValue([new URLSearchParams('type=occasions'), vi.fn()]);
            vi.mocked(attributeService.getOccasions).mockResolvedValue(mockAxiosResponse([]));
            vi.mocked(attributeService.createOccasion).mockResolvedValue(mockAxiosResponse({}));

            renderAdminAttributeForm();

            const nameInput = screen.getByRole('textbox');
            await userEvent.type(nameInput, 'Casual');

            const submitButton = screen.getByText(/create/i);
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(attributeService.createOccasion)).toHaveBeenCalledWith('Casual');
            });
        });

        it('should load patterns when type is patterns', async () => {
            vi.mocked(useSearchParams).mockReturnValue([new URLSearchParams('type=patterns'), vi.fn()]);
            vi.mocked(attributeService.getPatterns).mockResolvedValue(mockAxiosResponse([]));
            vi.mocked(attributeService.createPattern).mockResolvedValue(mockAxiosResponse({}));

            renderAdminAttributeForm();

            const nameInput = screen.getByRole('textbox');
            await userEvent.type(nameInput, 'Striped');

            const submitButton = screen.getByText(/create/i);
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(attributeService.createPattern)).toHaveBeenCalledWith('Striped');
            });
        });
    });
});