import Button from "../common/Button";

interface CartSummaryProps {
    total: number;
    onCheckout: () => void;
    loading?: boolean;
    disabled?: boolean;
}

export default function CartSummary({
    total,
    onCheckout,
    loading = false,
    disabled = false
}: CartSummaryProps) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-gray-600">
                    Total
                </span>

                <span className="text-2xl font-bold text-gray-900">
                    ₽{total.toLocaleString("ru-RU")}
                </span>
            </div>

            <Button
                type="button"
                onClick={onCheckout}
                loading={loading}
                disabled={disabled}
                className="mt-6 w-full"
            >
                Checkout
            </Button>
        </div>
    );
}