import { apiRequest } from "./client";

export interface CreatePaymentRequest {
    orderId: string;
}

export interface PaymentResponse {
    paymentId: string;
    paymentUrl: string;
}

export async function createPayment(
    request: CreatePaymentRequest
): Promise<PaymentResponse> {
    return apiRequest<PaymentResponse>(
        "/api/payments",
        {
            method: "POST",
            body: JSON.stringify(request),
        }
    );
}