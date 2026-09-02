import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VerifyEmail } from '../../pages/VerifyEmail';
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
        verifyEmail: vi.fn(),
        resendVerification: vi.fn(),
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

describe('VerifyEmail', () => {
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

    const renderVerifyEmail = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <VerifyEmail />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Rendering', () => {
        it('should show email field when no email in URL', () => {
            renderVerifyEmail();
            expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        });

        it('should not show email field when email in URL', () => {
            const params = new URLSearchParams('email=test@example.com');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderVerifyEmail();
            expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
        });

        it('should show code input', () => {
            renderVerifyEmail();
            expect(screen.getByLabelText(/code/i)).toBeInTheDocument();
        });

        it('should show submit button', () => {
            renderVerifyEmail();
            expect(screen.getByRole('button', { name: /verify email/i })).toBeInTheDocument();
        });

        it('should show resend button', () => {
            renderVerifyEmail();
            expect(screen.getByRole('button', { name: /send code/i })).toBeInTheDocument();
        });

        it('should show back to login link', () => {
            renderVerifyEmail();
            expect(screen.getByText(/back to login/i)).toHaveAttribute('href', '/login');
        });
    });

    describe('Validation', () => {
        it('should show email required error when empty', async () => {
            renderVerifyEmail();
            const submitButton = screen.getByRole('button', { name: /verify email/i });
            await userEvent.click(submitButton);
            expect(await screen.findAllByText(/email/i)).toHaveLength(4);
        });

        it('should show code required error when empty', async () => {
            const params = new URLSearchParams('email=test@example.com');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderVerifyEmail();
            const submitButton = screen.getByRole('button', { name: /verify email/i });
            await userEvent.click(submitButton);
            expect(await screen.findAllByText(/code/i)).toHaveLength(4);
        });

        it('should show error when code is not 6 digits', async () => {
            const params = new URLSearchParams('email=test@example.com');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderVerifyEmail();
            const codeInput = screen.getByLabelText(/code/i);
            await userEvent.type(codeInput, '123');
            const submitButton = screen.getByRole('button', { name: /verify email/i });
            await userEvent.click(submitButton);
            expect(await screen.findByText('Code must be exactly 6 digits')).toBeInTheDocument();
        });
    });

    describe('Submit', () => {
        it('should submit with email from URL', async () => {
            vi.mocked(authService.verifyEmail).mockResolvedValue(mockAxiosResponse({}));
            const params = new URLSearchParams('email=test@example.com');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderVerifyEmail();

            const codeInput = screen.getByLabelText(/code/i);
            await userEvent.type(codeInput, '123456');

            const submitButton = screen.getByRole('button', { name: /verify email/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(authService.verifyEmail)).toHaveBeenCalledWith({
                    email: 'test@example.com',
                    code: '123456',
                });
            });
        });

        it('should submit with manual email', async () => {
            vi.mocked(authService.verifyEmail).mockResolvedValue(mockAxiosResponse({}));
            renderVerifyEmail();

            const emailInput = screen.getByLabelText(/email/i);
            const codeInput = screen.getByLabelText(/code/i);

            await userEvent.type(emailInput, 'manual@test.com');
            await userEvent.type(codeInput, '123456');

            const submitButton = screen.getByRole('button', { name: /verify email/i });
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(authService.verifyEmail)).toHaveBeenCalledWith({
                    email: 'manual@test.com',
                    code: '123456',
                });
            });
        });
    });

    describe('Success', () => {
        it('should show success screen after verification', async () => {
            vi.mocked(authService.verifyEmail).mockResolvedValue(mockAxiosResponse({}));
            const params = new URLSearchParams('email=test@example.com');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderVerifyEmail();

            const codeInput = screen.getByLabelText(/code/i);
            await userEvent.type(codeInput, '123456');

            const submitButton = screen.getByRole('button', { name: /verify email/i });
            await userEvent.click(submitButton);

            expect(await screen.findByText(/registration successful/i)).toBeInTheDocument();
        });
    });

    describe('Error', () => {
        it('should show error when verification fails with message', async () => {
            vi.mocked(authService.verifyEmail).mockRejectedValue({
                response: { data: 'Invalid or expired verification code' },
            });
            const params = new URLSearchParams('email=test@example.com');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderVerifyEmail();

            const codeInput = screen.getByLabelText(/code/i);
            await userEvent.type(codeInput, '123456');

            const submitButton = screen.getByRole('button', { name: /verify email/i });
            await userEvent.click(submitButton);

            expect(await screen.findByText('Invalid or expired verification code')).toBeInTheDocument();
        });

        it('should show generic error when verification fails without message', async () => {
            vi.mocked(authService.verifyEmail).mockRejectedValue(new Error('Network error'));
            const params = new URLSearchParams('email=test@example.com');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderVerifyEmail();

            const codeInput = screen.getByLabelText(/code/i);
            await userEvent.type(codeInput, '123456');

            const submitButton = screen.getByRole('button', { name: /verify email/i });
            await userEvent.click(submitButton);

            expect(await screen.findByText('Invalid or expired verification code')).toBeInTheDocument();
        });
    });

    describe('Resend Code', () => {
        it('should resend verification code', async () => {
            vi.mocked(authService.resendVerification).mockResolvedValue(mockAxiosResponse({}));
            vi.spyOn(window, 'alert').mockImplementation(() => { });
            const params = new URLSearchParams('email=test@example.com');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderVerifyEmail();

            const resendButton = screen.getByRole('button', { name: /send code/i });
            await userEvent.click(resendButton);

            await waitFor(() => {
                expect(vi.mocked(authService.resendVerification)).toHaveBeenCalledWith({ email: 'test@example.com' });
            });
        });

        it('should disable resend button while resending', async () => {
            vi.mocked(authService.resendVerification).mockImplementation(() => new Promise(() => { }));
            const params = new URLSearchParams('email=test@example.com');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderVerifyEmail();

            const resendButton = screen.getByRole('button', { name: /send code/i });
            await userEvent.click(resendButton);

            expect(resendButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });

        it('should show alert when resend fails', async () => {
            vi.mocked(authService.resendVerification).mockRejectedValue({
                response: { data: 'Failed to send code' },
            });
            const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
            const params = new URLSearchParams('email=test@example.com');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderVerifyEmail();

            const resendButton = screen.getByRole('button', { name: /send code/i });
            await userEvent.click(resendButton);

            await waitFor(() => {
                expect(alertSpy).toHaveBeenCalledWith('Failed to send code');
            });
        });
    });

    describe('Loading State', () => {
        it('should disable button while verifying', async () => {
            vi.mocked(authService.verifyEmail).mockImplementation(() => new Promise(() => { }));
            const params = new URLSearchParams('email=test@example.com');
            vi.mocked(useSearchParams).mockReturnValue([params, vi.fn()]);
            renderVerifyEmail();

            const codeInput = screen.getByLabelText(/code/i);
            await userEvent.type(codeInput, '123456');

            const submitButton = screen.getByRole('button', { name: /verify email/i });
            await userEvent.click(submitButton);

            expect(submitButton).toBeDisabled();
        });
    });
});