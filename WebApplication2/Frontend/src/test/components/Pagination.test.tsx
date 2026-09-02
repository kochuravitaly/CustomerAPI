import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '../../components/Pagination';
import { LanguageProvider } from '../../context/LanguageContext';

describe('Pagination', () => {
    const mockOnPageChange = vi.fn();

    const renderPagination = (currentPage: number, totalPages: number) => {
        return render(
            <LanguageProvider>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={mockOnPageChange}
                />
            </LanguageProvider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Single Page', () => {
        it('should not render when totalPages is 1', () => {
            renderPagination(1, 1);
            expect(document.querySelector('.pagination')).not.toBeInTheDocument();
        });

        it('should not render when totalPages is 0', () => {
            renderPagination(1, 0);
            expect(document.querySelector('.pagination')).not.toBeInTheDocument();
        });
    });

    describe('Few Pages (<= 5)', () => {
        it('should show all page numbers', () => {
            renderPagination(1, 3);
            expect(screen.getByText('1')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();
        });

        it('should show prev and next buttons', () => {
            renderPagination(2, 3);
            expect(screen.getByText(/prev/i)).toBeInTheDocument();
            expect(screen.getByText(/next/i)).toBeInTheDocument();
        });

        it('should disable prev on first page', () => {
            renderPagination(1, 3);
            const prevButton = screen.getByText(/prev/i).closest('button');
            expect(prevButton).toBeDisabled();
        });

        it('should disable next on last page', () => {
            renderPagination(3, 3);
            const nextButton = screen.getByText(/next/i).closest('button');
            expect(nextButton).toBeDisabled();
        });

        it('should call onPageChange with previous page', async () => {
            renderPagination(2, 3);
            const prevButton = screen.getByText(/prev/i);
            await userEvent.click(prevButton);
            expect(mockOnPageChange).toHaveBeenCalledWith(1);
        });

        it('should call onPageChange with next page', async () => {
            renderPagination(2, 3);
            const nextButton = screen.getByText(/next/i);
            await userEvent.click(nextButton);
            expect(mockOnPageChange).toHaveBeenCalledWith(3);
        });
    });

    describe('Many Pages (> 5)', () => {
        it('should show first pages with ellipsis when on page 1', () => {
            renderPagination(1, 10);
            expect(screen.getByText('1')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();
            expect(screen.getByText('4')).toBeInTheDocument();
            expect(screen.getByText('...')).toBeInTheDocument();
            expect(screen.getByText('10')).toBeInTheDocument();
        });

        it('should show ellipsis and last pages when on last page', () => {
            renderPagination(10, 10);
            expect(screen.getByText('1')).toBeInTheDocument();
            expect(screen.getByText('...')).toBeInTheDocument();
            expect(screen.getByText('7')).toBeInTheDocument();
            expect(screen.getByText('8')).toBeInTheDocument();
            expect(screen.getByText('9')).toBeInTheDocument();
            expect(screen.getByText('10')).toBeInTheDocument();
        });

        it('should show current page in middle with ellipsis', () => {
            renderPagination(5, 10);
            expect(screen.getByText('1')).toBeInTheDocument();
            expect(screen.getAllByText('...').length).toBe(2);
            expect(screen.getByText('4')).toBeInTheDocument();
            expect(screen.getByText('5')).toBeInTheDocument();
            expect(screen.getByText('6')).toBeInTheDocument();
            expect(screen.getByText('10')).toBeInTheDocument();
        });

        it('should mark current page as active', () => {
            renderPagination(5, 10);
            const activeButton = screen.getByText('5');
            expect(activeButton).toHaveClass('active');
        });
    });

    describe('Page Click', () => {
        it('should call onPageChange when page number clicked', async () => {
            renderPagination(1, 3);
            const pageButton = screen.getByText('2');
            await userEvent.click(pageButton);
            expect(mockOnPageChange).toHaveBeenCalledWith(2);
        });
    });
});