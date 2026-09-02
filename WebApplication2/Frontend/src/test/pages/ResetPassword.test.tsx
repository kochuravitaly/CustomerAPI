import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ResetPassword } from '../../pages/ResetPassword';
import { LanguageProvider } from '../../context/LanguageContext';
import { authService } from '../../services/auth.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
        useSearchParams: vi.fn(() => [new URLSearchParams(''), vi.fn()]),
    };
});

vi.mock('../../services/auth.service', () => ({
    authService: {
        resetPassword: vi.fn(),
    },
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

describe('ResetPassword', () => {
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
        vi.mocked(useSearchParams).mockReturnValue([new URLSearchParams(''), vi.fn()]);
    });

    const renderResetPassword = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <ResetPassword />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Rendering', () => {
        it('should show token field when no token in URL', () => {
            renderResetPassword();
            expect(screen.getByLabelText(/token/i)).toBeInTheDocument();
        });

        it('should not show token field when token in URL', () => {
            const params = new URLSearchParams('token=abc123');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderResetPassword();
            expect(screen.queryByLabelText(/token/i)).not.toBeInTheDocument();
        });

        it('should show new password field', () => {
            renderResetPassword();
            expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
        });

        it('should show confirm password field', () => {
            renderResetPassword();
            expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
        });

        it('should show submit button', () => {
            renderResetPassword();
            expect(screen.getByRole('button', { name: /forgot password/i })).toBeInTheDocument();
        });

        it('should show back to login link', () => {
            renderResetPassword();
            const backLink = screen.getByText(/back to login/i);
            expect(backLink).toHaveAttribute('href', '/login');
        });
    });

    describe('Validation', () => {
        it('should show token required error when empty', async () => {
            renderResetPassword();
            const submitButton = screen.getByRole('button', { name: /forgot password/i });
            await userEvent.click(submitButton);
            expect(await screen.findByText('Token is required')).toBeInTheDocument();
        });

        it('should show new password required error when empty', async () => {
            const params = new URLSearchParams('token=abc123');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderResetPassword();
            const submitButton = screen.getByRole('button', { name: /forgot password/i });
            await userEvent.click(submitButton);
            expect(await screen.findAllByText(/new password/i)).toHaveLength(3);
        });

        it('should show minimum length error when password too short', async () => {
            const params = new URLSearchParams('token=abc123');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderResetPassword();
            const passwordInput = screen.getByLabelText(/new password/i);
            await userEvent.type(passwordInput, 'short');
            const submitButton = screen.getByRole('button', { name: /forgot password/i });
            await userEvent.click(submitButton);
            expect(await screen.findByText('Minimum 8 characters')).toBeInTheDocument();
        });

        it('should show pattern error when password lacks requirements', async () => {
            const params = new URLSearchParams('token=abc123');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderResetPassword();
            const passwordInput = screen.getByLabelText(/new password/i);
            await userEvent.type(passwordInput, 'password123');
            const submitButton = screen.getByRole('button', { name: /forgot password/i });
            await userEvent.click(submitButton);
            expect(await screen.findByText(/uppercase, lowercase, number, and special/i)).toBeInTheDocument();
        });

        it('should show error when passwords do not match', async () => {
            const params = new URLSearchParams('token=abc123');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderResetPassword();
            const passwordInput = screen.getByLabelText(/new password/i);
            const confirmInput = screen.getByLabelText(/confirm password/i);
            await userEvent.type(passwordInput, 'Password123!');
            await userEvent.type(confirmInput, 'Different123!');
            const submitButton = screen.getByRole('button', { name: /forgot password/i });
            await userEvent.click(submitButton);
            expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
        });
    });

    describe('Submit', () => {
        it('should submit with token from URL', async () => {
            vi.mocked(authService.resetPassword).mockResolvedValue(mockAxiosResponse({}));
            const params = new URLSearchParams('token=abc123');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderResetPassword();

            const passwordInput = screen.getByLabelText(/new password/i);
            const confirmInput = screen.getByLabelText(/confirm password/i);
            await userEvent.type(passwordInput, 'Password123!');
            await userEvent.type(confirmInput, 'Password123!');

            const submitButton = screen.getByRole('button', { name: /forgot password/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(authService.resetPassword)).toHaveBeenCalledWith({
                    token: 'abc123',
                    newPassword: 'Password123!',
                });
            });
        });

        it('should submit with manual token', async () => {
            vi.mocked(authService.resetPassword).mockResolvedValue(mockAxiosResponse({}));
            renderResetPassword();

            const tokenInput = screen.getByLabelText(/token/i);
            const passwordInput = screen.getByLabelText(/new password/i);
            const confirmInput = screen.getByLabelText(/confirm password/i);

            await userEvent.type(tokenInput, 'manual-token');
            await userEvent.type(passwordInput, 'Password123!');
            await userEvent.type(confirmInput, 'Password123!');

            const submitButton = screen.getByRole('button', { name: /forgot password/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(authService.resetPassword)).toHaveBeenCalledWith({
                    token: 'manual-token',
                    newPassword: 'Password123!',
                });
            });
        });
    });

    describe('Success', () => {
        it('should show success screen after reset', async () => {
            vi.mocked(authService.resetPassword).mockResolvedValue(mockAxiosResponse({}));
            const params = new URLSearchParams('token=abc123');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderResetPassword();

            const passwordInput = screen.getByLabelText(/new password/i);
            const confirmInput = screen.getByLabelText(/confirm password/i);
            await userEvent.type(passwordInput, 'Password123!');
            await userEvent.type(confirmInput, 'Password123!');

            const submitButton = screen.getByRole('button', { name: /forgot password/i });
            await userEvent.click(submitButton);

            expect(await screen.findByText(/password changed/i)).toBeInTheDocument();
            expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
        });
    });

    describe('Error', () => {
        it('should show error when reset fails with message', async () => {
            vi.mocked(authService.resetPassword).mockRejectedValue({
                response: { data: 'Invalid or expired reset token' },
            });
            const params = new URLSearchParams('token=abc123');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderResetPassword();

            const passwordInput = screen.getByLabelText(/new password/i);
            const confirmInput = screen.getByLabelText(/confirm password/i);
            await userEvent.type(passwordInput, 'Password123!');
            await userEvent.type(confirmInput, 'Password123!');

            const submitButton = screen.getByRole('button', { name: /forgot password/i });
            await userEvent.click(submitButton);

            expect(await screen.findByText('Invalid or expired reset token')).toBeInTheDocument();
        });

        it('should show generic error when reset fails without message', async () => {
            vi.mocked(authService.resetPassword).mockRejectedValue(new Error('Network error'));
            const params = new URLSearchParams('token=abc123');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderResetPassword();

            const passwordInput = screen.getByLabelText(/new password/i);
            const confirmInput = screen.getByLabelText(/confirm password/i);
            await userEvent.type(passwordInput, 'Password123!');
            await userEvent.type(confirmInput, 'Password123!');

            const submitButton = screen.getByRole('button', { name: /forgot password/i });
            await userEvent.click(submitButton);

            expect(await screen.findByText('Invalid or expired reset token')).toBeInTheDocument();
        });
    });

    describe('Loading State', () => {
        it('should disable button and show loading during submission', async () => {
            vi.mocked(authService.resetPassword).mockImplementation(() => new Promise(() => { }));
            const params = new URLSearchParams('token=abc123');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderResetPassword();

            const passwordInput = screen.getByLabelText(/new password/i);
            const confirmInput = screen.getByLabelText(/confirm password/i);
            await userEvent.type(passwordInput, 'Password123!');
            await userEvent.type(confirmInput, 'Password123!');

            const submitButton = screen.getByRole('button', { name: /forgot password/i });
            await userEvent.click(submitButton);

            expect(submitButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });
    });
});