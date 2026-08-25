using WebApplication2.DTOs.Orders;

namespace WebApplication2.Services.Orders.Interfaces
{
    public interface IOrderService
    {
        Task<OrderResponseDto?> CreateOrderAsync(Guid customerId);
        Task<IEnumerable<OrderResponseDto>> GetCustomerOrdersAsync(Guid customerId);
        Task<OrderResponseDto?> GetOrderByIdAsync(Guid id, Guid customerId);
    }
}
