using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.Orders;
using WebApplication2.Models.Orders;
using WebApplication2.Services.Orders.Interfaces;

namespace WebApplication2.Services.Orders.Services
{
    public class OrderService : IOrderService
    {
        private readonly AppDbContext _context;

        public OrderService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<OrderResponseDto?> CreateOrderAsync(Guid customerId)
        {
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Product)
                .SingleOrDefaultAsync(c => c.CustomerId == customerId);

            if (cart == null || !cart.CartItems.Any())
                return null;

            foreach (var item in cart.CartItems)
            {
                if (item.Product == null ||
                    item.Product.StockQuantity < item.Quantity)
                {
                    return null;
                }
            }

            var order = new Order
            {
                CustomerId = customerId,
                Status = OrderStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                TotalAmount = cart.CartItems.Sum(ci => ci.Product.Price * ci.Quantity)
            };

            foreach (var item in cart.CartItems)
            {
                var orderItem = new OrderItem
                {
                    ProductId = item.ProductId,
                    ProductName = item.Product.Name,
                    UnitPrice = item.Product.Price,
                    Quantity = item.Quantity,
                    Total = item.Product.Price * item.Quantity
                };

                order.OrderItems.Add(orderItem);

                item.Product.StockQuantity -= item.Quantity;
            }

            _context.Orders.Add(order);

            _context.Carts.Remove(cart);

            await _context.SaveChangesAsync();

            return MapToResponseDto(order);
        }

        public async Task<IEnumerable<OrderResponseDto>> GetCustomerOrdersAsync(Guid customerId)
        {
            var orders = await _context.Orders
                .Where(o => o.CustomerId == customerId)
                .Include(o => o.OrderItems)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return orders.Select(MapToResponseDto);
        }

        public async Task<OrderResponseDto?> GetOrderByIdAsync(Guid id, Guid customerId)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .SingleOrDefaultAsync(o =>
                    o.Id == id &&
                    o.CustomerId == customerId);

            if (order == null)
                return null;

            return MapToResponseDto(order);
        }

        private static OrderResponseDto MapToResponseDto(Order order)
        {
            return new OrderResponseDto
            {
                Id = order.Id,
                TotalAmount = order.TotalAmount,
                Status = order.Status,
                CreatedAt = order.CreatedAt,

                Items = order.OrderItems
                    .Select(oi => new OrderItemResponseDto
                    {
                        ProductId = oi.ProductId,
                        ProductName = oi.ProductName,
                        UnitPrice = oi.UnitPrice,
                        Quantity = oi.Quantity,
                        Total = oi.Total
                    })
                    .ToList()
            };
        }
    }
}