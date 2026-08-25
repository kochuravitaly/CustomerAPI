using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.Orders;
using WebApplication2.Models.Orders;

namespace WebApplication2.Services.Orders
{
    public class FlashSaleService : IFlashSaleService
    {
        private readonly AppDbContext _context;

        public FlashSaleService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<FlashSaleResponseDto>> GetActiveFlashSalesAsync()
        {
            var now = DateTime.UtcNow;

            return await _context.FlashSales
                .Where(f => f.IsActive && f.StartsAt <= now && f.EndsAt > now)
                .Select(f => new FlashSaleResponseDto
                {
                    Id = f.Id,
                    ProductId = f.ProductId,
                    ProductName = f.Product.Name,
                    DiscountPercentage = f.DiscountPercentage,
                    StartsAt = f.StartsAt,
                    EndsAt = f.EndsAt,
                    IsActive = f.IsActive
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<FlashSaleResponseDto>> GetAllFlashSalesAsync()
        {
            return await _context.FlashSales
                .Select(f => new FlashSaleResponseDto
                {
                    Id = f.Id,
                    ProductId = f.ProductId,
                    ProductName = f.Product.Name,
                    DiscountPercentage = f.DiscountPercentage,
                    StartsAt = f.StartsAt,
                    EndsAt = f.EndsAt,
                    IsActive = f.IsActive
                })
                .ToListAsync();
        }

        public async Task<FlashSaleResponseDto?> CreateFlashSaleAsync(CreateFlashSaleDto dto)
        {
            var productExists = await _context.Products.AnyAsync(p => p.Id == dto.ProductId);
            if (!productExists) return null;

            var flashSale = new FlashSale
            {
                ProductId = dto.ProductId,
                DiscountPercentage = dto.DiscountPercentage,
                StartsAt = dto.StartsAt,
                EndsAt = dto.EndsAt,
                IsActive = true
            };

            _context.FlashSales.Add(flashSale);
            await _context.SaveChangesAsync();

            return new FlashSaleResponseDto
            {
                Id = flashSale.Id,
                ProductId = flashSale.ProductId,
                ProductName = (await _context.Products.FindAsync(dto.ProductId))?.Name ?? "",
                DiscountPercentage = flashSale.DiscountPercentage,
                StartsAt = flashSale.StartsAt,
                EndsAt = flashSale.EndsAt,
                IsActive = flashSale.IsActive
            };
        }

        public async Task<bool> DeleteFlashSaleAsync(int id)
        {
            var flashSale = await _context.FlashSales.FindAsync(id);
            if (flashSale == null) return false;

            _context.FlashSales.Remove(flashSale);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}