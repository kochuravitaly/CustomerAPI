using Microsoft.EntityFrameworkCore;
using System.Text.Json;
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
                    DiscountPercentage = f.DiscountPercentage,
                    StartsAt = f.StartsAt,
                    EndsAt = f.EndsAt,
                    IsActive = f.IsActive,
                    ProductIdsJson = f.ProductIdsJson,
                    CategoryIdsJson = f.CategoryIdsJson
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<FlashSaleResponseDto>> GetAllFlashSalesAsync()
        {
            return await _context.FlashSales
                .Select(f => new FlashSaleResponseDto
                {
                    Id = f.Id,
                    DiscountPercentage = f.DiscountPercentage,
                    StartsAt = f.StartsAt,
                    EndsAt = f.EndsAt,
                    IsActive = f.IsActive,
                    ProductIdsJson = f.ProductIdsJson,
                    CategoryIdsJson = f.CategoryIdsJson
                })
                .ToListAsync();
        }

        public async Task<FlashSaleResponseDto?> CreateFlashSaleAsync(CreateFlashSaleDto dto)
        {
            if (dto.DiscountPercentage <= 0 || dto.DiscountPercentage >= 100)
                return null;

            var flashSale = new FlashSale
            {
                DiscountPercentage = dto.DiscountPercentage,
                StartsAt = dto.StartsAt,
                EndsAt = dto.EndsAt,
                IsActive = true,
                ProductIdsJson = dto.ProductIdsJson ?? "[]",
                CategoryIdsJson = dto.CategoryIdsJson ?? "[]"
            };

            _context.FlashSales.Add(flashSale);
            await _context.SaveChangesAsync();

            return new FlashSaleResponseDto
            {
                Id = flashSale.Id,
                DiscountPercentage = flashSale.DiscountPercentage,
                StartsAt = flashSale.StartsAt,
                EndsAt = flashSale.EndsAt,
                IsActive = flashSale.IsActive,
                ProductIdsJson = flashSale.ProductIdsJson,
                CategoryIdsJson = flashSale.CategoryIdsJson
            };
        }

        public async Task<FlashSaleResponseDto?> UpdateFlashSaleAsync(int id, CreateFlashSaleDto dto)
        {
            if (dto.DiscountPercentage <= 0 || dto.DiscountPercentage >= 100)
                return null;

            var flashSale = await _context.FlashSales.FindAsync(id);
            if (flashSale == null) return null;

            flashSale.DiscountPercentage = dto.DiscountPercentage;
            flashSale.StartsAt = dto.StartsAt;
            flashSale.EndsAt = dto.EndsAt;
            flashSale.ProductIdsJson = dto.ProductIdsJson ?? "[]";
            flashSale.CategoryIdsJson = dto.CategoryIdsJson ?? "[]";

            await _context.SaveChangesAsync();

            return new FlashSaleResponseDto
            {
                Id = flashSale.Id,
                DiscountPercentage = flashSale.DiscountPercentage,
                StartsAt = flashSale.StartsAt,
                EndsAt = flashSale.EndsAt,
                IsActive = flashSale.IsActive,
                ProductIdsJson = flashSale.ProductIdsJson,
                CategoryIdsJson = flashSale.CategoryIdsJson
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