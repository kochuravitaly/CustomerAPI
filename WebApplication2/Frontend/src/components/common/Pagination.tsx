interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({
    page,
    totalPages,
    onPageChange
}: PaginationProps) {
    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="mt-8 flex items-center justify-center gap-2">
            <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
                Previous
            </button>

            <span className="px-4 text-sm text-gray-600">
                Page {page} of {totalPages}
            </span>

            <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
                Next
            </button>
        </div>
    );
}