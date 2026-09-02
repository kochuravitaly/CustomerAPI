import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Register } from '../../pages/Register';
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
        register: vi.fn(),
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

describe('Register', () => {
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

    const renderRegister = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <AuthProvider>
                        <MemoryRouter>
                            <Register />
                        </MemoryRouter>
                    </AuthProvider>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    const fillValidForm = async () => {
        const nameInput = screen.getByLabelText(/name/i);
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/^password/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
        const checkbox = screen.getByRole('checkbox');

        await userEvent.type(nameInput, 'John Doe');
        await userEvent.type(emailInput, 'john@example.com');
        await userEvent.type(passwordInput, 'password123');
        await userEvent.type(confirmPasswordInput, 'password123');
        await userEvent.click(checkbox);
    };

    it('should render registration form', () => {
        renderRegister();

        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
        expect(screen.getByRole('checkbox')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    });

    it('should show heading and subtitle', () => {
        renderRegister();

        expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
        expect(screen.getByText(/join us today/i)).toBeInTheDocument();
    });

    it('should show link to login page', () => {
        renderRegister();

        const loginLink = screen.getByText(/already have an account/i);
        expect(loginLink).toBeInTheDocument();
        expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should show name required error when submitting empty form', async () => {
        renderRegister();

        const submitButton = screen.getByRole('button', { name: /register/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('Name is required')).toBeInTheDocument();
    });

    it('should show email required error when submitting empty form', async () => {
        renderRegister();

        const submitButton = screen.getByRole('button', { name: /register/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('Email is required')).toBeInTheDocument();
    });

    it('should show password required error when submitting empty form', async () => {
        renderRegister();

        const submitButton = screen.getByRole('button', { name: /register/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('Password is required')).toBeInTheDocument();
    });

    it('should show confirm password required error when submitting empty form', async () => {
        renderRegister();

        const submitButton = screen.getByRole('button', { name: /register/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('Please confirm your password')).toBeInTheDocument();
    });

    it('should show privacy policy required error when submitting empty form', async () => {
        renderRegister();

        const submitButton = screen.getByRole('button', { name: /register/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('You must agree to the Privacy Policy')).toBeInTheDocument();
    });

    it('should show error when name is too short', async () => {
        renderRegister();

        const nameInput = screen.getByLabelText(/name/i);
        await userEvent.type(nameInput, 'ab');

        const submitButton = screen.getByRole('button', { name: /register/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('Name must be at least 3 characters')).toBeInTheDocument();
    });

    it('should show error when email is invalid', async () => {
        renderRegister();

        const emailInput = screen.getByLabelText(/email/i);
        await userEvent.type(emailInput, 'invalid-email');

        const submitButton = screen.getByRole('button', { name: /register/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should show error when password is too short', async () => {
        renderRegister();

        const passwordInput = screen.getByLabelText(/^password/i);
        await userEvent.type(passwordInput, 'short');

        const submitButton = screen.getByRole('button', { name: /register/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
    });

    it('should show error when passwords do not match', async () => {
        renderRegister();

        const passwordInput = screen.getByLabelText(/^password/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

        await userEvent.type(passwordInput, 'password123');
        await userEvent.type(confirmPasswordInput, 'different123');

        const submitButton = screen.getByRole('button', { name: /register/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    });

    it('should not submit when privacy checkbox is unchecked', async () => {
        renderRegister();

        const nameInput = screen.getByLabelText(/name/i);
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/^password/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

        await userEvent.type(nameInput, 'John Doe');
        await userEvent.type(emailInput, 'john@example.com');
        await userEvent.type(passwordInput, 'password123');
        await userEvent.type(confirmPasswordInput, 'password123');

        const submitButton = screen.getByRole('button', { name: /register/i });
        await userEvent.click(submitButton);

        expect(vi.mocked(authService.register)).not.toHaveBeenCalled();
        expect(await screen.findByText('You must agree to the Privacy Policy')).toBeInTheDocument();
    });

    it('should submit form with valid data', async () => {
        vi.mocked(authService.register).mockResolvedValue(mockAxiosResponse({}));

        renderRegister();
        await fillValidForm();

        const submitButton = screen.getByRole('button', { name: /register/i });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(vi.mocked(authService.register)).toHaveBeenCalledWith({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                confirmPassword: 'password123',
                privacy: true,
            });
        });
    });

    it('should show success screen after successful registration', async () => {
        vi.mocked(authService.register).mockResolvedValue(mockAxiosResponse({}));

        renderRegister();
        await fillValidForm();

        const submitButton = screen.getByRole('button', { name: /register/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText(/success/i)).toBeInTheDocument();
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
        expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
    });

    it('should show error when registration fails with email taken', async () => {
        vi.mocked(authService.register).mockRejectedValue({
            response: { data: 'Email is already taken' },
        });

        renderRegister();
        await fillValidForm();

        const submitButton = screen.getByRole('button', { name: /register/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('Email is already taken')).toBeInTheDocument();
    });

    it('should show generic error when registration fails without message', async () => {
        vi.mocked(authService.register).mockRejectedValue(new Error('Network error'));

        renderRegister();
        await fillValidForm();

        const submitButton = screen.getByRole('button', { name: /register/i });
        await userEvent.click(submitButton);

        expect(await screen.findByText('Error')).toBeInTheDocument();
    });

    it('should disable button and show loading during submission', async () => {
        vi.mocked(authService.register).mockImplementation(() => new Promise(() => { }));

        renderRegister();
        await fillValidForm();

        const submitButton = screen.getByRole('button', { name: /register/i });
        await userEvent.click(submitButton);

        expect(submitButton).toBeDisabled();
        expect(screen.getByText('...')).toBeInTheDocument();
    });

    it('should have correct input types', () => {
        renderRegister();

        expect(screen.getByLabelText(/name/i)).toHaveAttribute('type', 'text');
        expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
        expect(screen.getByLabelText(/^password/i)).toHaveAttribute('type', 'password');
        expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('type', 'password');
        expect(screen.getByRole('checkbox')).toHaveAttribute('type', 'checkbox');
    });
});