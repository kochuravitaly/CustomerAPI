import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccountSwitching } from '../../../components/profile/AccountSwitching';
import { LanguageProvider } from '../../../context/LanguageContext';
import { accountService } from '../../../services/account.service';
import { useAuth } from '../../../context/AuthContext';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../../../services/account.service', () => ({
    accountService: {
        getAccounts: vi.fn(),
        removeAccount: vi.fn(),
    },
}));

vi.mock('../../../context/AuthContext', () => ({
    useAuth: vi.fn(),
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

const mockAccounts = [
    { id: 'user-1', name: 'User One', email: 'user1@test.com', role: 'Customer', hasProfilePicture: false },
    { id: 'user-2', name: 'User Two', email: 'user2@test.com', role: 'Admin', hasProfilePicture: true },
];

describe('AccountSwitching', () => {
    let queryClient: QueryClient;
    const mockOnError = vi.fn();
    const mockSwitchAccount = vi.fn();

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        vi.clearAllMocks();
        vi.mocked(useAuth).mockReturnValue({
            user: { id: 'user-1', role: 'Customer', email: 'user1@test.com' },
            switchAccount: mockSwitchAccount,
            isAuthenticated: true,
            isAdmin: false,
            login: vi.fn(),
            register: vi.fn(),
            logout: vi.fn(),
            verify2FA: vi.fn(),
        } as any);
        vi.mocked(accountService.getAccounts).mockResolvedValue(mockAxiosResponse(mockAccounts));
    });

    const renderAccountSwitching = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <AccountSwitching onError={mockOnError} />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Loading and Error States', () => {
        it('should show loading spinner while accounts load', () => {
            vi.mocked(accountService.getAccounts).mockImplementation(() => new Promise(() => { }));
            renderAccountSwitching();
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });

        it('should show error when accounts fail to load', async () => {
            vi.mocked(accountService.getAccounts).mockRejectedValue(new Error('Network error'));
            renderAccountSwitching();
            expect(await screen.findByText('Failed to load accounts')).toBeInTheDocument();
        });
    });

    describe('Display Accounts', () => {
        it('should display all saved accounts', async () => {
            renderAccountSwitching();
            expect(await screen.findByText('User One')).toBeInTheDocument();
            expect(screen.getByText('User Two')).toBeInTheDocument();
        });

        it('should display email for each account', async () => {
            renderAccountSwitching();
            expect(await screen.findByText('user1@test.com')).toBeInTheDocument();
            expect(screen.getByText('user2@test.com')).toBeInTheDocument();
        });

        it('should mark current account', async () => {
            renderAccountSwitching();
            expect(await screen.findByText(/current/i)).toBeInTheDocument();
        });

        it('should show no accounts message when empty', async () => {
            vi.mocked(accountService.getAccounts).mockResolvedValue(mockAxiosResponse([]));
            renderAccountSwitching();
            expect(await screen.findByText(/no saved accounts/i)).toBeInTheDocument();
        });

        it('should show add account link', async () => {
            renderAccountSwitching();
            expect(await screen.findByText(/add account/i)).toBeInTheDocument();
        });

        it('should show remove button', async () => {
            renderAccountSwitching();
            expect(await screen.findByText(/remove/i)).toBeInTheDocument();
        });
    });

    describe('Switch Account', () => {
        it('should call switchAccount when other account clicked', async () => {
            mockSwitchAccount.mockResolvedValue(undefined);
            renderAccountSwitching();

            const accountTwo = await screen.findByText('User Two');
            await userEvent.click(accountTwo);

            await waitFor(() => {
                expect(mockSwitchAccount).toHaveBeenCalledWith('user-2');
            });
        });

        it('should not call switchAccount when current account clicked', async () => {
            renderAccountSwitching();

            const accountOne = await screen.findByText('User One');
            await userEvent.click(accountOne);

            expect(mockSwitchAccount).not.toHaveBeenCalled();
        });

        it('should show error when switch fails', async () => {
            mockSwitchAccount.mockRejectedValue({ response: { data: { error: 'Switch failed' } } });
            renderAccountSwitching();

            const accountTwo = await screen.findByText('User Two');
            await userEvent.click(accountTwo);

            expect(await screen.findByText('Switch failed')).toBeInTheDocument();
            expect(mockOnError).toHaveBeenCalledWith('Switch failed');
        });
    });

    describe('Remove Account', () => {
        it('should show remove buttons when remove clicked', async () => {
            renderAccountSwitching();

            const removeButton = await screen.findByText(/remove/i);
            await userEvent.click(removeButton);

            expect(await screen.findByText(/cancel/i)).toBeInTheDocument();
        });

        it('should show confirmation modal when remove account clicked', async () => {
            renderAccountSwitching();

            const removeButton = await screen.findByText(/remove/i);
            await userEvent.click(removeButton);

            const removeAccountButton = await screen.findByText('✕');
            await userEvent.click(removeAccountButton);

            expect(await screen.findAllByText(/remove account/i)).toHaveLength(2);
        });

        it('should call removeAccount when confirmed', async () => {
            vi.mocked(accountService.removeAccount).mockResolvedValue(mockAxiosResponse({}));
            renderAccountSwitching();

            const removeButton = await screen.findByText(/remove/i);
            await userEvent.click(removeButton);

            const removeAccountButton = await screen.findByText('✕');
            await userEvent.click(removeAccountButton);

            const confirmButtons = screen.getAllByText(/remove account/i);
            await userEvent.click(confirmButtons[1]);

            await waitFor(() => {
                expect(vi.mocked(accountService.removeAccount)).toHaveBeenCalledWith('user-2');
            });
        });

        it('should close modal when cancel clicked', async () => {
            renderAccountSwitching();

            const removeButton = await screen.findByText(/remove/i);
            await userEvent.click(removeButton);

            const removeAccountButton = await screen.findByText('✕');
            await userEvent.click(removeAccountButton);

            const cancelButtons = screen.getAllByText(/cancel/i);
            await userEvent.click(cancelButtons[1]);

            expect(screen.queryByText(/remove this account/i)).not.toBeInTheDocument();
        });

        it('should show error when remove fails', async () => {
            vi.mocked(accountService.removeAccount).mockRejectedValue({
                response: { data: { error: 'Remove failed' } },
            });
            renderAccountSwitching();

            const removeButton = await screen.findByText(/remove/i);
            await userEvent.click(removeButton);

            const removeAccountButton = await screen.findByText('✕');
            await userEvent.click(removeAccountButton);

            const confirmButtons = screen.getAllByText(/remove account/i);
            await userEvent.click(confirmButtons[1]);

            expect(await screen.findByText('Remove failed')).toBeInTheDocument();
        });
    });
});