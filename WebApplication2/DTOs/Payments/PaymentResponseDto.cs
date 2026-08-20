namespace WebApplication2.DTOs.Payments
{
    public class PaymentResponseDto
    {
        public Guid PaymentId { get; set; }
        public string PaymentUrl { get; set; } = string.Empty;
    }
}
