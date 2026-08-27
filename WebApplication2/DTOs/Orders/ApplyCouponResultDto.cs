namespace WebApplication2.DTOs.Orders
{
    public class ApplyCouponResultDto
    {
        public decimal Discount { get; set; }
        public decimal FinalTotal { get; set; }
        public string? Error { get; set; }
    }
}