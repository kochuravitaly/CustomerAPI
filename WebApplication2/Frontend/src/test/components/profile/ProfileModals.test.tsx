import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfileModals } from '../../../components/profile/ProfileModals';
import { LanguageProvider } from '../../../context/LanguageContext';
import { profileService } from '../../../services/profile.service';
import { useAuth } from '../../../context/AuthContext';

vi.mock('../../../services/profile.service', () => ({
    profileService: {
        changePassword: vi.fn(),
        changeEmail: vi.fn(),
        verifyEmailChange: vi.fn(),
        deleteAccount: vi.fn(),
    },
}));

vi.mock('../../../context/AuthContext', () => ({
    useAuth: vi.fn(),
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

const mockProfile = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'Customer',
};

const mockLogout = vi.fn();

describe('ProfileModals', () => {
    let queryClient: QueryClient;
    const mockOnError = vi.fn();
    const mockSetShowChangeEmailModal = vi.fn();
    const mockSetShowChangePasswordModal = vi.fn();
    const mockSetShowLogoutConfirm = vi.fn();
    const mockSetShowDeleteModal = vi.fn();

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        vi.clearAllMocks();
        vi.mocked(useAuth).mockReturnValue({
            logout: mockLogout,
            user: null,
            isAuthenticated: false,
            isAdmin: false,
            login: vi.fn(),
            register: vi.fn(),
            verify2FA: vi.fn(),
            switchAccount: vi.fn(),
        } as any);
    });

    const renderProfileModals = (props: any = {}) => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <ProfileModals
                        showChangeEmailModal={false}
                        setShowChangeEmailModal={mockSetShowChangeEmailModal}
                        showChangePasswordModal={false}
                        setShowChangePasswordModal={mockSetShowChangePasswordModal}
                        showLogoutConfirm={false}
                        setShowLogoutConfirm={mockSetShowLogoutConfirm}
                        showDeleteModal={false}
                        setShowDeleteModal={mockSetShowDeleteModal}
                        profile={mockProfile}
                        onError={mockOnError}
                        {...props}
                    />
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Change Email Modal', () => {
        it('should show change email modal when showChangeEmailModal is true', () => {
            renderProfileModals({ showChangeEmailModal: true });
            expect(screen.getByText(/change email/i)).toBeInTheDocument();
        });

        it('should not show change email modal when false', () => {
            renderProfileModals();
            expect(screen.queryByText(/change email/i)).not.toBeInTheDocument();
        });

        it('should close modal when X clicked', async () => {
            renderProfileModals({ showChangeEmailModal: true });
            const closeButton = screen.getAllByText('✕')[0];
            await userEvent.click(closeButton);
            expect(mockSetShowChangeEmailModal).toHaveBeenCalledWith(false);
        });

        it('should close modal when cancel clicked', async () => {
            renderProfileModals({ showChangeEmailModal: true });
            const cancelButton = screen.getByText(/cancel/i);
            await userEvent.click(cancelButton);
            expect(mockSetShowChangeEmailModal).toHaveBeenCalledWith(false);
        });

        it('should submit email change form', async () => {
            vi.mocked(profileService.changeEmail).mockResolvedValue(mockAxiosResponse({}));
            renderProfileModals({ showChangeEmailModal: true });

            const passwordInput = screen.getByPlaceholderText(/password/i);
            const emailInput = screen.getByPlaceholderText(/email/i);

            await userEvent.type(passwordInput, 'password123');
            await userEvent.type(emailInput, 'newemail@test.com');

            const submitButton = screen.getByText(/send code/i);
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(profileService.changeEmail)).toHaveBeenCalled();
            });
        });

        it('should disable button while submitting', async () => {
            vi.mocked(profileService.changeEmail).mockImplementation(() => new Promise(() => { }));
            renderProfileModals({ showChangeEmailModal: true });

            const passwordInput = screen.getByPlaceholderText(/password/i);
            const emailInput = screen.getByPlaceholderText(/email/i);

            await userEvent.type(passwordInput, 'password123');
            await userEvent.type(emailInput, 'newemail@test.com');

            const submitButton = screen.getByText(/send code/i);
            await userEvent.click(submitButton);

            expect(submitButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });

        it('should show error when change email fails', async () => {
            vi.mocked(profileService.changeEmail).mockRejectedValue({
                response: { data: { error: 'Email change failed' } },
            });
            renderProfileModals({ showChangeEmailModal: true });

            const passwordInput = screen.getByPlaceholderText(/password/i);
            const emailInput = screen.getByPlaceholderText(/email/i);

            await userEvent.type(passwordInput, 'password123');
            await userEvent.type(emailInput, 'newemail@test.com');

            const submitButton = screen.getByText(/send code/i);
            await userEvent.click(submitButton);

            expect(await screen.findByText('Email change failed')).toBeInTheDocument();
        });
    });

    describe('Change Password Modal', () => {
        it('should show change password modal when showChangePasswordModal is true', () => {
            renderProfileModals({ showChangePasswordModal: true });
            expect(screen.getAllByText(/change password/i)).toHaveLength(2);
        });

        it('should not show change password modal when false', () => {
            renderProfileModals();
            expect(screen.queryByText(/change password/i)).not.toBeInTheDocument();
        });

        it('should close modal when X clicked', async () => {
            renderProfileModals({ showChangePasswordModal: true });
            const closeButton = screen.getAllByText('✕')[0];
            await userEvent.click(closeButton);
            expect(mockSetShowChangePasswordModal).toHaveBeenCalledWith(false);
        });

        it('should submit password change form', async () => {
            vi.mocked(profileService.changePassword).mockResolvedValue(mockAxiosResponse({}));
            renderProfileModals({ showChangePasswordModal: true });

            const inputs = screen.getAllByPlaceholderText(/password/i);
            await userEvent.type(inputs[0], 'oldpassword123');
            await userEvent.type(inputs[1], 'newpassword123');
            await userEvent.type(inputs[2], 'newpassword123');

            const submitButton = screen.getAllByText(/change password/i)[1];
            await userEvent.click(submitButton);

            await waitFor(() => {
                expect(vi.mocked(profileService.changePassword)).toHaveBeenCalled();
            });
        });

        it('should disable button while submitting', async () => {
            vi.mocked(profileService.changePassword).mockImplementation(() => new Promise(() => { }));
            renderProfileModals({ showChangePasswordModal: true });

            const inputs = screen.getAllByPlaceholderText(/password/i);
            await userEvent.type(inputs[0], 'oldpassword123');
            await userEvent.type(inputs[1], 'newpassword123');
            await userEvent.type(inputs[2], 'newpassword123');

            const submitButton = screen.getAllByText(/change password/i)[1];
            await userEvent.click(submitButton);

            expect(submitButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });

        it('should show error when passwords are same', async () => {
            renderProfileModals({ showChangePasswordModal: true });

            const inputs = screen.getAllByPlaceholderText(/password/i);
            await userEvent.type(inputs[0], 'samepassword123');
            await userEvent.type(inputs[1], 'samepassword123');
            await userEvent.type(inputs[2], 'samepassword123');

            const submitButton = screen.getAllByText(/change password/i)[1];
            await userEvent.click(submitButton);

            expect(await screen.findByText(/different from current password/i)).toBeInTheDocument();
        });

        it('should show error when passwords do not match', async () => {
            renderProfileModals({ showChangePasswordModal: true });

            const inputs = screen.getAllByPlaceholderText(/password/i);
            await userEvent.type(inputs[0], 'oldpassword123');
            await userEvent.type(inputs[1], 'newpassword123');
            await userEvent.type(inputs[2], 'differentpassword123');

            const submitButton = screen.getAllByText(/change password/i)[1];
            await userEvent.click(submitButton);

            expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
        });

        it('should show error when change password fails', async () => {
            vi.mocked(profileService.changePassword).mockRejectedValue({
                response: { data: { error: 'Password change failed' } },
            });
            renderProfileModals({ showChangePasswordModal: true });

            const inputs = screen.getAllByPlaceholderText(/password/i);
            await userEvent.type(inputs[0], 'oldpassword123');
            await userEvent.type(inputs[1], 'newpassword123');
            await userEvent.type(inputs[2], 'newpassword123');

            const submitButton = screen.getAllByText(/change password/i)[1];
            await userEvent.click(submitButton);

            expect(await screen.findByText('Password change failed')).toBeInTheDocument();
        });
    });

    describe('Logout Confirmation', () => {
        it('should show logout confirmation when showLogoutConfirm is true', () => {
            renderProfileModals({ showLogoutConfirm: true });
            expect(screen.getAllByText(/logout/i)).toHaveLength(2);
        });

        it('should not show logout when false', () => {
            renderProfileModals();
            expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
        });

        it('should call logout when confirmed', async () => {
            mockLogout.mockResolvedValue(undefined);
            renderProfileModals({ showLogoutConfirm: true });

            const logoutButton = screen.getAllByText(/logout/i)[1];
            await userEvent.click(logoutButton);

            expect(mockLogout).toHaveBeenCalled();
        });

        it('should close modal when cancel clicked', async () => {
            renderProfileModals({ showLogoutConfirm: true });
            const cancelButton = screen.getByText(/cancel/i);
            await userEvent.click(cancelButton);
            expect(mockSetShowLogoutConfirm).toHaveBeenCalledWith(false);
        });
    });

    describe('Delete Account Modal', () => {
        it('should show delete account modal when showDeleteModal is true', () => {
            renderProfileModals({ showDeleteModal: true });
            expect(screen.getByText(/delete account/i)).toBeInTheDocument();
        });

        it('should not show delete modal when false', () => {
            renderProfileModals();
            expect(screen.queryByText(/delete account/i)).not.toBeInTheDocument();
        });

        it('should show error when password is empty', async () => {
            renderProfileModals({ showDeleteModal: true });

            const deleteButton = screen.getByText(/delete my account/i);
            await userEvent.click(deleteButton);

            expect(await screen.findByText('Password is required')).toBeInTheDocument();
        });

        it('should call deleteAccount when password provided', async () => {
            vi.mocked(profileService.deleteAccount).mockResolvedValue(mockAxiosResponse({}));
            mockLogout.mockResolvedValue(undefined);

            const originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                value: { href: '' },
                writable: true,
            });

            renderProfileModals({ showDeleteModal: true });

            const passwordInput = document.querySelector('.search-input') as HTMLElement;
            await userEvent.type(passwordInput, 'password123');

            const deleteButton = screen.getByText(/delete my account/i);
            await userEvent.click(deleteButton);

            await waitFor(() => {
                expect(vi.mocked(profileService.deleteAccount)).toHaveBeenCalledWith({ password: 'password123' });
            });

            Object.defineProperty(window, 'location', {
                value: originalLocation,
                writable: true,
            });
        });

        it('should show error when delete fails', async () => {
            vi.mocked(profileService.deleteAccount).mockRejectedValue({
                response: { data: { error: 'Delete failed' } },
            });

            renderProfileModals({ showDeleteModal: true });

            const passwordInput = document.querySelector('.search-input') as HTMLElement;
            await userEvent.type(passwordInput, 'password123');

            const deleteButton = screen.getByText(/delete my account/i);
            await userEvent.click(deleteButton);

            expect(await screen.findByText('Delete failed')).toBeInTheDocument();
        });

        it('should disable button while deleting', async () => {
            vi.mocked(profileService.deleteAccount).mockImplementation(() => new Promise(() => { }));

            renderProfileModals({ showDeleteModal: true });

            const passwordInput = document.querySelector('.search-input') as HTMLElement;
            await userEvent.type(passwordInput, 'password123');

            const deleteButton = screen.getByText(/delete my account/i);
            await userEvent.click(deleteButton);

            expect(deleteButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });
    });
});