import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { AuthProvider } from '../../context/AuthContext';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        Navigate: ({ to }: any) => <div data-testid="navigate">{to}</div>,
    };
});

const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxMjM0NTY3OCIsInJvbGUiOiJDdXN0b21lciIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.fakeSignature';

const mockAdminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiI4NzY1NDMyMSIsInJvbGUiOiJBZG1pbiIsImVtYWlsIjoiYWRtaW5AdGVzdC5jb20ifQ.fakeSignature';

describe('ProtectedRoute', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    const renderProtectedRoute = (requireAdmin = false) => {
        return render(
            <AuthProvider>
                <MemoryRouter>
                    <ProtectedRoute requireAdmin={requireAdmin}>
                        <div>Protected Content</div>
                    </ProtectedRoute>
                </MemoryRouter>
            </AuthProvider>
        );
    };

    describe('Unauthenticated User', () => {
        it('should redirect to login', async () => {
            renderProtectedRoute();
            await screen.findByTestId('navigate');
            expect(screen.getByTestId('navigate')).toHaveTextContent('/login');
        });

        it('should not show protected content', async () => {
            renderProtectedRoute();
            await screen.findByTestId('navigate');
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        });
    });

    describe('Authenticated User (Customer)', () => {
        beforeEach(() => {
            localStorage.setItem('accessToken', mockToken);
            localStorage.setItem('refreshToken', 'refresh-token');
        });

        it('should show protected content', async () => {
            renderProtectedRoute();
            await screen.findByText('Protected Content');
        });

        it('should not redirect to login', async () => {
            renderProtectedRoute();
            await screen.findByText('Protected Content');
            expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
        });

        it('should redirect to home when admin required', async () => {
            renderProtectedRoute(true);
            await screen.findByTestId('navigate');
            expect(screen.getByTestId('navigate')).toHaveTextContent('/');
        });

        it('should not show protected content when admin required', async () => {
            renderProtectedRoute(true);
            await screen.findByTestId('navigate');
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        });
    });

    describe('Authenticated User (Admin)', () => {
        beforeEach(() => {
            localStorage.setItem('accessToken', mockAdminToken);
            localStorage.setItem('refreshToken', 'refresh-token');
        });

        it('should show protected content', async () => {
            renderProtectedRoute();
            await screen.findByText('Protected Content');
        });

        it('should show protected content when admin required', async () => {
            renderProtectedRoute(true);
            await screen.findByText('Protected Content');
        });

        it('should not redirect', async () => {
            renderProtectedRoute(true);
            await screen.findByText('Protected Content');
            expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
        });
    });
});