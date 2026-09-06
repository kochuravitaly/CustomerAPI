namespace WebApplication2.DTOs.Orders
{
    public class CreateOrderRequestDto
    {
        public List<OrderCouponDto> Coupons { get; set; } = [];
    }
}
