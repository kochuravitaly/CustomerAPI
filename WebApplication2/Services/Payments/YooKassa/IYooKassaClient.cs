namespace WebApplication2.Services.Payments.YooKassa
{
    public interface IYooKassaClient
    {
        Task<YooKassaPaymentResponse> CreatePaymentAsync(YooKassaPaymentRequest request, string idempotenceKey, CancellationToken cancellationToken);
        Task<YooKassaPaymentStatusResponse> GetPaymentAsync(string paymentId, CancellationToken cancellationToken);
    }
}
