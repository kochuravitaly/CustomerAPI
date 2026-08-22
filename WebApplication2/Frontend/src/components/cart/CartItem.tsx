import type { CartItem as CartItemType } from "../../types/cart";
import Button from "../common/Button";

interface CartItemProps {
    item: CartItemType;
    onUpdate: (productId: number, quantity: number) => Promise<void>;
    onRemove: (productId: number) => Promise<void>;
}

export default function CartItem({
    item,
    onUpdate,
    onRemove
}: CartItemProps) {
    return (
        <div className="flex flex-col gap-4 border-b border-gray-200 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-gray-900">
                    {item.productName}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                    ₽{item.unitPrice.toLocaleString("ru-RU")} each
                </p>
            </div>

            <div className="flex items-center gap-3">
                <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={event => {
                        const quantity = Number(event.target.value);

                        if (quantity > 0) {
                            void onUpdate(item.productId, quantity);
                        }
                    }}
                    className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center outline-none focus:border-gray-900"
                />

                <span className="w-28 text-right font-semibold text-gray-900">
                    ₽{item.total.toLocaleString("ru-RU")}
                </span>

                <Button
                    type="button"
                    variant="danger"
                    onClick={() => void onRemove(item.productId)}
                >
                    Remove
                </Button>
            </div>
        </div>
    );
}