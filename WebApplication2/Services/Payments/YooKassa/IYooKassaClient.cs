using WebApplication2.DTOs.Payments.YooKassa;

namespace WebApplication2.Services.Payments.YooKassa
{
    public interface IYooKassaClient
    {
        Task<YooKassaPaymentResponseDto> CreatePaymentAsync(YooKassaPaymentRequestDto request, string idempotenceKey, CancellationToken cancellationToken);
        Task<YooKassaPaymentStatusResponseDto> GetPaymentAsync(string paymentId, CancellationToken cancellationToken);
    }
}
