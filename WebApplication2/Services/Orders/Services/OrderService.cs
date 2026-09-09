using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using WebApplication2.Data;
using WebApplication2.DTOs.Orders;
using WebApplication2.Models.Orders;
using WebApplication2.Models.ShoppingCart;
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

        public async Task<OrderResponseDto?> CreateOrderAsync(Guid customerId, List<OrderCouponDto>? coupons = null)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var cart = await _context.Carts
                    .Include(c => c.CartItems)
                    .ThenInclude(ci => ci.Product)
                    .SingleOrDefaultAsync(c => c.CustomerId == customerId);

                if (cart == null || !cart.CartItems.Any())
                    return null;

                var now = DateTime.UtcNow;
                var flashSales = await _context.FlashSales
                    .Where(f => f.IsActive && f.StartsAt <= now && f.EndsAt > now)
                    .ToListAsync();

                var order = new Order
                {
                    CustomerId = customerId,
                    Status = OrderStatus.Pending,
                    CreatedAt = DateTime.UtcNow,
                    TotalAmount = 0,
                    InvoiceNumber = await GenerateInvoiceNumberAsync()
                };

                decimal totalAmount = 0;

                foreach (var item in cart.CartItems)
                {
                    var productId = item.ProductId;
                    var quantity = item.Quantity;

                    var updated = await _context.Products
                        .Where(p => p.Id == productId && p.StockQuantity >= quantity)
                        .ExecuteUpdateAsync(setters => setters
                            .SetProperty(p => p.StockQuantity, p => p.StockQuantity - quantity));

                    if (updated == 0)
                    {
                        await transaction.RollbackAsync();
                        return null;
                    }

                    var product = await _context.Products
                        .FirstOrDefaultAsync(p => p.Id == productId);

                    if (product == null)
                    {
                        await transaction.RollbackAsync();
                        return null;
                    }

                    decimal unitPrice = product.Price;

                    var flashSale = flashSales.FirstOrDefault(f =>
                    {
                        try
                        {
                            var productIds = JsonSerializer.Deserialize<List<int>>(f.ProductIdsJson ?? "[]") ?? new List<int>();
                            var categoryIds = JsonSerializer.Deserialize<List<int>>(f.CategoryIdsJson ?? "[]") ?? new List<int>();

                            if (productIds.Count > 0)
                                return productIds.Contains(item.ProductId);

                            if (categoryIds.Count > 0)
                                return categoryIds.Contains(product.CategoryId);

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
                        ProductName = product.Name,
                        UnitPrice = unitPrice,
                        Quantity = item.Quantity,
                        Total = unitPrice * item.Quantity
                    };

                    order.OrderItems.Add(orderItem);
                    totalAmount += orderItem.Total;
                }

                if (coupons != null && coupons.Count > 0)
                {
                    var couponCodes = coupons.Select(c => c.Code.ToUpper()).Distinct().ToList();
                    var couponEntities = await _context.Coupons
                        .Where(c => couponCodes.Contains(c.Code) && c.IsActive)
                        .ToListAsync();

                    foreach (var coupon in coupons)
                    {
                        var couponEntity = couponEntities.FirstOrDefault(c => c.Code == coupon.Code.ToUpper());
                        if (couponEntity == null) continue;

                        if (couponEntity.ExpiryDate.HasValue && couponEntity.ExpiryDate < DateTime.UtcNow) continue;
                        if (couponEntity.UsageLimit.HasValue && couponEntity.TimesUsed >= couponEntity.UsageLimit) continue;

                        var orderItemForCoupon = order.OrderItems.FirstOrDefault(oi => oi.ProductId == coupon.ProductId);
                        if (orderItemForCoupon == null) continue;

                        decimal discount;
                        if (couponEntity.DiscountType == 0)
                        {
                            discount = orderItemForCoupon.Total * (couponEntity.DiscountValue / 100m);
                        }
                        else
                        {
                            discount = Math.Min(couponEntity.DiscountValue, orderItemForCoupon.Total);
                        }

                        if (discount > 0)
                        {
                            totalAmount -= discount;
                            orderItemForCoupon.Total -= discount;
                            orderItemForCoupon.UnitPrice = orderItemForCoupon.Total / orderItemForCoupon.Quantity;

                            couponEntity.TimesUsed += 1;
                            if (couponEntity.UsageLimit.HasValue && couponEntity.TimesUsed >= couponEntity.UsageLimit)
                            {
                                couponEntity.IsActive = false;
                            }
                        }
                    }
                }

                order.TotalAmount = totalAmount;

                _context.Orders.Add(order);
                _context.Carts.Remove(cart);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return MapToResponseDto(order);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
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
                InvoiceNumber = order.InvoiceNumber,
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

        public async Task<bool> ReorderAsync(Guid customerId, Guid orderId)
        {
            var existingOrder = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.CustomerId == customerId);

            if (existingOrder == null) return false;

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.CustomerId == customerId);

            if (cart == null)
            {
                cart = new Cart { CustomerId = customerId };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }

            foreach (var item in existingOrder.OrderItems)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product == null || product.StockQuantity <= 0) continue;

                var existingCartItem = cart.CartItems.FirstOrDefault(ci => ci.ProductId == item.ProductId);
                if (existingCartItem != null)
                {
                    existingCartItem.Quantity = Math.Min(existingCartItem.Quantity + item.Quantity, product.StockQuantity);
                }
                else
                {
                    cart.CartItems.Add(new CartItem
                    {
                        ProductId = item.ProductId,
                        Quantity = Math.Min(item.Quantity, product.StockQuantity)
                    });
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<OrderResponseDto?> CreateDirectOrderAsync(Guid customerId, CreateDirectOrderDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var updated = await _context.Products
                    .Where(p => p.Id == dto.ProductId && p.StockQuantity >= dto.Quantity)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(p => p.StockQuantity, p => p.StockQuantity - dto.Quantity));

                if (updated == 0)
                {
                    await transaction.RollbackAsync();
                    return null;
                }

                var product = await _context.Products
                    .FirstOrDefaultAsync(p => p.Id == dto.ProductId);

                if (product == null)
                {
                    await transaction.RollbackAsync();
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
                    TotalAmount = 0,
                    InvoiceNumber = await GenerateInvoiceNumberAsync()
                };

                decimal unitPrice = product.Price;

                var flashSale = flashSales.FirstOrDefault(f =>
                {
                    try
                    {
                        var productIds = JsonSerializer.Deserialize<List<int>>(f.ProductIdsJson ?? "[]") ?? new List<int>();
                        var categoryIds = JsonSerializer.Deserialize<List<int>>(f.CategoryIdsJson ?? "[]") ?? new List<int>();
                        if (productIds.Count > 0) return productIds.Contains(product.Id);
                        if (categoryIds.Count > 0) return categoryIds.Contains(product.CategoryId);
                        return true;
                    }
                    catch { return false; }
                });

                if (flashSale != null)
                {
                    unitPrice = unitPrice * (1 - flashSale.DiscountPercentage / 100m);
                }

                var orderItem = new OrderItem
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    UnitPrice = unitPrice,
                    Quantity = dto.Quantity,
                    Total = unitPrice * dto.Quantity
                };

                order.OrderItems.Add(orderItem);
                order.TotalAmount = orderItem.Total;

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return MapToResponseDto(order);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private async Task<string> GenerateInvoiceNumberAsync()
        {
            var year = DateTime.UtcNow.Year;

            var lastInvoice = await _context.Orders
                .Where(o => o.InvoiceNumber.StartsWith($"INV-{year}-"))
                .OrderByDescending(o => o.InvoiceNumber)
                .FirstOrDefaultAsync();

            int nextNumber = 1;
            if (lastInvoice != null)
            {
                var parts = lastInvoice.InvoiceNumber.Split('-');
                if (parts.Length == 3 && int.TryParse(parts[2], out int lastNum))
                {
                    nextNumber = lastNum + 1;
                }
            }

            return $"INV-{year}-{nextNumber:D6}";
        }
    }
}