namespace WebApplication2.DTOs.Orders
{
    public class CreateFlashSaleDto
    {
        public int ProductId { get; set; }
        public decimal DiscountPercentage { get; set; }
        public DateTime StartsAt { get; set; }
        public DateTime EndsAt { get; set; }
    }
}
