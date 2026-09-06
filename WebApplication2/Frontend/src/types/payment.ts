export interface CreatePaymentDto {
    orderId: string;
    paymentMethod?: string;
}

export interface PaymentResponseDto {
    paymentId: string;
    paymentUrl: string;
}