namespace WebApplication2.DTOs.Orders
{
    public class ApplyCouponDto
    {
        public string Code { get; set; } = string.Empty;
        public decimal OrderTotal { get; set; }
    }
}
