import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
}) => {
    const { t } = useLanguage();

    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }

        return pages;
    };

    return (
        <div className="pagination">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
            >
                ← {t.common.prev}
            </button>

            {getPageNumbers().map((page, index) =>
                typeof page === 'number' ? (
                    <button
                        key={index}
                        onClick={() => onPageChange(page)}
                        className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                    >
                        {page}
                    </button>
                ) : (
                    <span key={index} className="pagination-ellipsis">
                        {page}
                    </span>
                )
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
            >
                {t.common.next} →
            </button>
        </div>
    );
};