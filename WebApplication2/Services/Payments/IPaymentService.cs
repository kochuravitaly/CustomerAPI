using WebApplication2.DTOs.Payments;
using WebApplication2.DTOs.Payments.YooKassa;

namespace WebApplication2.Services.Payments
{
    public interface IPaymentService
    {
        Task<PaymentResponseDto> CreatePaymentAsync(CreatePaymentDto dto, Guid customerId, CancellationToken cancellationToken);
        Task HandleWebhookAsync(YooKassaWebhookDto dto, CancellationToken cancellationToken);
    }
}
