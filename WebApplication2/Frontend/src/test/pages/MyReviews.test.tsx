import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MyReviews } from '../../pages/MyReviews';
import { LanguageProvider } from '../../context/LanguageContext';
import { reviewService } from '../../services/review.service';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: vi.fn(),
    };
});

vi.mock('../../services/review.service', () => ({
    reviewService: {
        getMyReviews: vi.fn(),
        updateReview: vi.fn(),
        deleteReview: vi.fn(),
        uploadMedia: vi.fn(),
        deleteMedia: vi.fn(),
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

const mockReviews = [
    {
        id: 1,
        productId: 1,
        productName: 'Test Product',
        rating: 5,
        text: 'Great product!',
        createdAt: '2024-01-01T00:00:00Z',
        media: [
            { id: 1, fileName: 'image.jpg', mediaType: 'image' },
            { id: 2, fileName: 'video.mp4', mediaType: 'video' },
        ],
    },
    {
        id: 2,
        productId: 2,
        productName: 'Another Product',
        rating: 3,
        text: 'Okay product',
        createdAt: '2024-01-02T00:00:00Z',
        media: [],
    },
];

describe('MyReviews', () => {
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

    const renderMyReviews = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <MemoryRouter>
                        <MyReviews />
                    </MemoryRouter>
                </LanguageProvider>
            </QueryClientProvider>
        );
    };

    it('should show loading spinner while reviews load', () => {
        vi.mocked(reviewService.getMyReviews).mockImplementation(() => new Promise(() => { }));

        renderMyReviews();

        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should show error when reviews fail to load', async () => {
        vi.mocked(reviewService.getMyReviews).mockRejectedValue(new Error('Network error'));

        renderMyReviews();

        expect(await screen.findByText('Failed to load reviews')).toBeInTheDocument();
    });

    it('should show no reviews message when empty', async () => {
        vi.mocked(reviewService.getMyReviews).mockResolvedValue(mockAxiosResponse([]));

        renderMyReviews();

        expect(await screen.findByText(/no reviews/i)).toBeInTheDocument();
    });

    it('should display reviews with details', async () => {
        vi.mocked(reviewService.getMyReviews).mockResolvedValue(mockAxiosResponse(mockReviews));

        renderMyReviews();

        expect(await screen.findByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText('Great product!')).toBeInTheDocument();
        expect(screen.getByText('Another Product')).toBeInTheDocument();
        expect(screen.getByText('Okay product')).toBeInTheDocument();
    });

    it('should navigate back when back button clicked', async () => {
        vi.mocked(reviewService.getMyReviews).mockResolvedValue(mockAxiosResponse(mockReviews));

        renderMyReviews();

        const backButton = await screen.findByText(/back/i);
        await userEvent.click(backButton);

        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('should enter edit mode when edit button clicked', async () => {
        vi.mocked(reviewService.getMyReviews).mockResolvedValue(mockAxiosResponse(mockReviews));

        renderMyReviews();

        const editButtons = await screen.findAllByText(/edit/i);
        await userEvent.click(editButtons[0]);

        expect(screen.getByDisplayValue('Great product!')).toBeInTheDocument();
        expect(screen.getByText(/save/i)).toBeInTheDocument();
        expect(screen.getByText(/cancel/i)).toBeInTheDocument();
    });

    it('should update review when save clicked', async () => {
        vi.mocked(reviewService.getMyReviews).mockResolvedValue(mockAxiosResponse(mockReviews));
        vi.mocked(reviewService.updateReview).mockResolvedValue(mockAxiosResponse({}));

        renderMyReviews();

        const editButtons = await screen.findAllByText(/edit/i);
        await userEvent.click(editButtons[0]);

        const textarea = screen.getByDisplayValue('Great product!');
        await userEvent.clear(textarea);
        await userEvent.type(textarea, 'Updated review');

        const saveButton = screen.getByText(/save/i);
        await userEvent.click(saveButton);

        await waitFor(() => {
            expect(vi.mocked(reviewService.updateReview)).toHaveBeenCalledWith(1, {
                rating: 5,
                text: 'Updated review',
            });
        });
    });

    it('should cancel edit mode when cancel clicked', async () => {
        vi.mocked(reviewService.getMyReviews).mockResolvedValue(mockAxiosResponse(mockReviews));

        renderMyReviews();

        const editButtons = await screen.findAllByText(/edit/i);
        await userEvent.click(editButtons[0]);

        const cancelButton = screen.getByText(/cancel/i);
        await userEvent.click(cancelButton);

        expect(screen.queryByDisplayValue('Great product!')).not.toBeInTheDocument();
    });

    it('should delete review when delete clicked and confirmed', async () => {
        vi.mocked(reviewService.getMyReviews).mockResolvedValue(mockAxiosResponse(mockReviews));
        vi.mocked(reviewService.deleteReview).mockResolvedValue(mockAxiosResponse({}));
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        renderMyReviews();

        const deleteButtons = await screen.findAllByText(/delete/i);
        await userEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(vi.mocked(reviewService.deleteReview)).toHaveBeenCalledWith(1);
        });
    });

    it('should not delete review when delete cancelled', async () => {
        vi.mocked(reviewService.getMyReviews).mockResolvedValue(mockAxiosResponse(mockReviews));
        vi.spyOn(window, 'confirm').mockReturnValue(false);

        renderMyReviews();

        const deleteButtons = await screen.findAllByText(/delete/i);
        await userEvent.click(deleteButtons[0]);

        expect(vi.mocked(reviewService.deleteReview)).not.toHaveBeenCalled();
    });

    it('should show error when update fails', async () => {
        vi.mocked(reviewService.getMyReviews).mockResolvedValue(mockAxiosResponse(mockReviews));
        vi.mocked(reviewService.updateReview).mockRejectedValue({
            response: { data: 'Failed to update review' },
        });

        renderMyReviews();

        const editButtons = await screen.findAllByText(/edit/i);
        await userEvent.click(editButtons[0]);

        const saveButton = screen.getByText(/save/i);
        await userEvent.click(saveButton);

        expect(await screen.findByText('Failed to update review')).toBeInTheDocument();
    });

    it('should show error when delete fails', async () => {
        vi.mocked(reviewService.getMyReviews).mockResolvedValue(mockAxiosResponse(mockReviews));
        vi.mocked(reviewService.deleteReview).mockRejectedValue({
            response: { data: 'Failed to delete review' },
        });
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        renderMyReviews();

        const deleteButtons = await screen.findAllByText(/delete/i);
        await userEvent.click(deleteButtons[0]);

        expect(await screen.findByText('Failed to delete review')).toBeInTheDocument();
    });

    it('should expand media when clicked', async () => {
        vi.mocked(reviewService.getMyReviews).mockResolvedValue(mockAxiosResponse(mockReviews));

        renderMyReviews();

        const mediaButtons = document.querySelectorAll('.review-media-thumb');
        await userEvent.click(mediaButtons[0] as HTMLElement);

        const closeButtons = screen.getAllByText('✕');
        expect(closeButtons.length).toBeGreaterThan(1);
    });

    it('should close expanded media when close clicked', async () => {
        vi.mocked(reviewService.getMyReviews).mockResolvedValue(mockAxiosResponse(mockReviews));

        renderMyReviews();

        const mediaButtons = document.querySelectorAll('.review-media-thumb');
        await userEvent.click(mediaButtons[0] as HTMLElement);

        const closeButtons = screen.getAllByText('✕');
        await userEvent.click(closeButtons[closeButtons.length - 1]);

        expect(screen.getAllByText('✕')).toHaveLength(2);
    });

    it('should delete media when delete media button clicked', async () => {
        vi.mocked(reviewService.getMyReviews).mockResolvedValue(mockAxiosResponse(mockReviews));
        vi.mocked(reviewService.deleteMedia).mockResolvedValue(mockAxiosResponse({}));

        renderMyReviews();

        const deleteMediaButtons = await screen.findAllByText('✕');
        await userEvent.click(deleteMediaButtons[0]);

        await waitFor(() => {
            expect(vi.mocked(reviewService.deleteMedia)).toHaveBeenCalledWith(1, 1);
        });
    });
});