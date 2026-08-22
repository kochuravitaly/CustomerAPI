export interface CreatePaymentRequest {
    orderId: string;
}

export interface PaymentResponse {
    paymentId: string;
    paymentUrl: string;
}

export interface Payment {
    id: string;
    orderId: string;
    amount: number;
    currency: string;
    status: string;
    providerPaymentId: string;
    createdAt: string;
    paidAt?: string | null;
    canceledAt?: string | null;
}