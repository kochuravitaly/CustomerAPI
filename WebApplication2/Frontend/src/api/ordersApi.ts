import { apiRequest } from "./client";
import type { Order } from "../types/orders";

export async function createOrder(): Promise<Order> {
    return apiRequest<Order>(
        "/api/orders",
        {
            method: "POST",
        }
    );
}

export async function getOrders(): Promise<Order[]> {
    return apiRequest<Order[]>(
        "/api/orders"
    );
}

export async function getOrder(
    id: string
): Promise<Order> {
    return apiRequest<Order>(
        `/api/orders/${id}`
    );
}