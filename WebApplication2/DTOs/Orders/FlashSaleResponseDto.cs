namespace WebApplication2.DTOs.Orders
{
    public class FlashSaleResponseDto
    {
        public int Id { get; set; }
        public decimal DiscountPercentage { get; set; }
        public DateTime StartsAt { get; set; }
        public DateTime EndsAt { get; set; }
        public bool IsActive { get; set; }
        public string ProductIdsJson { get; set; } = "[]";
        public string CategoryIdsJson { get; set; } = "[]";
    }
}