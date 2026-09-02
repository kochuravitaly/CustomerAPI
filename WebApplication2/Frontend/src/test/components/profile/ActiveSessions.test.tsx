import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActiveSessions } from '../../../components/profile/ActiveSessions';
import { LanguageProvider } from '../../../context/LanguageContext';
import { profileService } from '../../../services/profile.service';

vi.mock('../../../services/profile.service', () => ({
    profileService: {
        getSessions: vi.fn(),
        revokeSession: vi.fn(),
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

const mockSessions = [
    {
        id: 1,
        deviceInfo: 'Chrome on Windows',
        ipAddress: '192.168.1.1',
        lastActiveAt: '2024-01-01T10:00:00Z',
        isCurrentSession: true,
    },
    {
        id: 2,
        deviceInfo: 'Safari on iPhone',
        ipAddress: '10.0.0.1',
        lastActiveAt: '2024-01-02T15:30:00Z',
        isCurrentSession: false,
    },
];

describe('ActiveSessions', () => {
    let queryClient: QueryClient;
    const mockOnError = vi.fn();

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        vi.clearAllMocks();
        vi.mocked(profileService.getSessions).mockResolvedValue(mockAxiosResponse(mockSessions));
    });

    const renderActiveSessions = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <ActiveSessions onError={mockOnError} />
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Loading and Error States', () => {
        it('should show loading spinner while sessions load', () => {
            vi.mocked(profileService.getSessions).mockImplementation(() => new Promise(() => { }));
            renderActiveSessions();
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });

        it('should show error when sessions fail to load', async () => {
            vi.mocked(profileService.getSessions).mockRejectedValue(new Error('Network error'));
            renderActiveSessions();
            expect(await screen.findByText('Failed to load sessions')).toBeInTheDocument();
        });
    });

    describe('Display Sessions', () => {
        it('should display heading', async () => {
            renderActiveSessions();
            expect(await screen.findByRole('heading', { name: /active sessions/i })).toBeInTheDocument();
        });

        it('should display all sessions', async () => {
            renderActiveSessions();
            expect(await screen.findByText(/Chrome on Windows/i)).toBeInTheDocument();
            expect(screen.getByText(/Safari on iPhone/i)).toBeInTheDocument();
        });

        it('should display IP addresses', async () => {
            renderActiveSessions();
            expect(await screen.findByText(/192\.168\.1\.1/i)).toBeInTheDocument();
            expect(screen.getByText(/10\.0\.0\.1/i)).toBeInTheDocument();
        });

        it('should mark current session', async () => {
            renderActiveSessions();
            expect(await screen.findByText(/current session/i)).toBeInTheDocument();
        });

        it('should show no sessions message when empty', async () => {
            vi.mocked(profileService.getSessions).mockResolvedValue(mockAxiosResponse([]));
            renderActiveSessions();
            expect(await screen.findByText(/no active sessions/i)).toBeInTheDocument();
        });

        it('should show revoke button only for non-current sessions', async () => {
            renderActiveSessions();
            const revokeButtons = await screen.findAllByText(/revoke/i);
            expect(revokeButtons).toHaveLength(1);
        });
    });

    describe('Revoke Session', () => {
        it('should call revokeSession when revoke clicked', async () => {
            vi.mocked(profileService.revokeSession).mockResolvedValue(mockAxiosResponse({}));
            renderActiveSessions();

            const revokeButton = await screen.findByText(/revoke/i);
            await userEvent.click(revokeButton);

            await waitFor(() => {
                expect(vi.mocked(profileService.revokeSession)).toHaveBeenCalledWith(2);
            });
        });

        it('should show success message after revoke', async () => {
            vi.mocked(profileService.revokeSession).mockResolvedValue(mockAxiosResponse({}));
            renderActiveSessions();

            const revokeButton = await screen.findByText(/revoke/i);
            await userEvent.click(revokeButton);

            expect(await screen.findByText(/session revoked successfully/i)).toBeInTheDocument();
        });

        it('should disable button while revoking', async () => {
            vi.mocked(profileService.revokeSession).mockImplementation(() => new Promise(() => { }));
            renderActiveSessions();

            const revokeButton = await screen.findByText(/revoke/i);
            await userEvent.click(revokeButton);

            expect(revokeButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });

        it('should show error message when revoke fails', async () => {
            vi.mocked(profileService.revokeSession).mockRejectedValue({
                response: { data: { error: 'Revoke failed' } },
            });
            renderActiveSessions();

            const revokeButton = await screen.findByText(/revoke/i);
            await userEvent.click(revokeButton);

            expect(await screen.findByText('Revoke failed')).toBeInTheDocument();
            expect(mockOnError).toHaveBeenCalledWith('Revoke failed');
        });

        it('should show generic error when revoke fails without message', async () => {
            vi.mocked(profileService.revokeSession).mockRejectedValue(new Error('Network error'));
            renderActiveSessions();

            const revokeButton = await screen.findByText(/revoke/i);
            await userEvent.click(revokeButton);

            expect(await screen.findByText('Failed to revoke session')).toBeInTheDocument();
        });

        it('should refetch sessions after revoke', async () => {
            vi.mocked(profileService.revokeSession).mockResolvedValue(mockAxiosResponse({}));
            renderActiveSessions();

            const revokeButton = await screen.findByText(/revoke/i);
            await userEvent.click(revokeButton);

            await waitFor(() => {
                expect(vi.mocked(profileService.getSessions)).toHaveBeenCalledTimes(2);
            });
        });
    });
});