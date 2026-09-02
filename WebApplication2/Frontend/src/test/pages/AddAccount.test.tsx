import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddAccount } from '../../pages/AddAccount';
import { LanguageProvider } from '../../context/LanguageContext';
import { accountService } from '../../services/account.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../../services/account.service', () => ({
    accountService: {
        addAccount: vi.fn(),
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

describe('AddAccount', () => {
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

    const renderAddAccount = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <AddAccount />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    it('should render email step first', () => {
        renderAddAccount();

        expect(screen.getByRole('heading', { name: /add account/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
        expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    });

    it('should show email required error when submitting empty email', async () => {
        renderAddAccount();

        const continueButton = screen.getByRole('button', { name: /continue/i });
        await userEvent.click(continueButton);

        expect(await screen.findByText('Email is required')).toBeInTheDocument();
    });

    it('should show invalid email error when email is not valid', async () => {
        renderAddAccount();

        const emailInput = screen.getByLabelText(/email/i);
        await userEvent.type(emailInput, 'invalid-email');

        const continueButton = screen.getByRole('button', { name: /continue/i });
        await userEvent.click(continueButton);

        expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should go to password step when email is valid', async () => {
        renderAddAccount();

        const emailInput = screen.getByLabelText(/email/i);
        await userEvent.type(emailInput, 'john@example.com');

        const continueButton = screen.getByRole('button', { name: /continue/i });
        await userEvent.click(continueButton);

        expect(await screen.findByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument();
    });

    it('should show password required error when submitting empty password', async () => {
        renderAddAccount();

        const emailInput = screen.getByLabelText(/email/i);
        await userEvent.type(emailInput, 'john@example.com');

        const continueButton = screen.getByRole('button', { name: /continue/i });
        await userEvent.click(continueButton);

        const signInButton = await screen.findByRole('button', { name: /sign in/i });
        await userEvent.click(signInButton);

        expect(await screen.findByText('Password is required')).toBeInTheDocument();
    });

    it('should go back to email step when change is clicked', async () => {
        renderAddAccount();

        const emailInput = screen.getByLabelText(/email/i);
        await userEvent.type(emailInput, 'john@example.com');

        const continueButton = screen.getByRole('button', { name: /continue/i });
        await userEvent.click(continueButton);

        const changeButton = await screen.findByRole('button', { name: /change/i });
        await userEvent.click(changeButton);

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
        expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    });

    it('should submit account with valid data', async () => {
        vi.mocked(accountService.addAccount).mockResolvedValue(mockAxiosResponse({}));

        renderAddAccount();

        const emailInput = screen.getByLabelText(/email/i);
        await userEvent.type(emailInput, 'john@example.com');

        const continueButton = screen.getByRole('button', { name: /continue/i });
        await userEvent.click(continueButton);

        const passwordInput = await screen.findByLabelText(/password/i);
        await userEvent.type(passwordInput, 'password123');

        const signInButton = screen.getByRole('button', { name: /sign in/i });
        await userEvent.click(signInButton);

        await waitFor(() => {
            expect(vi.mocked(accountService.addAccount)).toHaveBeenCalledWith({
                email: 'john@example.com',
                password: 'password123',
            });
        });
    });

    it('should navigate to profile after successful account addition', async () => {
        vi.mocked(accountService.addAccount).mockResolvedValue(mockAxiosResponse({}));

        renderAddAccount();

        const emailInput = screen.getByLabelText(/email/i);
        await userEvent.type(emailInput, 'john@example.com');

        const continueButton = screen.getByRole('button', { name: /continue/i });
        await userEvent.click(continueButton);

        const passwordInput = await screen.findByLabelText(/password/i);
        await userEvent.type(passwordInput, 'password123');

        const signInButton = screen.getByRole('button', { name: /sign in/i });
        await userEvent.click(signInButton);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/profile');
        });
    });

    it('should show error when account addition fails', async () => {
        vi.mocked(accountService.addAccount).mockRejectedValue({
            response: { data: { error: 'Invalid email or password' } },
        });

        renderAddAccount();

        const emailInput = screen.getByLabelText(/email/i);
        await userEvent.type(emailInput, 'john@example.com');

        const continueButton = screen.getByRole('button', { name: /continue/i });
        await userEvent.click(continueButton);

        const passwordInput = await screen.findByLabelText(/password/i);
        await userEvent.type(passwordInput, 'wrongpassword');

        const signInButton = screen.getByRole('button', { name: /sign in/i });
        await userEvent.click(signInButton);

        expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    });

    it('should show generic error when account addition fails without message', async () => {
        vi.mocked(accountService.addAccount).mockRejectedValue(new Error('Network error'));

        renderAddAccount();

        const emailInput = screen.getByLabelText(/email/i);
        await userEvent.type(emailInput, 'john@example.com');

        const continueButton = screen.getByRole('button', { name: /continue/i });
        await userEvent.click(continueButton);

        const passwordInput = await screen.findByLabelText(/password/i);
        await userEvent.type(passwordInput, 'password123');

        const signInButton = screen.getByRole('button', { name: /sign in/i });
        await userEvent.click(signInButton);

        expect(await screen.findByText(/failed to add account/i)).toBeInTheDocument();
    });

    it('should disable sign in button while loading', async () => {
        vi.mocked(accountService.addAccount).mockImplementation(() => new Promise(() => { }));

        renderAddAccount();

        const emailInput = screen.getByLabelText(/email/i);
        await userEvent.type(emailInput, 'john@example.com');

        const continueButton = screen.getByRole('button', { name: /continue/i });
        await userEvent.click(continueButton);

        const passwordInput = await screen.findByLabelText(/password/i);
        await userEvent.type(passwordInput, 'password123');

        const signInButton = screen.getByRole('button', { name: /sign in/i });
        await userEvent.click(signInButton);

        expect(signInButton).toBeDisabled();
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });

    it('should clear error when going back to email step', async () => {
        vi.mocked(accountService.addAccount).mockRejectedValue({
            response: { data: { error: 'Invalid email or password' } },
        });

        renderAddAccount();

        const emailInput = screen.getByLabelText(/email/i);
        await userEvent.type(emailInput, 'john@example.com');

        const continueButton = screen.getByRole('button', { name: /continue/i });
        await userEvent.click(continueButton);

        const passwordInput = await screen.findByLabelText(/password/i);
        await userEvent.type(passwordInput, 'wrongpassword');

        const signInButton = screen.getByRole('button', { name: /sign in/i });
        await userEvent.click(signInButton);

        expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();

        const changeButton = screen.getByRole('button', { name: /change/i });
        await userEvent.click(changeButton);

        expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument();
    });

    it('should have back button to profile', () => {
        renderAddAccount();

        const backButton = screen.getByRole('button', { name: /back/i });
        expect(backButton).toBeInTheDocument();

        backButton.click();
        expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });

    it('should show logo link', () => {
        renderAddAccount();

        const logoLink = screen.getByText('CheyenneShop');
        expect(logoLink).toBeInTheDocument();
        expect(logoLink).toHaveAttribute('href', '/');
    });

    it('should have correct input types', () => {
        renderAddAccount();

        expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
    });
});