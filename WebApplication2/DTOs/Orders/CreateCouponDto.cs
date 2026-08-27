namespace WebApplication2.DTOs.Orders
{
    public class CreateCouponDto
    {
        public string Code { get; set; } = string.Empty;
        public int DiscountType { get; set; }
        public decimal DiscountValue { get; set; }
        public decimal? MinOrderAmount { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public int? UsageLimit { get; set; }
        public string ProductIdsJson { get; set; } = "[]";
        public string CategoryIdsJson { get; set; } = "[]";
    }
}