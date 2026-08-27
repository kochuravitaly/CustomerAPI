namespace WebApplication2.DTOs.Orders
{
    public class CreateFlashSaleDto
    {
        public decimal DiscountPercentage { get; set; }
        public DateTime StartsAt { get; set; }
        public DateTime EndsAt { get; set; }
        public string ProductIdsJson { get; set; } = "[]";
        public string CategoryIdsJson { get; set; } = "[]";
    }
}