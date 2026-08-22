import { Link } from "react-router-dom";
import type { Order } from "../../types/orders";
import Badge from "../common/Badge";

interface OrderCardProps {
    order: Order;
}

function getStatusVariant(
    status: string
): "default" | "success" | "warning" | "danger" {
    switch (status.toLowerCase()) {
        case "paid":
        case "completed":
            return "success";

        case "pending":
        case "created":
            return "warning";

        case "canceled":
        case "cancelled":
            return "danger";

        default:
            return "default";
    }
}

export default function OrderCard({ order }: OrderCardProps) {
    return (
        <Link
            to={`/orders/${order.id}`}
            className="block rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-500">
                        Order
                    </p>

                    <h3 className="mt-1 break-all text-lg font-semibold text-gray-900">
                        #{order.id}
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString(
                            "ru-RU"
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                    </Badge>

                    <span className="text-lg font-bold text-gray-900">
                        ₽{order.totalAmount.toLocaleString("ru-RU")}
                    </span>
                </div>
            </div>
        </Link>
    );
}