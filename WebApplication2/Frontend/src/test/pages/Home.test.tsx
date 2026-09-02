import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home } from '../../pages/Home';
import { LanguageProvider } from '../../context/LanguageContext';
import { homeSectionService } from '../../services/homeSection.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../../services/homeSection.service', () => ({
    homeSectionService: {
        getActive: vi.fn(),
        getProducts: vi.fn(),
    },
}));

vi.mock('../../components/ProductCard', () => ({
    ProductCard: ({ product }: any) => <div data-testid="product-card">{product.name}</div>,
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

const mockSections = [
    {
        id: 1,
        title: 'Best Sellers',
        titleTranslations: { en: 'Best Sellers', ru: 'Хиты продаж' },
        productsToShow: 4,
        filterJson: '{}',
    },
    {
        id: 2,
        title: 'New Arrivals',
        titleTranslations: { en: 'New Arrivals', ru: 'Новинки' },
        productsToShow: 4,
        filterJson: '{"sortBy":"createdAt"}',
    },
];

const mockProducts = {
    items: [
        { id: 1, name: 'Product 1', price: 100, stockQuantity: 10, categoryId: 1, categoryName: 'Category 1', createdAt: '', updatedAt: '', images: [] },
        { id: 2, name: 'Product 2', price: 200, stockQuantity: 20, categoryId: 1, categoryName: 'Category 1', createdAt: '', updatedAt: '', images: [] },
    ],
    page: 1,
    pageSize: 4,
    totalCount: 2,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
};

describe('Home', () => {
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

    const renderHome = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <Home />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    it('should show loading spinner while sections load', () => {
        vi.mocked(homeSectionService.getActive).mockImplementation(() => new Promise(() => { }));

        renderHome();

        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should show error when sections fail to load', async () => {
        vi.mocked(homeSectionService.getActive).mockRejectedValue(new Error('Network error'));

        renderHome();

        expect(await screen.findByText('Failed to load sections')).toBeInTheDocument();
    });

    it('should show no items message when no sections', async () => {
        vi.mocked(homeSectionService.getActive).mockResolvedValue(mockAxiosResponse([]));

        renderHome();

        expect(await screen.findByText(/no items/i)).toBeInTheDocument();
    });

    it('should render sections with titles', async () => {
        vi.mocked(homeSectionService.getActive).mockResolvedValue(mockAxiosResponse(mockSections));
        vi.mocked(homeSectionService.getProducts).mockResolvedValue(mockAxiosResponse(mockProducts));

        renderHome();

        expect(await screen.findByText('Best Sellers')).toBeInTheDocument();
        expect(screen.getByText('New Arrivals')).toBeInTheDocument();
    });

    it('should show products in each section', async () => {
        vi.mocked(homeSectionService.getActive).mockResolvedValue(mockAxiosResponse(mockSections));
        vi.mocked(homeSectionService.getProducts).mockResolvedValue(mockAxiosResponse(mockProducts));

        renderHome();

        await waitFor(() => {
            expect(screen.getAllByText('Product 1')).toHaveLength(2);
            expect(screen.getAllByText('Product 2')).toHaveLength(2);
        });
    });

    it('should show all sections link', async () => {
        vi.mocked(homeSectionService.getActive).mockResolvedValue(mockAxiosResponse(mockSections));
        vi.mocked(homeSectionService.getProducts).mockResolvedValue(mockAxiosResponse(mockProducts));

        renderHome();

        const allSectionsLink = await screen.findByText(/all/i);
        expect(allSectionsLink).toHaveAttribute('href', '/categories');
    });

    it('should navigate to bestsellers when clicking see more on Best Sellers', async () => {
        vi.mocked(homeSectionService.getActive).mockResolvedValue(mockAxiosResponse(mockSections));
        vi.mocked(homeSectionService.getProducts).mockResolvedValue(mockAxiosResponse(mockProducts));

        renderHome();

        const seeMoreButtons = await screen.findAllByText(/see more/i);
        await userEvent.click(seeMoreButtons[0]);

        expect(mockNavigate).toHaveBeenCalledWith('/categories?section=bestsellers');
    });

    it('should navigate to search when clicking see more on non-Best Sellers section', async () => {
        vi.mocked(homeSectionService.getActive).mockResolvedValue(mockAxiosResponse(mockSections));
        vi.mocked(homeSectionService.getProducts).mockResolvedValue(mockAxiosResponse(mockProducts));

        renderHome();

        const seeMoreButtons = await screen.findAllByText(/see more/i);
        await userEvent.click(seeMoreButtons[1]);

        expect(mockNavigate).toHaveBeenCalledWith('/search?sortBy=createdAt');
    });

    it('should navigate to search when filterJson is invalid', async () => {
        const sectionsWithInvalidFilter = [
            { ...mockSections[1], filterJson: 'invalid-json' },
        ];

        vi.mocked(homeSectionService.getActive).mockResolvedValue(mockAxiosResponse(sectionsWithInvalidFilter));
        vi.mocked(homeSectionService.getProducts).mockResolvedValue(mockAxiosResponse(mockProducts));

        renderHome();

        const seeMoreButton = await screen.findByText(/see more/i);
        await userEvent.click(seeMoreButton);

        expect(mockNavigate).toHaveBeenCalledWith('/search');
    });

    it('should show error when products fail to load', async () => {
        vi.mocked(homeSectionService.getActive).mockResolvedValue(mockAxiosResponse(mockSections));
        vi.mocked(homeSectionService.getProducts).mockRejectedValue(new Error('Network error'));

        renderHome();

        await waitFor(() => {
            expect(screen.getAllByText('Failed to load products')).toHaveLength(2);
        });
    });

    it('should show no items message when section has no products', async () => {
        vi.mocked(homeSectionService.getActive).mockResolvedValue(mockAxiosResponse(mockSections));
        vi.mocked(homeSectionService.getProducts).mockResolvedValue(mockAxiosResponse({ items: [], page: 1, pageSize: 4, totalCount: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false }));

        renderHome();

        await waitFor(() => {
            expect(screen.getAllByText(/no items/i)).toHaveLength(2);
        });
    });

    it('should show loading spinner while section products load', async () => {
        vi.mocked(homeSectionService.getActive).mockResolvedValue(mockAxiosResponse(mockSections));
        vi.mocked(homeSectionService.getProducts).mockImplementation(() => new Promise(() => { }));

        renderHome();

        await waitFor(() => {
            expect(screen.getAllByText(/loading/i)).toHaveLength(2);
        });
    });
});