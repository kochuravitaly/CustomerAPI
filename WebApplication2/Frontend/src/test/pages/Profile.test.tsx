import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Profile } from '../../pages/Profile';
import { AuthProvider } from '../../context/AuthContext';
import { LanguageProvider } from '../../context/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { profileService } from '../../services/profile.service';
import { apiService } from '../../services/api';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../../services/profile.service', () => ({
    profileService: {
        getProfile: vi.fn(),
        updateName: vi.fn(),
        deleteProfilePicture: vi.fn(),
    },
}));

vi.mock('../../services/api', () => ({
    apiService: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

vi.mock('../../context/ThemeContext', () => ({
    ThemeProvider: ({ children }: any) => <>{children}</>,
    useTheme: vi.fn(() => ({
        theme: 'light',
        toggleTheme: vi.fn(),
    })),
}));

vi.mock('../../components/LoadingSpinner', () => ({
    LoadingSpinner: () => <div>Loading...</div>,
}));

vi.mock('../../components/profile/AccountSwitching', () => ({
    AccountSwitching: ({ onError }: any) => <div data-testid="account-switching">Account Switching</div>,
}));

vi.mock('../../components/profile/TwoFactorSection', () => ({
    TwoFactorSection: ({ onError }: any) => <div data-testid="two-factor">Two Factor</div>,
}));

vi.mock('../../components/profile/ActiveSessions', () => ({
    ActiveSessions: ({ onError }: any) => <div data-testid="active-sessions">Active Sessions</div>,
}));

vi.mock('../../components/profile/ProfileModals', () => ({
    ProfileModals: (props: any) => <div data-testid="profile-modals">Modals</div>,
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

const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxMjM0NTY3OCIsInJvbGUiOiJDdXN0b21lciIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.fakeSignature';

const mockProfile = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'Customer',
    isEmailConfirmed: true,
    createdAt: '2024-01-01T00:00:00Z',
    hasProfilePicture: false,
};

const mockProfileWithPicture = {
    ...mockProfile,
    hasProfilePicture: true,
};

describe('Profile', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        localStorage.clear();
        localStorage.setItem('accessToken', mockToken);
        localStorage.setItem('refreshToken', 'refresh-token');
        vi.clearAllMocks();
        vi.mocked(profileService.getProfile).mockResolvedValue(mockAxiosResponse(mockProfile));
        vi.mocked(apiService.get).mockResolvedValue(mockAxiosResponse(new Blob()));
        URL.createObjectURL = vi.fn(() => 'blob:mock-url');
        URL.revokeObjectURL = vi.fn();
        window.scrollTo = vi.fn();
    });

    const renderProfile = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <AuthProvider>
                        <MemoryRouter>
                            <Profile />
                        </MemoryRouter>
                    </AuthProvider>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Loading and Error States', () => {
        it('should show loading spinner while profile loads', () => {
            vi.mocked(profileService.getProfile).mockImplementation(() => new Promise(() => { }));
            renderProfile();
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });

        it('should show error when profile fails to load', async () => {
            vi.mocked(profileService.getProfile).mockRejectedValue(new Error('Network error'));
            renderProfile();
            expect(await screen.findByText('Failed to load profile')).toBeInTheDocument();
        });
    });

    describe('Main Profile View', () => {
        it('should display profile name', async () => {
            renderProfile();
            expect(await screen.findByText('Test User')).toBeInTheDocument();
        });

        it('should display logo', async () => {
            renderProfile();
            expect(await screen.findByText('CheyenneShop')).toBeInTheDocument();
        });

        it('should display edit button', async () => {
            renderProfile();
            expect(await screen.findByText('✏️')).toBeInTheDocument();
        });

        it('should display settings button', async () => {
            renderProfile();
            expect(await screen.findByText('⚙️')).toBeInTheDocument();
        });

        it('should display menu items', async () => {
            renderProfile();
            expect(await screen.findByText(/my orders/i)).toBeInTheDocument();
            expect(screen.getByText(/my reviews/i)).toBeInTheDocument();
        });

        it('should navigate to orders when clicked', async () => {
            renderProfile();
            const ordersLink = await screen.findByText(/my orders/i);
            expect(ordersLink.closest('a')).toHaveAttribute('href', '/orders');
        });

        it('should navigate to reviews when clicked', async () => {
            renderProfile();
            const reviewsLink = await screen.findByText(/my reviews/i);
            expect(reviewsLink.closest('a')).toHaveAttribute('href', '/my-reviews');
        });
    });

    describe('Profile Picture', () => {
        it('should show placeholder when no picture', async () => {
            renderProfile();
            await waitFor(() => {
                const svg = document.querySelector('.profile-avatar-circle svg');
                expect(svg).toBeInTheDocument();
            });
        });

        it('should show picture when profile has one', async () => {
            vi.mocked(profileService.getProfile).mockResolvedValue(mockAxiosResponse(mockProfileWithPicture));
            renderProfile();
            await waitFor(() => {
                const img = document.querySelector('.profile-avatar-img');
                expect(img).toBeInTheDocument();
            });
        });

        it('should expand picture when clicked', async () => {
            vi.mocked(profileService.getProfile).mockResolvedValue(mockAxiosResponse(mockProfileWithPicture));
            renderProfile();
            await waitFor(() => {
                const img = document.querySelector('.profile-avatar-img');
                expect(img).toBeInTheDocument();
            });
            await userEvent.click(document.querySelector('.profile-avatar-circle') as HTMLElement);
            expect(screen.getAllByText('✕').length).toBeGreaterThan(0);
        });

        it('should close expanded picture', async () => {
            vi.mocked(profileService.getProfile).mockResolvedValue(mockAxiosResponse(mockProfileWithPicture));
            renderProfile();
            await waitFor(() => {
                const img = document.querySelector('.profile-avatar-img');
                expect(img).toBeInTheDocument();
            });
            await userEvent.click(document.querySelector('.profile-avatar-circle') as HTMLElement);
            const closeButtons = screen.getAllByText('✕');
            await userEvent.click(closeButtons[closeButtons.length - 1]);
            expect(screen.queryByText('✕')).not.toBeInTheDocument();
        });
    });

    describe('Edit Modal', () => {
        it('should open edit modal when edit button clicked', async () => {
            renderProfile();
            const editButton = await screen.findByText('✏️');
            await userEvent.click(editButton);
            expect(await screen.findByText(/edit profile/i)).toBeInTheDocument();
        });

        it('should show current name in input', async () => {
            renderProfile();
            const editButton = await screen.findByText('✏️');
            await userEvent.click(editButton);
            const nameInput = await screen.findByDisplayValue('Test User');
            expect(nameInput).toBeInTheDocument();
        });

        it('should show change profile picture button', async () => {
            renderProfile();
            const editButton = await screen.findByText('✏️');
            await userEvent.click(editButton);
            expect(await screen.findByText(/change profile picture/i)).toBeInTheDocument();
        });

        it('should close modal when cancel clicked', async () => {
            renderProfile();
            const editButton = await screen.findByText('✏️');
            await userEvent.click(editButton);
            const cancelButton = await screen.findByText(/cancel/i);
            await userEvent.click(cancelButton);
            expect(screen.queryByText(/edit profile/i)).not.toBeInTheDocument();
        });

        it('should close modal when X clicked', async () => {
            renderProfile();
            const editButton = await screen.findByText('✏️');
            await userEvent.click(editButton);
            const closeButtons = screen.getAllByText('✕');
            await userEvent.click(closeButtons[0]);
            expect(screen.queryByText(/edit profile/i)).not.toBeInTheDocument();
        });

        it('should save name when save clicked', async () => {
            vi.mocked(profileService.updateName).mockResolvedValue(mockAxiosResponse({}));
            renderProfile();
            const editButton = await screen.findByText('✏️');
            await userEvent.click(editButton);
            const nameInput = await screen.findByDisplayValue('Test User');
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, 'New Name');
            const saveButton = screen.getByText(/save/i);
            await userEvent.click(saveButton);
            await waitFor(() => {
                expect(vi.mocked(profileService.updateName)).toHaveBeenCalledWith({ name: 'New Name' });
            });
        });

        it('should show success message after save', async () => {
            vi.mocked(profileService.updateName).mockResolvedValue(mockAxiosResponse({}));
            renderProfile();
            const editButton = await screen.findByText('✏️');
            await userEvent.click(editButton);
            const nameInput = await screen.findByDisplayValue('Test User');
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, 'New Name');
            await userEvent.click(screen.getByText(/save/i));
            expect(await screen.findByText(/name updated/i)).toBeInTheDocument();
        });

        it('should disable save button while saving', async () => {
            vi.mocked(profileService.updateName).mockImplementation(() => new Promise(() => { }));
            renderProfile();
            const editButton = await screen.findByText('✏️');
            await userEvent.click(editButton);
            const nameInput = await screen.findByDisplayValue('Test User');
            await userEvent.clear(nameInput);
            await userEvent.type(nameInput, 'New Name');
            const saveButton = screen.getByText(/save/i);
            await userEvent.click(saveButton);
            expect(saveButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });
    });

    describe('Profile Picture Upload', () => {
        it('should upload picture when file selected', async () => {
            vi.mocked(apiService.post).mockResolvedValue(mockAxiosResponse({}));
            renderProfile();
            const editButton = await screen.findByText('✏️');
            await userEvent.click(editButton);

            const fileInput = document.querySelector('input[type="file"]') as HTMLElement;
            const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
            await userEvent.upload(fileInput, file);

            const saveButton = screen.getByText(/save/i);
            await userEvent.click(saveButton);

            await waitFor(() => {
                expect(vi.mocked(apiService.post)).toHaveBeenCalled();
            });
        });
    });

    describe('Delete Profile Picture', () => {
        beforeEach(() => {
            vi.mocked(profileService.getProfile).mockResolvedValue(mockAxiosResponse(mockProfileWithPicture));
        });

        it('should show delete picture button when picture exists', async () => {
            renderProfile();
            const editButton = await screen.findByText('✏️');
            await userEvent.click(editButton);
            expect(await screen.findByText(/remove profile picture/i)).toBeInTheDocument();
        });

        it('should show confirmation modal when delete picture clicked', async () => {
            renderProfile();
            const editButton = await screen.findByText('✏️');
            await userEvent.click(editButton);
            const deleteButton = await screen.findByText(/remove profile picture/i);
            await userEvent.click(deleteButton);
            await waitFor(() => {
                expect(screen.getAllByText(/remove profile picture/i).length).toBeGreaterThan(1);
            });
        });

        it('should delete picture when confirmed', async () => {
            vi.mocked(profileService.deleteProfilePicture).mockResolvedValue(mockAxiosResponse({}));
            renderProfile();
            const editButton = await screen.findByText('✏️');
            await userEvent.click(editButton);
            const deleteButton = await screen.findByText(/remove profile picture/i);
            await userEvent.click(deleteButton);
            const confirmButtons = screen.getAllByRole('button', { name: /remove profile picture/i });
            await userEvent.click(confirmButtons[1]);
            await waitFor(() => {
                expect(vi.mocked(profileService.deleteProfilePicture)).toHaveBeenCalled();
            });
        });

        it('should close confirmation when cancel clicked', async () => {
            renderProfile();
            const editButton = await screen.findByText('✏️');
            await userEvent.click(editButton);
            const deleteButton = await screen.findByText(/remove profile picture/i);
            await userEvent.click(deleteButton);
            const cancelButtons = screen.getAllByText(/cancel/i);
            await userEvent.click(cancelButtons[cancelButtons.length - 1]);
            await waitFor(() => {
                expect(screen.getAllByText(/remove profile picture/i).length).toBe(1);
            });
        });
    });

    describe('Settings View', () => {
        it('should open settings when gear clicked', async () => {
            renderProfile();
            const gearButton = await screen.findByText('⚙️');
            await userEvent.click(gearButton);
            expect(await screen.findByText(/settings/i)).toBeInTheDocument();
        });

        it('should show appearance section by default', async () => {
            renderProfile();
            await userEvent.click(await screen.findByText('⚙️'));
            expect(await screen.findByText(/appearance/i)).toBeInTheDocument();
        });

        it('should show theme selector', async () => {
            renderProfile();
            await userEvent.click(await screen.findByText('⚙️'));
            expect(await screen.findByRole('combobox')).toBeInTheDocument();
        });

        it('should toggle account section', async () => {
            renderProfile();
            await userEvent.click(await screen.findByText('⚙️'));
            const accountSection = await screen.findByText(/account/i);
            await userEvent.click(accountSection);
            await waitFor(() => {
                expect(screen.getByTestId('account-switching')).toBeInTheDocument();
            });
        });

        it('should toggle security section', async () => {
            renderProfile();
            await userEvent.click(await screen.findByText('⚙️'));
            const securitySection = await screen.findByText(/security/i);
            await userEvent.click(securitySection);
            await waitFor(() => {
                expect(screen.getByTestId('two-factor')).toBeInTheDocument();
                expect(screen.getByTestId('active-sessions')).toBeInTheDocument();
            });
        });

        it('should toggle danger section', async () => {
            renderProfile();
            await userEvent.click(await screen.findByText('⚙️'));
            const dangerSection = await screen.findByText(/danger zone/i);
            await userEvent.click(dangerSection);
            await waitFor(() => {
                expect(screen.getAllByText(/logout/i).length).toBeGreaterThan(0);
                expect(screen.getAllByText(/delete account/i).length).toBe(2);
            });
        });

        it('should show modals component', async () => {
            renderProfile();
            await userEvent.click(await screen.findByText('⚙️'));
            expect(await screen.findByTestId('profile-modals')).toBeInTheDocument();
        });

        it('should navigate back when back button clicked', async () => {
            renderProfile();
            await userEvent.click(await screen.findByText('⚙️'));
            const backButton = await screen.findByText(/back/i);
            await userEvent.click(backButton);
            expect(await screen.findByText('Test User')).toBeInTheDocument();
        });

        it('should close settings section', async () => {
            renderProfile();
            await userEvent.click(await screen.findByText('⚙️'));
            const accountSection = await screen.findByText(/account/i);
            await userEvent.click(accountSection);
            await waitFor(() => {
                expect(screen.getByTestId('account-switching')).toBeInTheDocument();
            });
            await userEvent.click(accountSection);
            await waitFor(() => {
                expect(screen.queryByTestId('account-switching')).not.toBeInTheDocument();
            });
        });
    });
});