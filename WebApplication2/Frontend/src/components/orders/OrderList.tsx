import type { Order } from "../../types/orders";
import EmptyState from "../common/EmptyState";
import OrderCard from "./OrderCard";

interface OrderListProps {
    orders: Order[];
}

export default function OrderList({ orders }: OrderListProps) {
    if (orders.length === 0) {
        return (
            <EmptyState
                title="No orders yet"
                description="Your orders will appear here after you make a purchase."
            />
        );
    }

    return (
        <div className="space-y-4">
            {orders.map(order => (
                <OrderCard
                    key={order.id}
                    order={order}
                />
            ))}
        </div>
    );
}