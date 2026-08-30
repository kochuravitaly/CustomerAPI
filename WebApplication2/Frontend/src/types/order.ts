export enum OrderStatus {
    Pending = 0,
    Paid = 1,
    Shipped = 2,
    Delivered = 3,
    Canceled = 4
}

export interface OrderItemResponseDto {
    productId: number;
    productName: string;
    productNameTranslations?: Record<string, string>;
    unitPrice: number;
    quantity: number;
    total: number;
}

export interface OrderResponseDto {
    id: string;
    totalAmount: number;
    status: OrderStatus;
    createdAt: string;
    items: OrderItemResponseDto[];
}