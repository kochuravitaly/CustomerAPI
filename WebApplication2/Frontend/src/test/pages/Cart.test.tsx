import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Cart } from '../../pages/Cart';
import { LanguageProvider } from '../../context/LanguageContext';
import { cartService } from '../../services/cart.service';
import { flashSaleService } from '../../services/coupon.service';
import { orderService } from '../../services/order.service';
import { paymentService } from '../../services/payment.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../../services/cart.service', () => ({
    cartService: {
        getCart: vi.fn(),
        updateItem: vi.fn(),
        removeItem: vi.fn(),
        clearCart: vi.fn(),
    },
}));

vi.mock('../../services/coupon.service', () => ({
    flashSaleService: {
        getActive: vi.fn(),
    },
}));

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

describe('Cart', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        localStorage.clear();
        vi.clearAllMocks();
    });

    const renderCart = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <Cart />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    it('should show empty cart message when cart is empty', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse({ cartItems: [], total: 0 }));

        renderCart();

        expect(await screen.findByText(/empty/i)).toBeInTheDocument();
        expect(screen.getByText(/start shopping/i)).toBeInTheDocument();
    });

    it('should show loading spinner when cart is loading', () => {
        vi.mocked(cartService.getCart).mockImplementation(() => new Promise(() => { }));

        renderCart();

        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should display cart items with details', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));
        vi.mocked(flashSaleService.getActive).mockResolvedValue(mockAxiosResponse([]));

        renderCart();

        expect(await screen.findByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText('$100.00 each')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('$200.00', { selector: '.cart-item-total' })).toBeInTheDocument();
        expect(screen.getByText('$200.00', { selector: 'strong' })).toBeInTheDocument();
    });

    it('should update quantity when plus button clicked', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));
        vi.mocked(flashSaleService.getActive).mockResolvedValue(mockAxiosResponse([]));
        vi.mocked(cartService.updateItem).mockResolvedValue(mockAxiosResponse({}));

        renderCart();

        const plusButton = await screen.findByText('+');
        await userEvent.click(plusButton);

        await waitFor(() => {
            expect(vi.mocked(cartService.updateItem)).toHaveBeenCalledWith(1, { quantity: 3 });
        });
    });

    it('should not allow quantity below 1', async () => {
        const singleItemCart = {
            cartItems: [{ productId: 1, productName: 'Test Product', unitPrice: 100, quantity: 1, total: 100 }],
            total: 100,
        };

        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(singleItemCart));
        vi.mocked(flashSaleService.getActive).mockResolvedValue(mockAxiosResponse([]));

        renderCart();

        const minusButton = await screen.findByText('−');
        expect(minusButton).toBeDisabled();
    });

    it('should remove item when remove button clicked', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));
        vi.mocked(flashSaleService.getActive).mockResolvedValue(mockAxiosResponse([]));
        vi.mocked(cartService.removeItem).mockResolvedValue(mockAxiosResponse({}));

        renderCart();

        const removeButton = await screen.findByText(/remove/i);
        await userEvent.click(removeButton);

        await waitFor(() => {
            expect(vi.mocked(cartService.removeItem)).toHaveBeenCalledWith(1);
        });
    });

    it('should clear cart when clear button clicked', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));
        vi.mocked(flashSaleService.getActive).mockResolvedValue(mockAxiosResponse([]));
        vi.mocked(cartService.clearCart).mockResolvedValue(mockAxiosResponse({}));

        renderCart();

        const clearButton = await screen.findByText(/clear/i);
        await userEvent.click(clearButton);

        await waitFor(() => {
            expect(vi.mocked(cartService.clearCart)).toHaveBeenCalled();
        });
    });

    it('should process checkout when checkout button clicked', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));
        vi.mocked(flashSaleService.getActive).mockResolvedValue(mockAxiosResponse([]));
        vi.mocked(orderService.create).mockResolvedValue(mockAxiosResponse({ id: 'order123' }));
        vi.mocked(paymentService.create).mockResolvedValue(mockAxiosResponse({ paymentUrl: 'http://payment.com' }));

        const originalLocation = window.location;
        Object.defineProperty(window, 'location', {
            value: { href: '' },
            writable: true,
        });

        renderCart();

        const checkoutButton = await screen.findByText(/checkout/i);
        await userEvent.click(checkoutButton);

        await waitFor(() => {
            expect(vi.mocked(orderService.create)).toHaveBeenCalled();
            expect(vi.mocked(paymentService.create)).toHaveBeenCalledWith({ orderId: 'order123' });
        });

        Object.defineProperty(window, 'location', {
            value: originalLocation,
            writable: true,
        });
    });

    it('should show error when checkout fails', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));
        vi.mocked(flashSaleService.getActive).mockResolvedValue(mockAxiosResponse([]));
        vi.mocked(orderService.create).mockRejectedValue({
            response: { data: 'Failed to process checkout' },
        });

        renderCart();

        const checkoutButton = await screen.findByText(/checkout/i);
        await userEvent.click(checkoutButton);

        expect(await screen.findByText('Failed to process checkout')).toBeInTheDocument();
    });

    it('should show error when update fails', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));
        vi.mocked(flashSaleService.getActive).mockResolvedValue(mockAxiosResponse([]));
        vi.mocked(cartService.updateItem).mockRejectedValue({
            response: { data: 'Failed to update item' },
        });

        renderCart();

        const plusButton = await screen.findByText('+');
        await userEvent.click(plusButton);

        expect(await screen.findByText('Failed to update item')).toBeInTheDocument();
    });

    it('should show error when remove fails', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));
        vi.mocked(flashSaleService.getActive).mockResolvedValue(mockAxiosResponse([]));
        vi.mocked(cartService.removeItem).mockRejectedValue({
            response: { data: 'Failed to remove item' },
        });

        renderCart();

        const removeButton = await screen.findByText(/remove/i);
        await userEvent.click(removeButton);

        expect(await screen.findByText('Failed to remove item')).toBeInTheDocument();
    });

    it('should show error when clear fails', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));
        vi.mocked(flashSaleService.getActive).mockResolvedValue(mockAxiosResponse([]));
        vi.mocked(cartService.clearCart).mockRejectedValue({
            response: { data: 'Failed to clear cart' },
        });

        renderCart();

        const clearButton = await screen.findByText(/clear/i);
        await userEvent.click(clearButton);

        expect(await screen.findByText('Failed to clear cart')).toBeInTheDocument();
    });

    it('should apply flash sale discount when applicable', async () => {
        const flashSale = [{
            id: 1,
            discountPercentage: 20,
            productIdsJson: '[1]',
            endsAt: new Date(Date.now() + 3600000).toISOString(),
        }];

        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));
        vi.mocked(flashSaleService.getActive).mockResolvedValue(mockAxiosResponse(flashSale));

        renderCart();

        expect(await screen.findByText('$80.00 each (-20%)')).toBeInTheDocument();
    });

    it('should apply coupon discount when applicable', async () => {
        localStorage.setItem('coupon_1', JSON.stringify({ code: 'SAVE10', discount: 10 }));

        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));
        vi.mocked(flashSaleService.getActive).mockResolvedValue(mockAxiosResponse([]));

        renderCart();

        expect(await screen.findByText(/Coupon SAVE10: -\$10.00/)).toBeInTheDocument();
    });

    it('should disable buttons while mutations are pending', async () => {
        vi.mocked(cartService.getCart).mockResolvedValue(mockAxiosResponse(mockCart));
        vi.mocked(flashSaleService.getActive).mockResolvedValue(mockAxiosResponse([]));
        vi.mocked(cartService.updateItem).mockImplementation(() => new Promise(() => { }));

        renderCart();

        const plusButton = await screen.findByText('+');
        await userEvent.click(plusButton);

        expect(plusButton).toBeDisabled();
    });
});