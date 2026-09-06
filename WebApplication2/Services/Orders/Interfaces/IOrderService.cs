using WebApplication2.DTOs.Orders;

namespace WebApplication2.Services.Orders.Interfaces
{
    public interface IOrderService
    {
        Task<OrderResponseDto?> CreateOrderAsync(Guid customerId, List<OrderCouponDto>? coupons = null);
        Task<IEnumerable<OrderResponseDto>> GetCustomerOrdersAsync(Guid customerId);
        Task<OrderResponseDto?> GetOrderByIdAsync(Guid id, Guid customerId);
        Task<bool> ReorderAsync(Guid customerId, Guid orderId);
        Task<OrderResponseDto?> CreateDirectOrderAsync(Guid customerId, CreateDirectOrderDto dto);
    }
}