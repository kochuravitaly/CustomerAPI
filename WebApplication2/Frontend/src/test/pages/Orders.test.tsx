import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Orders } from '../../pages/Orders';
import { LanguageProvider } from '../../context/LanguageContext';
import { orderService } from '../../services/order.service';
import { OrderStatus } from '../../types/order';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../../services/order.service', () => ({
    orderService: {
        getMyOrders: vi.fn(),
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

const mockOrders = [
    {
        id: '12345678-1234-1234-1234-123456789abc',
        totalAmount: 200,
        status: OrderStatus.Pending,
        createdAt: '2024-01-01T00:00:00Z',
        items: [
            {
                productId: 1,
                productName: 'Test Product',
                unitPrice: 100,
                quantity: 2,
                total: 200,
            },
        ],
    },
    {
        id: '87654321-4321-4321-4321-cba987654321',
        totalAmount: 300,
        status: OrderStatus.Delivered,
        createdAt: '2024-01-02T00:00:00Z',
        items: [
            {
                productId: 2,
                productName: 'Another Product',
                unitPrice: 150,
                quantity: 2,
                total: 300,
            },
        ],
    },
];

describe('Orders', () => {
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

    const renderOrders = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <Orders />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    it('should show loading spinner while orders load', () => {
        vi.mocked(orderService.getMyOrders).mockImplementation(() => new Promise(() => { }));

        renderOrders();

        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should show error when orders fail to load', async () => {
        vi.mocked(orderService.getMyOrders).mockRejectedValue(new Error('Network error'));

        renderOrders();

        expect(await screen.findByText('Failed to load orders')).toBeInTheDocument();
    });

    it('should show empty orders message when no orders', async () => {
        vi.mocked(orderService.getMyOrders).mockResolvedValue(mockAxiosResponse([]));

        renderOrders();

        expect(await screen.findByText(/no orders yet/i)).toBeInTheDocument();
        expect(screen.getByText(/start shopping/i)).toBeInTheDocument();
    });

    it('should display orders with details', async () => {
        vi.mocked(orderService.getMyOrders).mockResolvedValue(mockAxiosResponse(mockOrders));

        renderOrders();

        expect(await screen.findByText(/12345678/i)).toBeInTheDocument();
        expect(screen.getByText(/87654321/i)).toBeInTheDocument();
        expect(screen.getAllByText('$200.00')).toHaveLength(2);
        expect(screen.getAllByText('$300.00')).toHaveLength(2);
    });

    it('should display order items', async () => {
        vi.mocked(orderService.getMyOrders).mockResolvedValue(mockAxiosResponse(mockOrders));

        renderOrders();

        expect(await screen.findByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText('Another Product')).toBeInTheDocument();
        expect(screen.getAllByText('x2')).toHaveLength(2);
    });

    it('should display order status', async () => {
        vi.mocked(orderService.getMyOrders).mockResolvedValue(mockAxiosResponse(mockOrders));

        renderOrders();

        expect(await screen.findByText(/pending/i)).toBeInTheDocument();
        expect(screen.getByText(/delivered/i)).toBeInTheDocument();
    });

    it('should navigate back when back button clicked', async () => {
        vi.mocked(orderService.getMyOrders).mockResolvedValue(mockAxiosResponse(mockOrders));

        renderOrders();

        const backButton = await screen.findByText(/back/i);
        await userEvent.click(backButton);

        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('should show no items message when order has no items', async () => {
        const ordersWithNoItems = [
            { ...mockOrders[0], items: [] },
        ];

        vi.mocked(orderService.getMyOrders).mockResolvedValue(mockAxiosResponse(ordersWithNoItems));

        renderOrders();

        expect(await screen.findByText(/no items/i)).toBeInTheDocument();
    });

    it('should display order dates', async () => {
        vi.mocked(orderService.getMyOrders).mockResolvedValue(mockAxiosResponse(mockOrders));

        renderOrders();

        expect(await screen.findByText(/01\.01\.2024/)).toBeInTheDocument();
        expect(screen.getByText(/02\.01\.2024/)).toBeInTheDocument();
    });

    it('should have link to product pages', async () => {
        vi.mocked(orderService.getMyOrders).mockResolvedValue(mockAxiosResponse(mockOrders));

        renderOrders();

        const productLinks = await screen.findAllByRole('link');
        expect(productLinks[0]).toHaveAttribute('href', '/products/1');
        expect(productLinks[1]).toHaveAttribute('href', '/products/2');
    });

    it('should display order IDs', async () => {
        vi.mocked(orderService.getMyOrders).mockResolvedValue(mockAxiosResponse(mockOrders));

        renderOrders();

        expect(await screen.findByText(/12345678\.\.\./)).toBeInTheDocument();
        expect(screen.getByText(/87654321\.\.\./)).toBeInTheDocument();
    });

    it('should display order totals', async () => {
        vi.mocked(orderService.getMyOrders).mockResolvedValue(mockAxiosResponse(mockOrders));

        renderOrders();

        expect(await screen.findAllByText('$200.00')).toHaveLength(2);
        expect(screen.getAllByText('$300.00')).toHaveLength(2);
    });
});