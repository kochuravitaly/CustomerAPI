export type OrderStatus =
    | "Pending"
    | "Paid"
    | "Shipped"
    | "Delivered"
    | "Cancelled";

export interface OrderItem {
    productId: number;
    productName: string;
    unitPrice: number;
    quantity: number;
    total: number;
}

export interface Order {
    id: string;
    totalAmount: number;
    status: OrderStatus;
    createdAt: string;
    items: OrderItem[];
}