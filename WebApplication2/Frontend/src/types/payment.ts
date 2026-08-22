export interface CreatePaymentDto {
    orderId: string;
}

export interface PaymentResponseDto {
    paymentId: string;
    paymentUrl: string;
}