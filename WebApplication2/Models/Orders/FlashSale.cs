using System.Text.Json.Serialization;

namespace WebApplication2.Models.Orders
{
    public class FlashSale
    {
        public int Id { get; set; }
        public decimal DiscountPercentage { get; set; }
        public DateTime StartsAt { get; set; }
        public DateTime EndsAt { get; set; }
        public bool IsActive { get; set; } = true;
        public string ProductIdsJson { get; set; } = "[]";
        public string CategoryIdsJson { get; set; } = "[]";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}