namespace WebApplication2.Services.Payments.YooKassa
{
    public interface IYooKassaClient
    {
        Task<YooKassaPaymentResponse> CreatePaymentAsync(YooKassaPaymentRequest request, CancellationToken cancellationToken);
        Task<YooKassaPaymentStatusResponse> GetPaymentAsync(string paymentId, CancellationToken cancellationToken);
    }
}
