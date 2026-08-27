using Microsoft.EntityFrameworkCore;
using System.Text.Json;
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
                if (item.Product == null || item.Product.StockQuantity < item.Quantity)
                    return null;
            }

            var now = DateTime.UtcNow;
            var flashSales = await _context.FlashSales
                .Where(f => f.IsActive && f.StartsAt <= now && f.EndsAt > now)
                .ToListAsync();

            var order = new Order
            {
                CustomerId = customerId,
                Status = OrderStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                TotalAmount = 0
            };

            decimal totalAmount = 0;

            foreach (var item in cart.CartItems)
            {
                decimal unitPrice = item.Product.Price;

                var flashSale = flashSales.FirstOrDefault(f =>
                {
                    try
                    {
                        var productIds = JsonSerializer.Deserialize<List<int>>(f.ProductIdsJson ?? "[]") ?? new List<int>();
                        var categoryIds = JsonSerializer.Deserialize<List<int>>(f.CategoryIdsJson ?? "[]") ?? new List<int>();

                        if (productIds.Count > 0)
                        {
                            return productIds.Contains(item.ProductId);
                        }

                        if (categoryIds.Count > 0)
                        {
                            return categoryIds.Contains(item.Product.CategoryId);
                        }

                        return true;
                    }
                    catch
                    {
                        return false;
                    }
                });

                if (flashSale != null)
                {
                    unitPrice = unitPrice * (1 - flashSale.DiscountPercentage / 100m);
                }

                var orderItem = new OrderItem
                {
                    ProductId = item.ProductId,
                    ProductName = item.Product.Name,
                    UnitPrice = unitPrice,
                    Quantity = item.Quantity,
                    Total = unitPrice * item.Quantity
                };

                order.OrderItems.Add(orderItem);
                totalAmount += orderItem.Total;
                item.Product.StockQuantity -= item.Quantity;
            }

            order.TotalAmount = totalAmount;

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