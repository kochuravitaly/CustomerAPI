import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';
import { accountService } from '../../services/account.service';
import { jwtDecode } from 'jwt-decode';

vi.mock('../../services/auth.service', () => ({
    authService: {
        login: vi.fn(),
        verify2FA: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
    },
}));

vi.mock('../../services/account.service', () => ({
    accountService: {
        switchAccount: vi.fn(),
    },
}));

vi.mock('jwt-decode', () => ({
    jwtDecode: vi.fn(),
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

const mockToken = 'mock-token';

const mockDecodedUser = {
    nameid: '12345678',
    role: 'Customer',
    email: 'test@example.com',
};

const mockDecodedAdmin = {
    nameid: '87654321',
    role: 'Admin',
    email: 'admin@test.com',
};

const TestComponent = () => {
    const { user, isAuthenticated, isAdmin } = useAuth();
    return (
        <div>
            <div data-testid="user">{user?.id || 'no-user'}</div>
            <div data-testid="role">{user?.role || 'no-role'}</div>
            <div data-testid="isAuthenticated">{isAuthenticated ? 'true' : 'false'}</div>
            <div data-testid="isAdmin">{isAdmin ? 'true' : 'false'}</div>
        </div>
    );
};

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    const renderAuth = () => {
        return render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );
    };

    describe('Initial State', () => {
        it('should have no user when no token', async () => {
            renderAuth();
            await waitFor(() => {
                expect(screen.getByTestId('user')).toHaveTextContent('no-user');
                expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
            });
        });

        it('should restore user from token', async () => {
            vi.mocked(jwtDecode).mockReturnValue(mockDecodedUser);
            localStorage.setItem('accessToken', mockToken);

            renderAuth();

            await waitFor(() => {
                expect(screen.getByTestId('user')).toHaveTextContent('12345678');
                expect(screen.getByTestId('role')).toHaveTextContent('Customer');
                expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
                expect(screen.getByTestId('isAdmin')).toHaveTextContent('false');
            });
        });

        it('should restore admin user from token', async () => {
            vi.mocked(jwtDecode).mockReturnValue(mockDecodedAdmin);
            localStorage.setItem('accessToken', mockToken);

            renderAuth();

            await waitFor(() => {
                expect(screen.getByTestId('role')).toHaveTextContent('Admin');
                expect(screen.getByTestId('isAdmin')).toHaveTextContent('true');
            });
        });

        it('should clear invalid token', async () => {
            vi.mocked(jwtDecode).mockImplementation(() => {
                throw new Error('Invalid token');
            });
            localStorage.setItem('accessToken', 'invalid-token');
            localStorage.setItem('refreshToken', 'refresh');

            renderAuth();

            await waitFor(() => {
                expect(screen.getByTestId('user')).toHaveTextContent('no-user');
                expect(localStorage.getItem('accessToken')).toBeNull();
                expect(localStorage.getItem('refreshToken')).toBeNull();
            });
        });
    });

    describe('Login', () => {
        it('should login and set user', async () => {
            vi.mocked(jwtDecode).mockReturnValue(mockDecodedUser);
            vi.mocked(authService.login).mockResolvedValue(mockAxiosResponse({
                token: mockToken,
                refreshToken: 'refresh-token',
            }));

            const TestLogin = () => {
                const { login } = useAuth();
                return <button onClick={() => login({ email: 'test@example.com', password: 'password123' })}>Login</button>;
            };

            render(
                <AuthProvider>
                    <TestLogin />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
            });

            await userEvent.click(screen.getByText('Login'));

            await waitFor(() => {
                expect(localStorage.getItem('accessToken')).toBe(mockToken);
                expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
            });
        });

        it('should return requiresTwoFactor when 2FA needed', async () => {
            vi.mocked(authService.login).mockResolvedValue(mockAxiosResponse({
                requiresTwoFactor: true,
                customerId: 'customer-123',
                twoFactorMethod: 'app',
            }));

            let result: any;
            const TestLogin = () => {
                const { login } = useAuth();
                return <button onClick={async () => { result = await login({ email: 'test@example.com', password: 'password123' }); }}>Login</button>;
            };

            render(
                <AuthProvider>
                    <TestLogin />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
            });

            await userEvent.click(screen.getByText('Login'));

            await waitFor(() => {
                expect(result).toEqual({
                    requiresTwoFactor: true,
                    customerId: 'customer-123',
                    twoFactorMethod: 'app',
                });
            });
        });

        it('should throw error when token missing', async () => {
            vi.mocked(authService.login).mockResolvedValue(mockAxiosResponse({}));

            const TestLogin = () => {
                const { login } = useAuth();
                return <button onClick={async () => {
                    try {
                        await login({ email: 'test@example.com', password: 'password123' });
                    } catch (e) {
                        // expected error
                    }
                }}>Login</button>;
            };

            render(
                <AuthProvider>
                    <TestLogin />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
            });

            await userEvent.click(screen.getByText('Login'));

            await waitFor(() => {
                expect(localStorage.getItem('accessToken')).toBeNull();
            });
        });
    });

    describe('Verify 2FA', () => {
        it('should verify 2FA and set user', async () => {
            vi.mocked(jwtDecode).mockReturnValue(mockDecodedUser);
            vi.mocked(authService.verify2FA).mockResolvedValue(mockAxiosResponse({
                token: mockToken,
                refreshToken: 'refresh-token',
            }));

            const TestVerify = () => {
                const { verify2FA } = useAuth();
                return <button onClick={() => verify2FA('customer-123', '123456')}>Verify</button>;
            };

            render(
                <AuthProvider>
                    <TestVerify />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
            });

            await userEvent.click(screen.getByText('Verify'));

            await waitFor(() => {
                expect(vi.mocked(authService.verify2FA)).toHaveBeenCalledWith({
                    customerId: 'customer-123',
                    code: '123456',
                });
                expect(localStorage.getItem('accessToken')).toBe(mockToken);
            });
        });

        it('should throw error when token missing', async () => {
            vi.mocked(authService.verify2FA).mockResolvedValue(mockAxiosResponse({}));

            const TestVerify = () => {
                const { verify2FA } = useAuth();
                return <button onClick={async () => {
                    try {
                        await verify2FA('customer-123', '123456');
                    } catch (e) {
                        // expected error
                    }
                }}>Verify</button>;
            };

            render(
                <AuthProvider>
                    <TestVerify />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
            });

            await userEvent.click(screen.getByText('Verify'));

            await waitFor(() => {
                expect(localStorage.getItem('accessToken')).toBeNull();
            });
        });
    });

    describe('Switch Account', () => {
        it('should switch account and update user', async () => {
            vi.mocked(jwtDecode).mockReturnValue(mockDecodedAdmin);
            vi.mocked(accountService.switchAccount).mockResolvedValue(mockAxiosResponse({
                token: mockToken,
                refreshToken: 'new-refresh',
            }));

            const TestSwitch = () => {
                const { switchAccount } = useAuth();
                return <button onClick={() => switchAccount('admin-id')}>Switch</button>;
            };

            render(
                <AuthProvider>
                    <TestSwitch />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
            });

            await userEvent.click(screen.getByText('Switch'));

            await waitFor(() => {
                expect(localStorage.getItem('accessToken')).toBe(mockToken);
                expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
            });
        });

        it('should throw error when token missing', async () => {
            vi.mocked(accountService.switchAccount).mockResolvedValue(mockAxiosResponse({}));

            const TestSwitch = () => {
                const { switchAccount } = useAuth();
                return <button onClick={async () => {
                    try {
                        await switchAccount('admin-id');
                    } catch (e) {
                        // expected error
                    }
                }}>Switch</button>;
            };

            render(
                <AuthProvider>
                    <TestSwitch />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
            });

            await userEvent.click(screen.getByText('Switch'));

            await waitFor(() => {
                expect(localStorage.getItem('accessToken')).toBeNull();
            });
        });
    });

    describe('Register', () => {
        it('should call register service', async () => {
            vi.mocked(authService.register).mockResolvedValue(mockAxiosResponse({}));

            const TestRegister = () => {
                const { register } = useAuth();
                return <button onClick={() => register({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                    confirmPassword: 'password123',
                })}>Register</button>;
            };

            render(
                <AuthProvider>
                    <TestRegister />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
            });

            await userEvent.click(screen.getByText('Register'));

            await waitFor(() => {
                expect(vi.mocked(authService.register)).toHaveBeenCalledWith({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123',
                    confirmPassword: 'password123',
                });
            });
        });
    });

    describe('Logout', () => {
        it('should logout and clear user', async () => {
            vi.mocked(jwtDecode).mockReturnValue(mockDecodedUser);
            localStorage.setItem('accessToken', mockToken);
            localStorage.setItem('refreshToken', 'refresh-token');
            vi.mocked(authService.logout).mockResolvedValue(mockAxiosResponse({}));

            const originalLocation = window.location;
            Object.defineProperty(window, 'location', {
                value: { href: '' },
                writable: true,
            });

            const TestLogout = () => {
                const { logout } = useAuth();
                return <button onClick={() => logout()}>Logout</button>;
            };

            render(
                <AuthProvider>
                    <TestLogout />
                </AuthProvider>
            );

            await waitFor(() => {
                expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
            });

            await userEvent.click(screen.getByText('Logout'));

            await waitFor(() => {
                expect(localStorage.getItem('accessToken')).toBeNull();
                expect(localStorage.getItem('refreshToken')).toBeNull();
            });

            Object.defineProperty(window, 'location', {
                value: originalLocation,
                writable: true,
            });
        });
    });
});