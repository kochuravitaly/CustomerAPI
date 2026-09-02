import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomNav } from '../../components/BottomNav';
import { AuthProvider } from '../../context/AuthContext';
import { LanguageProvider } from '../../context/LanguageContext';
import { cartService } from '../../services/cart.service';
import { wishlistService } from '../../services/wishlist.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
        useLocation: vi.fn(() => ({ pathname: '/' })),
    };
});

vi.mock('../../services/cart.service', () => ({
    cartService: {
        getCart: vi.fn(),
    },
}));

vi.mock('../../services/wishlist.service', () => ({
    wishlistService: {
        getWishlist: vi.fn(),
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

const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIxMjM0NTY3OCIsInJvbGUiOiJDdXN0b21lciIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.fakeSignature';

const mockAdminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiI4NzY1NDMyMSIsInJvbGUiOiJBZG1pbiIsImVtYWlsIjoiYWRtaW5AdGVzdC5jb20ifQ.fakeSignature';

const mockCart = {
    cartItems: [
        { productId: 1, productName: 'Product 1', unitPrice: 100, quantity: 3, total: 300 },
    ],
    total: 300,
};

const mockWishlist = [
    { id: 1, productId: 1, productName: 'Product 1', price: 100, stockQuantity: 10, addedAt: '2024-01-01T00:00:00Z' },
    { id: 2, productId: 2, productName: 'Product 2', price: 200, stockQuantity: 5, addedAt: '2024-01-02T00:00:00Z' },
];

describe('BottomNav', () => {
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
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));
        vi.mocked(wishlistService.getWishlist).mockResolvedValue(mockAxiosResponse(mockWishlist));
    });

    const renderBottomNav = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <AuthProvider>
                        <MemoryRouter>
                            <BottomNav />
                        </MemoryRouter>
                    </AuthProvider>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Unauthenticated User', () => {
        it('should show home link', () => {
            renderBottomNav();
            expect(screen.getByText(/home/i)).toBeInTheDocument();
        });

        it('should show categories link', () => {
            renderBottomNav();
            expect(screen.getByText(/categories/i)).toBeInTheDocument();
        });

        it('should not show wishlist link', () => {
            renderBottomNav();
            expect(screen.queryByText(/wishlist/i)).not.toBeInTheDocument();
        });

        it('should show cart link', () => {
            renderBottomNav();
            expect(screen.getByText(/cart/i)).toBeInTheDocument();
        });

        it('should show account link pointing to login', () => {
            renderBottomNav();
            const accountLink = screen.getByText(/account/i).closest('a');
            expect(accountLink).toHaveAttribute('href', '/login');
        });

        it('should not show admin link', () => {
            renderBottomNav();
            expect(screen.queryByText(/admin/i)).not.toBeInTheDocument();
        });

        it('should navigate to login when cart clicked', async () => {
            renderBottomNav();
            const cartLink = screen.getByText(/cart/i).closest('a');
            await userEvent.click(cartLink!);
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
    });

    describe('Authenticated User', () => {
        beforeEach(() => {
            localStorage.setItem('accessToken', mockToken);
            localStorage.setItem('refreshToken', 'refresh-token');
        });

        it('should show wishlist link', async () => {
            renderBottomNav();
            expect(await screen.findByText(/wishlist/i)).toBeInTheDocument();
        });

        it('should show wishlist count badge', async () => {
            renderBottomNav();
            await waitFor(() => {
                expect(screen.getByText('2')).toBeInTheDocument();
            });
        });

        it('should show cart count badge', async () => {
            renderBottomNav();
            await waitFor(() => {
                expect(screen.getByText('3')).toBeInTheDocument();
            });
        });

        it('should show account link pointing to profile', () => {
            renderBottomNav();
            const accountLink = screen.getByText(/account/i).closest('a');
            expect(accountLink).toHaveAttribute('href', '/profile');
        });

        it('should navigate to cart when cart clicked', async () => {
            renderBottomNav();
            const cartLink = screen.getByText(/cart/i).closest('a');
            await userEvent.click(cartLink!);
            expect(mockNavigate).toHaveBeenCalledWith('/cart');
        });

        it('should not show admin link for non-admin', () => {
            renderBottomNav();
            expect(screen.queryByText(/admin/i)).not.toBeInTheDocument();
        });
    });

    describe('Admin User', () => {
        beforeEach(() => {
            localStorage.setItem('accessToken', mockAdminToken);
            localStorage.setItem('refreshToken', 'refresh-token');
        });

        it('should show admin link', async () => {
            renderBottomNav();
            expect(await screen.findByText(/admin/i)).toBeInTheDocument();
        });
    });

    describe('No Cart Items', () => {
        beforeEach(() => {
            localStorage.setItem('accessToken', mockToken);
            localStorage.setItem('refreshToken', 'refresh-token');
            vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse({ cartItems: [], total: 0 }));
            vi.mocked(wishlistService.getWishlist).mockResolvedValue(mockAxiosResponse([]));
        });

        it('should not show cart count badge when empty', async () => {
            renderBottomNav();
            await waitFor(() => {
                expect(screen.queryByText('0')).not.toBeInTheDocument();
            });
        });

        it('should not show wishlist count badge when empty', async () => {
            renderBottomNav();
            await waitFor(() => {
                expect(screen.queryByText(/wishlist/i)).toBeInTheDocument();
            });
        });
    });
});