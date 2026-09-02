import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Wishlist } from '../../pages/Wishlist';
import { LanguageProvider } from '../../context/LanguageContext';
import { wishlistService } from '../../services/wishlist.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../../services/wishlist.service', () => ({
    wishlistService: {
        getWishlist: vi.fn(),
        removeFromWishlist: vi.fn(),
        clearWishlist: vi.fn(),
    },
}));

vi.mock('../../components/LoadingSpinner', () => ({
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

const mockWishlistItems = [
    {
        id: 1,
        productId: 1,
        productName: 'Product 1',
        nameTranslations: { en: 'Product 1' },
        price: 100,
        stockQuantity: 10,
        mainImageId: 1,
    },
    {
        id: 2,
        productId: 2,
        productName: 'Product 2',
        nameTranslations: { en: 'Product 2' },
        price: 200,
        stockQuantity: 0,
        mainImageId: null,
    },
];

describe('Wishlist', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        vi.clearAllMocks();
        vi.mocked(wishlistService.getWishlist).mockResolvedValue(mockAxiosResponse(mockWishlistItems));
    });

    const renderWishlist = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <Wishlist />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    describe('Loading and Error States', () => {
        it('should show loading spinner while wishlist loads', () => {
            vi.mocked(wishlistService.getWishlist).mockImplementation(() => new Promise(() => { }));
            renderWishlist();
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });

        it('should show error when wishlist fails to load', async () => {
            vi.mocked(wishlistService.getWishlist).mockRejectedValue(new Error('Network error'));
            renderWishlist();
            expect(await screen.findByText('Failed to load wishlist')).toBeInTheDocument();
        });
    });

    describe('Display', () => {
        it('should show wishlist title', async () => {
            renderWishlist();
            expect(await screen.findByRole('heading', { name: /wishlist/i })).toBeInTheDocument();
        });

        it('should display all wishlist items', async () => {
            renderWishlist();
            expect(await screen.findByText('Product 1')).toBeInTheDocument();
            expect(screen.getByText('Product 2')).toBeInTheDocument();
        });

        it('should display product prices', async () => {
            renderWishlist();
            expect(await screen.findByText('$100.00')).toBeInTheDocument();
            expect(screen.getByText('$200.00')).toBeInTheDocument();
        });

        it('should show in stock for available items', async () => {
            renderWishlist();
            expect(await screen.findByText(/10.*in stock/i)).toBeInTheDocument();
        });

        it('should show out of stock for unavailable items', async () => {
            renderWishlist();
            expect(await screen.findByText(/out of stock/i)).toBeInTheDocument();
        });

        it('should show empty wishlist message', async () => {
            vi.mocked(wishlistService.getWishlist).mockResolvedValue(mockAxiosResponse([]));
            renderWishlist();
            expect(await screen.findByText(/empty/i)).toBeInTheDocument();
            expect(screen.getByText(/start shopping/i)).toBeInTheDocument();
        });

        it('should show clear button', async () => {
            renderWishlist();
            expect(await screen.findByRole('button', { name: /clear wishlist/i })).toBeInTheDocument();
        });
    });

    describe('Remove Item', () => {
        it('should call removeFromWishlist when remove clicked', async () => {
            vi.mocked(wishlistService.removeFromWishlist).mockResolvedValue(mockAxiosResponse({}));
            renderWishlist();

            const removeButtons = await screen.findAllByText(/remove/i);
            await userEvent.click(removeButtons[0]);

            await waitFor(() => {
                expect(vi.mocked(wishlistService.removeFromWishlist)).toHaveBeenCalledWith(1);
            });
        });

        it('should disable button while removing', async () => {
            vi.mocked(wishlistService.removeFromWishlist).mockImplementation(() => new Promise(() => { }));
            renderWishlist();

            const removeButtons = await screen.findAllByText(/remove/i);
            await userEvent.click(removeButtons[0]);

            expect(removeButtons[0]).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });

        it('should show error when remove fails', async () => {
            vi.mocked(wishlistService.removeFromWishlist).mockRejectedValue({
                response: { data: { error: 'Remove failed' } },
            });
            renderWishlist();

            const removeButtons = await screen.findAllByText(/remove/i);
            await userEvent.click(removeButtons[0]);

            expect(await screen.findByText('Remove failed')).toBeInTheDocument();
        });
    });

    describe('Clear Wishlist', () => {
        it('should show confirmation modal when clear clicked', async () => {
            renderWishlist();

            const clearButton = await screen.findByRole('button', { name: /clear wishlist/i });
            await userEvent.click(clearButton);

            expect(await screen.findByText(/are you sure/i)).toBeInTheDocument();
        });

        it('should call clearWishlist when confirmed', async () => {
            vi.mocked(wishlistService.clearWishlist).mockResolvedValue(mockAxiosResponse({}));
            renderWishlist();

            const clearButton = await screen.findByRole('button', { name: /clear wishlist/i });
            await userEvent.click(clearButton);

            const confirmButtons = screen.getAllByRole('button', { name: /clear wishlist/i });
            await userEvent.click(confirmButtons[1]);

            await waitFor(() => {
                expect(vi.mocked(wishlistService.clearWishlist)).toHaveBeenCalled();
            });
        });

        it('should disable clear button while clearing', async () => {
            vi.mocked(wishlistService.clearWishlist).mockImplementation(() => new Promise(() => { }));
            renderWishlist();

            const clearButton = await screen.findByRole('button', { name: /clear wishlist/i });
            await userEvent.click(clearButton);

            const confirmButtons = screen.getAllByRole('button', { name: /clear wishlist/i });
            await userEvent.click(confirmButtons[1]);

            expect(confirmButtons[1]).toBeDisabled();
            expect(screen.getByText('...')).toBeInTheDocument();
        });

        it('should close modal when cancel clicked', async () => {
            renderWishlist();

            const clearButton = await screen.findByRole('button', { name: /clear wishlist/i });
            await userEvent.click(clearButton);

            const cancelButton = await screen.findByText(/cancel/i);
            await userEvent.click(cancelButton);

            expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
        });

        it('should show error when clear fails', async () => {
            vi.mocked(wishlistService.clearWishlist).mockRejectedValue({
                response: { data: { error: 'Clear failed' } },
            });
            renderWishlist();

            const clearButton = await screen.findByRole('button', { name: /clear wishlist/i });
            await userEvent.click(clearButton);

            const confirmButtons = screen.getAllByRole('button', { name: /clear wishlist/i });
            await userEvent.click(confirmButtons[1]);

            expect(await screen.findByText('Clear failed')).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('should have link to product page', async () => {
            renderWishlist();
            const productLink = await screen.findByRole('link', { name: /product 1/i });
            expect(productLink).toHaveAttribute('href', '/products/1');
        });

        it('should have logo link to home', async () => {
            renderWishlist();
            const logoLink = await screen.findByText('CheyenneShop');
            expect(logoLink).toHaveAttribute('href', '/');
        });
    });
});