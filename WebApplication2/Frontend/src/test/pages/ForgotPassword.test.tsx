import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ForgotPassword } from '../../pages/ForgotPassword';
import { LanguageProvider } from '../../context/LanguageContext';
import { authService } from '../../services/auth.service';

vi.mock('../../services/auth.service', () => ({
    authService: {
        forgotPassword: vi.fn(),
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

describe('ForgotPassword', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        vi.clearAllMocks();
    });

    const renderForgotPassword = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <ForgotPassword />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    it('should render forgot password form', () => {
        renderForgotPassword();

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /forgot password/i })).toBeInTheDocument();
        expect(screen.getByText(/back to login/i)).toBeInTheDocument();
    });

    it('should show email required error when submitting empty form', async () => {
        renderForgotPassword();

        const submitButton = screen.getByRole('button', { name: /forgot password/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('Email is required')).toBeInTheDocument();
    });

    it('should show invalid email error when email is not valid', async () => {
        renderForgotPassword();

        const emailInput = screen.getByLabelText(/email/i);
        await userEvent.type(emailInput, 'invalid-email');

        const submitButton = screen.getByRole('button', { name: /forgot password/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should submit form with valid email', async () => {
        vi.mocked(authService.forgotPassword).mockResolvedValue(mockAxiosResponse({}));

        renderForgotPassword();

        const emailInput = screen.getByLabelText(/email/i);
        await userEvent.type(emailInput, 'john@example.com');

        const submitButton = screen.getByRole('button', { name: /forgot password/i });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(vi.mocked(authService.forgotPassword)).toHaveBeenCalledWith({
                email: 'john@example.com',
            });
        });
    });

    it('should show success screen after successful submission', async () => {
        vi.mocked(authService.forgotPassword).mockResolvedValue(mockAxiosResponse({}));

        renderForgotPassword();

        const emailInput = screen.getByLabelText(/email/i);
        await userEvent.type(emailInput, 'john@example.com');

        const submitButton = screen.getByRole('button', { name: /forgot password/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
        expect(screen.getByText(/back to login/i)).toBeInTheDocument();
    });

    it('should show error when email not found', async () => {
        vi.mocked(authService.forgotPassword).mockRejectedValue({
            response: { data: 'Email not found' },
        });

        renderForgotPassword();

        const emailInput = screen.getByLabelText(/email/i);
        await userEvent.type(emailInput, 'nonexistent@example.com');

        const submitButton = screen.getByRole('button', { name: /forgot password/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('Email not found')).toBeInTheDocument();
    });

    it('should show generic error when submission fails without message', async () => {
        vi.mocked(authService.forgotPassword).mockRejectedValue(new Error('Network error'));

        renderForgotPassword();

        const emailInput = screen.getByLabelText(/email/i);
        await userEvent.type(emailInput, 'john@example.com');

        const submitButton = screen.getByRole('button', { name: /forgot password/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('Failed to send reset email')).toBeInTheDocument();
    });

    it('should disable button and show loading during submission', async () => {
        vi.mocked(authService.forgotPassword).mockImplementation(() => new Promise(() => { }));

        renderForgotPassword();

        const emailInput = screen.getByLabelText(/email/i);
        await userEvent.type(emailInput, 'john@example.com');

        const submitButton = screen.getByRole('button', { name: /forgot password/i });
        await userEvent.click(submitButton);

        expect(submitButton).toBeDisabled();
        expect(screen.getByText('...')).toBeInTheDocument();
    });

    it('should have email input with correct type', () => {
        renderForgotPassword();

        expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
    });

    it('should have back to login link', () => {
        renderForgotPassword();

        const backLink = screen.getByText(/back to login/i);
        expect(backLink).toHaveAttribute('href', '/login');
    });
});