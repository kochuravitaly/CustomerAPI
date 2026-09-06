namespace WebApplication2.DTOs.Payments
{
    public class CreatePaymentDto
    {
        public Guid OrderId { get; set; }
        public string? PaymentMethod { get; set; }
    }
}
