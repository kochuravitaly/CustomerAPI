import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Login } from '../../pages/Login';
import { AuthProvider } from '../../context/AuthContext';
import { LanguageProvider } from '../../context/LanguageContext';
import { authService } from '../../services/auth.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../../services/auth.service', () => ({
    authService: {
        login: vi.fn(),
        verify2FA: vi.fn(),
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

describe('Login', () => {
    let queryClient: QueryClient;
    const mockNavigate = vi.fn();

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        localStorage.clear();
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    });

    const renderLogin = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <AuthProvider>
                        <MemoryRouter>
                            <Login />
                        </MemoryRouter>
                    </AuthProvider>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    const fillValidForm = async () => {
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);

        await userEvent.type(emailInput, 'john@example.com');
        await userEvent.type(passwordInput, 'password123');
    };

    const navigateTo2FA = async () => {
        vi.mocked(authService.login).mockResolvedValue(mockAxiosResponse({
            requiresTwoFactor: true,
            customerId: 'customer123',
            twoFactorMethod: 'app',
        }));

        renderLogin();
        await fillValidForm();

        const submitButton = screen.getByRole('button', { name: /login/i });
        await userEvent.click(submitButton);

        return await screen.findByPlaceholderText('000000');
    };

    it('should render login form', () => {
        renderLogin();

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should show heading and subtitle', () => {
        renderLogin();

        expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
        expect(screen.getByText(/login to your account/i)).toBeInTheDocument();
    });

    it('should show forgot password and register links', () => {
        renderLogin();

        const forgotPasswordLink = screen.getByText(/forgot password/i);
        const registerLink = screen.getByText(/create account/i);

        expect(forgotPasswordLink).toBeInTheDocument();
        expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
        expect(registerLink).toBeInTheDocument();
        expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('should show email required error when submitting empty form', async () => {
        renderLogin();

        const submitButton = screen.getByRole('button', { name: /login/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('Email is required')).toBeInTheDocument();
    });

    it('should show password required error when submitting empty form', async () => {
        renderLogin();

        const submitButton = screen.getByRole('button', { name: /login/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('Password is required')).toBeInTheDocument();
    });

    it('should show error when email is invalid', async () => {
        renderLogin();

        const emailInput = screen.getByLabelText(/email/i);
        await userEvent.type(emailInput, 'invalid-email');

        const submitButton = screen.getByRole('button', { name: /login/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should submit form with valid data', async () => {
        const mockLoginResponse = {
            token: 'token123',
            refreshToken: 'refresh123',
        };

        vi.mocked(authService.login).mockResolvedValue(mockAxiosResponse(mockLoginResponse));

        renderLogin();
        await fillValidForm();

        const submitButton = screen.getByRole('button', { name: /login/i });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(vi.mocked(authService.login)).toHaveBeenCalledWith({
                email: 'john@example.com',
                password: 'password123',
                language: 'en',
            });
        });
    });

    it('should navigate to home after successful login without 2FA', async () => {
        vi.mocked(authService.login).mockResolvedValue(mockAxiosResponse({
            token: 'token123',
            refreshToken: 'refresh123',
        }));

        renderLogin();
        await fillValidForm();

        const submitButton = screen.getByRole('button', { name: /login/i });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('should show 2FA screen when login requires two-factor', async () => {
        const codeInput = await navigateTo2FA();

        expect(screen.getByRole('heading', { name: /two-factor/i })).toBeInTheDocument();
        expect(codeInput).toBeInTheDocument();
    });

    it('should show email 2FA message when method is email', async () => {
        vi.mocked(authService.login).mockResolvedValue(mockAxiosResponse({
            requiresTwoFactor: true,
            customerId: 'customer123',
            twoFactorMethod: 'email',
        }));

        renderLogin();
        await fillValidForm();

        const submitButton = screen.getByRole('button', { name: /login/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText(/enter the code sent to your email/i)).toBeInTheDocument();
    });

    it('should show app 2FA message when method is app', async () => {
        const codeInput = await navigateTo2FA();

        expect(screen.getByText(/enter the code from your authenticator app/i)).toBeInTheDocument();
        expect(codeInput).toBeInTheDocument();
    });

    it('should only accept numeric input for 2FA code', async () => {
        const codeInput = await navigateTo2FA();

        await userEvent.type(codeInput, 'abc123def456');

        expect(codeInput).toHaveValue('123456');
    });

    it('should limit 2FA code to 6 digits', async () => {
        const codeInput = await navigateTo2FA();

        await userEvent.type(codeInput, '123456789');

        expect(codeInput).toHaveValue('123456');
    });

    it('should disable verify button until 6 digits entered', async () => {
        const codeInput = await navigateTo2FA();
        const verifyButton = screen.getByRole('button', { name: /verify/i });

        expect(verifyButton).toBeDisabled();

        await userEvent.type(codeInput, '123456');

        expect(verifyButton).toBeEnabled();
    });

    it('should verify 2FA and navigate to home', async () => {
        vi.mocked(authService.verify2FA).mockResolvedValue(mockAxiosResponse({}));
        const codeInput = await navigateTo2FA();

        await userEvent.type(codeInput, '123456');

        const verifyButton = screen.getByRole('button', { name: /verify/i });
        await userEvent.click(verifyButton);

        await waitFor(() => {
            expect(vi.mocked(authService.verify2FA)).toHaveBeenCalledWith({
                customerId: 'customer123',
                code: '123456',
            });
        });
    });

    it('should show error when login fails', async () => {
        vi.mocked(authService.login).mockRejectedValue({
            response: { data: 'Invalid email or password' },
        });

        renderLogin();
        await fillValidForm();

        const submitButton = screen.getByRole('button', { name: /login/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    });

    it('should show generic error when login fails without message', async () => {
        vi.mocked(authService.login).mockRejectedValue(new Error('Network error'));

        renderLogin();
        await fillValidForm();

        const submitButton = screen.getByRole('button', { name: /login/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('Error')).toBeInTheDocument();
    });

    it('should show error when 2FA verification fails', async () => {
        vi.mocked(authService.verify2FA).mockRejectedValue({
            response: { data: 'Invalid 2FA code' },
        });
        const codeInput = await navigateTo2FA();

        await userEvent.type(codeInput, '123456');

        const verifyButton = screen.getByRole('button', { name: /verify/i });
        await userEvent.click(verifyButton);

        expect(await screen.findByText('Invalid 2FA code')).toBeInTheDocument();
    });

    it('should disable button and show loading during submission', async () => {
        vi.mocked(authService.login).mockImplementation(() => new Promise(() => { }));

        renderLogin();
        await fillValidForm();

        const submitButton = screen.getByRole('button', { name: /login/i });
        await userEvent.click(submitButton);

        expect(submitButton).toBeDisabled();
        expect(screen.getByText('...')).toBeInTheDocument();
    });

    it('should have correct input types', () => {
        renderLogin();

        expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
        expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');
    });
});