import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TwoFactorSection } from '../../../components/profile/TwoFactorSection';
import { LanguageProvider } from '../../../context/LanguageContext';
import { profileService } from '../../../services/profile.service';

vi.mock('../../../services/profile.service', () => ({
    profileService: {
        get2FAInfo: vi.fn(),
        get2FASetup: vi.fn(),
        enable2FA: vi.fn(),
        disable2FA: vi.fn(),
        setupEmail2FA: vi.fn(),
        verifyEmail2FA: vi.fn(),
        sendDisable2FACode: vi.fn(),
    },
}));

vi.mock('qrcode.react', () => ({
    QRCodeSVG: () => <div data-testid="qr-code">QR Code</div>,
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

const mock2FAInfo = {
    isEnabled: false,
    method: 'app',
};

const mock2FASetup = {
    qrCodeUri: 'otpauth://test',
    secretKey: 'SECRET123',
};

describe('TwoFactorSection', () => {
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
        vi.mocked(profileService.get2FAInfo).mockResolvedValue(mockAxiosResponse(mock2FAInfo));
    });

    const renderTwoFactorSection = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <TwoFactorSection onError={mockOnError} />
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Loading and Error States', () => {
        it('should show loading spinner while checking 2FA status', () => {
            vi.mocked(profileService.get2FAInfo).mockImplementation(() => new Promise(() => { }));
            renderTwoFactorSection();
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });

        it('should show error when 2FA status fails to load', async () => {
            vi.mocked(profileService.get2FAInfo).mockRejectedValue(new Error('Network error'));
            renderTwoFactorSection();
            expect(await screen.findByText('Failed to load 2FA status')).toBeInTheDocument();
        });
    });

    describe('Display', () => {
        it('should show heading', async () => {
            renderTwoFactorSection();
            expect(await screen.findByText(/two-factor/i)).toBeInTheDocument();
        });

        it('should show setup buttons when 2FA is disabled', async () => {
            renderTwoFactorSection();
            expect(await screen.findByText(/authenticator app/i)).toBeInTheDocument();
            expect(screen.getByText(/email/i)).toBeInTheDocument();
        });

        it('should show enabled status when 2FA is enabled', async () => {
            vi.mocked(profileService.get2FAInfo).mockResolvedValue(mockAxiosResponse({ isEnabled: true, method: 'app' }));
            renderTwoFactorSection();
            expect(await screen.findByText(/enabled/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /disable 2fa/i })).toBeInTheDocument();
        });
    });

    describe('Authenticator App Setup', () => {
        it('should open setup modal when clicked', async () => {
            vi.mocked(profileService.get2FASetup).mockResolvedValue(mockAxiosResponse(mock2FASetup));
            renderTwoFactorSection();

            const setupButton = await screen.findByText(/authenticator app/i);
            await userEvent.click(setupButton);

            expect(await screen.findByText(/set up authenticator app/i)).toBeInTheDocument();
        });

        it('should show QR code when modal opens', async () => {
            vi.mocked(profileService.get2FASetup).mockResolvedValue(mockAxiosResponse(mock2FASetup));
            renderTwoFactorSection();

            const setupButton = await screen.findByText(/authenticator app/i);
            await userEvent.click(setupButton);

            expect(await screen.findByTestId('qr-code')).toBeInTheDocument();
        });

        it('should show secret key', async () => {
            vi.mocked(profileService.get2FASetup).mockResolvedValue(mockAxiosResponse(mock2FASetup));
            renderTwoFactorSection();

            const setupButton = await screen.findByText(/authenticator app/i);
            await userEvent.click(setupButton);

            expect(await screen.findByText('SECRET123')).toBeInTheDocument();
        });

        it('should enable 2FA with code', async () => {
            vi.mocked(profileService.get2FASetup).mockResolvedValue(mockAxiosResponse(mock2FASetup));
            vi.mocked(profileService.enable2FA).mockResolvedValue(mockAxiosResponse({}));
            renderTwoFactorSection();

            const setupButton = await screen.findByText(/authenticator app/i);
            await userEvent.click(setupButton);

            const codeInput = await screen.findByPlaceholderText('000000');
            await userEvent.type(codeInput, '123456');

            const enableButton = screen.getByText(/verify and enable/i);
            await userEvent.click(enableButton);

            await waitFor(() => {
                expect(vi.mocked(profileService.enable2FA)).toHaveBeenCalledWith('123456');
            });
        });

        it('should disable button while enabling', async () => {
            vi.mocked(profileService.get2FASetup).mockResolvedValue(mockAxiosResponse(mock2FASetup));
            vi.mocked(profileService.enable2FA).mockImplementation(() => new Promise(() => { }));
            renderTwoFactorSection();

            const setupButton = await screen.findByText(/authenticator app/i);
            await userEvent.click(setupButton);

            const codeInput = await screen.findByPlaceholderText('000000');
            await userEvent.type(codeInput, '123456');

            const enableButton = screen.getByText(/verify and enable/i);
            await userEvent.click(enableButton);

            expect(enableButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });

        it('should show error when setup fails', async () => {
            vi.mocked(profileService.get2FASetup).mockRejectedValue(new Error('Network error'));
            renderTwoFactorSection();

            const setupButton = await screen.findByText(/authenticator app/i);
            await userEvent.click(setupButton);

            expect(await screen.findByText('Failed to load 2FA setup')).toBeInTheDocument();
        });
    });

    describe('Email 2FA Setup', () => {
        it('should open email modal when clicked', async () => {
            renderTwoFactorSection();

            const emailButton = await screen.findByText(/email/i);
            await userEvent.click(emailButton);

            expect(await screen.findByText(/set up email/i)).toBeInTheDocument();
        });

        it('should send code when send clicked', async () => {
            vi.mocked(profileService.setupEmail2FA).mockResolvedValue(mockAxiosResponse({}));
            renderTwoFactorSection();

            const emailButton = await screen.findByText(/email/i);
            await userEvent.click(emailButton);

            const sendButton = await screen.findByText(/send code/i);
            await userEvent.click(sendButton);

            await waitFor(() => {
                expect(vi.mocked(profileService.setupEmail2FA)).toHaveBeenCalled();
            });
        });

        it('should disable send button while sending', async () => {
            vi.mocked(profileService.setupEmail2FA).mockImplementation(() => new Promise(() => { }));
            renderTwoFactorSection();

            const emailButton = await screen.findByText(/email/i);
            await userEvent.click(emailButton);

            const sendButton = await screen.findByText(/send code/i);
            await userEvent.click(sendButton);

            expect(sendButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });

        it('should show code input after code sent', async () => {
            vi.mocked(profileService.setupEmail2FA).mockResolvedValue(mockAxiosResponse({}));
            renderTwoFactorSection();

            const emailButton = await screen.findByText(/email/i);
            await userEvent.click(emailButton);

            const sendButton = await screen.findByText(/send code/i);
            await userEvent.click(sendButton);

            expect(await screen.findByPlaceholderText('000000')).toBeInTheDocument();
        });

        it('should verify email 2FA with code', async () => {
            vi.mocked(profileService.setupEmail2FA).mockResolvedValue(mockAxiosResponse({}));
            vi.mocked(profileService.verifyEmail2FA).mockResolvedValue(mockAxiosResponse({}));
            renderTwoFactorSection();

            const emailButton = await screen.findByText(/email/i);
            await userEvent.click(emailButton);

            const sendButton = await screen.findByText(/send code/i);
            await userEvent.click(sendButton);

            const codeInput = await screen.findByPlaceholderText('000000');
            await userEvent.type(codeInput, '123456');

            const verifyButton = screen.getByText(/verify and enable/i);
            await userEvent.click(verifyButton);

            await waitFor(() => {
                expect(vi.mocked(profileService.verifyEmail2FA)).toHaveBeenCalledWith('123456');
            });
        });

        it('should disable verify button while verifying', async () => {
            vi.mocked(profileService.setupEmail2FA).mockResolvedValue(mockAxiosResponse({}));
            vi.mocked(profileService.verifyEmail2FA).mockImplementation(() => new Promise(() => { }));
            renderTwoFactorSection();

            const emailButton = await screen.findByText(/email/i);
            await userEvent.click(emailButton);

            const sendButton = await screen.findByText(/send code/i);
            await userEvent.click(sendButton);

            const codeInput = await screen.findByPlaceholderText('000000');
            await userEvent.type(codeInput, '123456');

            const verifyButton = screen.getByText(/verify and enable/i);
            await userEvent.click(verifyButton);

            expect(verifyButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });
    });

    describe('Disable 2FA', () => {
        it('should open disable modal when clicked', async () => {
            vi.mocked(profileService.get2FAInfo).mockResolvedValue(mockAxiosResponse({ isEnabled: true, method: 'app' }));
            renderTwoFactorSection();

            const disableButton = await screen.findByRole('button', { name: /disable 2fa/i });
            await userEvent.click(disableButton);

            expect(await screen.findByRole('heading', { name: /disable 2fa/i })).toBeInTheDocument();
        });

        it('should disable 2FA with code', async () => {
            vi.mocked(profileService.get2FAInfo).mockResolvedValue(mockAxiosResponse({ isEnabled: true, method: 'app' }));
            vi.mocked(profileService.disable2FA).mockResolvedValue(mockAxiosResponse({}));
            renderTwoFactorSection();

            const disableButton = await screen.findByRole('button', { name: /disable 2fa/i });
            await userEvent.click(disableButton);

            const codeInput = await screen.findByPlaceholderText('000000');
            await userEvent.type(codeInput, '123456');

            const confirmButton = screen.getAllByRole('button', { name: /disable 2fa/i })[1];
            await userEvent.click(confirmButton);

            await waitFor(() => {
                expect(vi.mocked(profileService.disable2FA)).toHaveBeenCalledWith('123456');
            });
        });

        it('should disable button while disabling', async () => {
            vi.mocked(profileService.get2FAInfo).mockResolvedValue(mockAxiosResponse({ isEnabled: true, method: 'app' }));
            vi.mocked(profileService.disable2FA).mockImplementation(() => new Promise(() => { }));
            renderTwoFactorSection();

            const disableButton = await screen.findByRole('button', { name: /disable 2fa/i });
            await userEvent.click(disableButton);

            const codeInput = await screen.findByPlaceholderText('000000');
            await userEvent.type(codeInput, '123456');

            const confirmButton = screen.getAllByRole('button', { name: /disable 2fa/i })[1];
            await userEvent.click(confirmButton);

            expect(confirmButton).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });

        it('should send disable code for email method', async () => {
            vi.mocked(profileService.get2FAInfo).mockResolvedValue(mockAxiosResponse({ isEnabled: true, method: 'email' }));
            vi.mocked(profileService.sendDisable2FACode).mockResolvedValue(mockAxiosResponse({}));
            renderTwoFactorSection();

            const disableButton = await screen.findByRole('button', { name: /disable 2fa/i });
            await userEvent.click(disableButton);

            const sendButton = await screen.findByText(/send code/i);
            await userEvent.click(sendButton);

            await waitFor(() => {
                expect(vi.mocked(profileService.sendDisable2FACode)).toHaveBeenCalled();
            });
        });

        it('should show error when disable fails', async () => {
            vi.mocked(profileService.get2FAInfo).mockResolvedValue(mockAxiosResponse({ isEnabled: true, method: 'app' }));
            vi.mocked(profileService.disable2FA).mockRejectedValue({
                response: { data: { error: 'Disable failed' } },
            });
            renderTwoFactorSection();

            const disableButton = await screen.findByRole('button', { name: /disable 2fa/i });
            await userEvent.click(disableButton);

            const codeInput = await screen.findByPlaceholderText('000000');
            await userEvent.type(codeInput, '123456');

            const confirmButton = screen.getAllByRole('button', { name: /disable 2fa/i })[1];
            await userEvent.click(confirmButton);

            expect(await screen.findAllByText('Disable failed')).toHaveLength(2);
        });
    });
});