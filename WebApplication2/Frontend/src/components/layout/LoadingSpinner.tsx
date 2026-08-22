interface LoadingSpinnerProps {
    fullScreen?: boolean;
}

export default function LoadingSpinner({
    fullScreen = false
}: LoadingSpinnerProps) {
    return (
        <div
            className={
                fullScreen
                    ? "flex min-h-screen items-center justify-center"
                    : "flex items-center justify-center py-12"
            }
        >
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        </div>
    );
}