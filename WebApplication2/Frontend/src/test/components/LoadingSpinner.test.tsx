import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../../components/LoadingSpinner';

describe('LoadingSpinner', () => {
    it('should render loading spinner', () => {
        render(<LoadingSpinner />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should have spinner container', () => {
        render(<LoadingSpinner />);
        const container = document.querySelector('.loading-spinner-container');
        expect(container).toBeInTheDocument();
    });

    it('should have spinner element', () => {
        render(<LoadingSpinner />);
        const spinner = document.querySelector('.loading-spinner');
        expect(spinner).toBeInTheDocument();
    });
});