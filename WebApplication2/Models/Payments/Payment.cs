using WebApplication2.Models.Orders;

namespace WebApplication2.Models.Payments
{
    public class Payment
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public Order? Order { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "RUB";
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
        public string? ProviderPaymentId { get; set; }
        public string? IdempotenceKey { get; set; }
        public string? PaymentUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? PaidAt { get; set; }
        public DateTime? CanceledAt { get; set; }
    }
}