using System.Text.Json.Serialization;

namespace WebApplication2.Models.Orders
{
    public class Coupon
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public int DiscountType { get; set; }
        public decimal DiscountValue { get; set; }
        public decimal? MinOrderAmount { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public int? UsageLimit { get; set; }
        public int TimesUsed { get; set; }
        public bool IsActive { get; set; } = true;
        public string ProductIdsJson { get; set; } = "[]";
        public string CategoryIdsJson { get; set; } = "[]";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}