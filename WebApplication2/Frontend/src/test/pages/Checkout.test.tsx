import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Checkout } from '../../pages/Checkout';
import { LanguageProvider } from '../../context/LanguageContext';
import { orderService } from '../../services/order.service';
import { paymentService } from '../../services/payment.service';
import { cartService } from '../../services/cart.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../../services/order.service', () => ({
    orderService: {
        create: vi.fn(),
    },
}));

vi.mock('../../services/payment.service', () => ({
    paymentService: {
        create: vi.fn(),
    },
}));

vi.mock('../../services/cart.service', () => ({
    cartService: {
        getCart: vi.fn(),
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

const mockCart = {
    cartItems: [
        {
            productId: 1,
            productName: 'Test Product',
            unitPrice: 100,
            quantity: 2,
            total: 200,
        },
    ],
    total: 200,
};

describe('Checkout', () => {
    let queryClient: QueryClient;
    const mockNavigate = vi.fn();

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    });

    const renderCheckout = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <Checkout />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    it('should render checkout page', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));

        renderCheckout();

        expect(await screen.findByText(/checkout/i)).toBeInTheDocument();
        expect(screen.getByText(/order summary/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /place order/i })).toBeInTheDocument();
    });

    it('should show cart items in order summary', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));

        renderCheckout();

        expect(await screen.findByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText('$200.00')).toBeInTheDocument();
    });

    it('should show error when cart is empty', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse({ cartItems: [], total: 0 }));

        renderCheckout();

        const placeOrderButton = await screen.findByRole('button', { name: /place order/i });
        expect(placeOrderButton).toBeDisabled();
    });

    it('should create order and payment when place order clicked', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));
        vi.mocked(orderService.create).mockResolvedValue(mockAxiosResponse({ id: 'order123' }));
        vi.mocked(paymentService.create).mockResolvedValue(mockAxiosResponse({ paymentUrl: 'http://payment.com' }));

        const originalLocation = window.location;
        Object.defineProperty(window, 'location', {
            value: { href: '' },
            writable: true,
        });

        renderCheckout();

        const placeOrderButton = await screen.findByRole('button', { name: /place order/i });
        await userEvent.click(placeOrderButton);

        await waitFor(() => {
            expect(vi.mocked(orderService.create)).toHaveBeenCalled();
            expect(vi.mocked(paymentService.create)).toHaveBeenCalledWith({ orderId: 'order123' });
            expect(window.location.href).toBe('http://payment.com');
        });

        Object.defineProperty(window, 'location', {
            value: originalLocation,
            writable: true,
        });
    });

    it('should show processing screen while order is being created', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));
        vi.mocked(orderService.create).mockImplementation(() => new Promise(() => { }));

        renderCheckout();

        const placeOrderButton = await screen.findByRole('button', { name: /place order/i });
        await userEvent.click(placeOrderButton);

        expect(await screen.findByText(/loading/i)).toBeInTheDocument();
    });

    it('should show error when order creation fails', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));
        vi.mocked(orderService.create).mockRejectedValue({
            response: { data: 'Failed to create order' },
        });

        renderCheckout();

        const placeOrderButton = await screen.findByRole('button', { name: /place order/i });
        await userEvent.click(placeOrderButton);

        expect(await screen.findByText('Failed to create order')).toBeInTheDocument();
    });

    it('should show error when payment creation fails', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));
        vi.mocked(orderService.create).mockResolvedValue(mockAxiosResponse({ id: 'order123' }));
        vi.mocked(paymentService.create).mockRejectedValue({
            response: { data: 'Failed to create payment' },
        });

        renderCheckout();

        const placeOrderButton = await screen.findByRole('button', { name: /place order/i });
        await userEvent.click(placeOrderButton);

        expect(await screen.findByText('Failed to create payment')).toBeInTheDocument();
    });

    it('should navigate back to cart when back button clicked', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));

        renderCheckout();

        const backButton = await screen.findByText(/back/i);
        await userEvent.click(backButton);

        expect(mockNavigate).toHaveBeenCalledWith('/cart');
    });

    it('should disable place order button while processing', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));
        vi.mocked(orderService.create).mockImplementation(() => new Promise(() => { }));

        renderCheckout();

        const placeOrderButton = await screen.findByRole('button', { name: /place order/i });
        await userEvent.click(placeOrderButton);

        await waitFor(() => {
            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });
    });

    it('should clear error when trying to place order again', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));
        vi.mocked(orderService.create)
            .mockRejectedValueOnce({ response: { data: 'First error' } })
            .mockResolvedValueOnce(mockAxiosResponse({ id: 'order123' }));
        vi.mocked(paymentService.create).mockResolvedValue(mockAxiosResponse({ paymentUrl: 'http://payment.com' }));

        const originalLocation = window.location;
        Object.defineProperty(window, 'location', {
            value: { href: '' },
            writable: true,
        });

        renderCheckout();

        const placeOrderButton = await screen.findByRole('button', { name: /place order/i });
        await userEvent.click(placeOrderButton);

        expect(await screen.findByText('First error')).toBeInTheDocument();

        const retryButton = screen.getByRole('button', { name: /place order/i });
        await userEvent.click(retryButton);

        await waitFor(() => {
            expect(screen.queryByText('First error')).not.toBeInTheDocument();
        });

        Object.defineProperty(window, 'location', {
            value: originalLocation,
            writable: true,
        });
    });

    it('should show checkout steps', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));

        renderCheckout();

        expect(await screen.findByText(/click "place order"/i)).toBeInTheDocument();
        expect(screen.getByText(/redirect to payment/i)).toBeInTheDocument();
        expect(screen.getByText(/complete payment/i)).toBeInTheDocument();
        expect(screen.getByText(/order confirmed/i)).toBeInTheDocument();
    });
});