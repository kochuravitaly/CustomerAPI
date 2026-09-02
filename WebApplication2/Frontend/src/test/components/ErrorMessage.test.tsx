import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorMessage } from '../../components/ErrorMessage';

describe('ErrorMessage', () => {
    it('should render error message', () => {
        render(<ErrorMessage message="Something went wrong" />);
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should show error icon', () => {
        render(<ErrorMessage message="Error" />);
        expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should not show retry button when onRetry not provided', () => {
        render(<ErrorMessage message="Error" />);
        expect(screen.queryByText(/try again/i)).not.toBeInTheDocument();
    });

    it('should show retry button when onRetry provided', () => {
        render(<ErrorMessage message="Error" onRetry={() => { }} />);
        expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });

    it('should call onRetry when retry button clicked', async () => {
        const mockRetry = vi.fn();
        render(<ErrorMessage message="Error" onRetry={mockRetry} />);

        const retryButton = screen.getByText(/try again/i);
        await userEvent.click(retryButton);

        expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('should render empty message', () => {
        render(<ErrorMessage message="" />);
        const messageElement = document.querySelector('.error-message');
        expect(messageElement).toBeInTheDocument();
    });
});