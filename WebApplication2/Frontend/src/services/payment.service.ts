import { apiService } from './api';
import { CreatePaymentDto, PaymentResponseDto } from '../types/payment';

export const paymentService = {
    create: (data: CreatePaymentDto) =>
        apiService.post<PaymentResponseDto>('/payments', data),
};