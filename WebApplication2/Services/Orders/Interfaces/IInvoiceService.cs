namespace WebApplication2.Services.Orders.Interfaces
{
    public interface IInvoiceService
    {
        Task<byte[]?> GenerateInvoiceAsync(Guid orderId, Guid customerId, string language = "en");
    }
}
