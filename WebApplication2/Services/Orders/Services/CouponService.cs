using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using WebApplication2.Data;
using WebApplication2.DTOs.Orders;
using WebApplication2.Models.Orders;

namespace WebApplication2.Services.Orders
{
    public class CouponService : ICouponService
    {
        private readonly AppDbContext _context;

        public CouponService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<CouponResponseDto>> GetCouponsAsync()
        {
            return await _context.Coupons
                .Select(c => new CouponResponseDto
                {
                    Id = c.Id,
                    Code = c.Code,
                    DiscountType = c.DiscountType,
                    DiscountValue = c.DiscountValue,
                    MinOrderAmount = c.MinOrderAmount,
                    ExpiryDate = c.ExpiryDate,
                    UsageLimit = c.UsageLimit,
                    TimesUsed = c.TimesUsed,
                    IsActive = c.IsActive,
                    ProductIdsJson = c.ProductIdsJson,
                    CategoryIdsJson = c.CategoryIdsJson
                })
                .ToListAsync();
        }

        public async Task<CouponResponseDto?> CreateCouponAsync(CreateCouponDto dto)
        {
            if (dto.DiscountType == 0 && dto.DiscountValue > 100)
                return null;

            if (dto.DiscountValue <= 0)
                return null;

            var exists = await _context.Coupons.AnyAsync(c => c.Code == dto.Code.ToUpper());
            if (exists) return null;

            var coupon = new Coupon
            {
                Code = dto.Code.ToUpper(),
                DiscountType = dto.DiscountType,
                DiscountValue = dto.DiscountValue,
                MinOrderAmount = dto.MinOrderAmount,
                ExpiryDate = dto.ExpiryDate,
                UsageLimit = dto.UsageLimit,
                ProductIdsJson = dto.ProductIdsJson ?? "[]",
                CategoryIdsJson = dto.CategoryIdsJson ?? "[]",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Coupons.Add(coupon);
            await _context.SaveChangesAsync();

            return new CouponResponseDto
            {
                Id = coupon.Id,
                Code = coupon.Code,
                DiscountType = coupon.DiscountType,
                DiscountValue = coupon.DiscountValue,
                MinOrderAmount = coupon.MinOrderAmount,
                ExpiryDate = coupon.ExpiryDate,
                UsageLimit = coupon.UsageLimit,
                TimesUsed = coupon.TimesUsed,
                IsActive = coupon.IsActive,
                ProductIdsJson = coupon.ProductIdsJson,
                CategoryIdsJson = coupon.CategoryIdsJson
            };
        }

        public async Task<CouponResponseDto?> UpdateCouponAsync(int id, CreateCouponDto dto)
        {
            if (dto.DiscountType == 0 && dto.DiscountValue > 100)
                return null;

            if (dto.DiscountValue <= 0)
                return null;

            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null) return null;

            coupon.Code = dto.Code.ToUpper();
            coupon.DiscountType = dto.DiscountType;
            coupon.DiscountValue = dto.DiscountValue;
            coupon.MinOrderAmount = dto.MinOrderAmount;
            coupon.ExpiryDate = dto.ExpiryDate;
            coupon.UsageLimit = dto.UsageLimit;
            coupon.ProductIdsJson = dto.ProductIdsJson ?? "[]";
            coupon.CategoryIdsJson = dto.CategoryIdsJson ?? "[]";

            await _context.SaveChangesAsync();

            return new CouponResponseDto
            {
                Id = coupon.Id,
                Code = coupon.Code,
                DiscountType = coupon.DiscountType,
                DiscountValue = coupon.DiscountValue,
                MinOrderAmount = coupon.MinOrderAmount,
                ExpiryDate = coupon.ExpiryDate,
                UsageLimit = coupon.UsageLimit,
                TimesUsed = coupon.TimesUsed,
                IsActive = coupon.IsActive,
                ProductIdsJson = coupon.ProductIdsJson,
                CategoryIdsJson = coupon.CategoryIdsJson
            };
        }

        public async Task<bool> DeleteCouponAsync(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null) return false;

            _context.Coupons.Remove(coupon);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<ApplyCouponResultDto?> ApplyCouponAsync(ApplyCouponDto dto)
        {
            var coupon = await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code == dto.Code.ToUpper() && c.IsActive);

            if (coupon == null)
                return new ApplyCouponResultDto { Error = "Invalid coupon code." };

            if (coupon.ExpiryDate.HasValue && coupon.ExpiryDate < DateTime.UtcNow)
                return new ApplyCouponResultDto { Error = "Coupon has expired." };

            if (coupon.UsageLimit.HasValue && coupon.TimesUsed >= coupon.UsageLimit)
                return new ApplyCouponResultDto { Error = "Coupon usage limit reached." };

            if (coupon.MinOrderAmount.HasValue && dto.OrderTotal < coupon.MinOrderAmount)
                return new ApplyCouponResultDto { Error = $"Minimum order amount is ${coupon.MinOrderAmount}." };

            var productIds = JsonSerializer.Deserialize<List<int>>(coupon.ProductIdsJson ?? "[]") ?? new List<int>();
            if (productIds.Count > 0)
            {
                if (!dto.ProductId.HasValue || !productIds.Contains(dto.ProductId.Value))
                    return new ApplyCouponResultDto { Error = "This coupon is not valid for this product." };
            }

            var categoryIds = JsonSerializer.Deserialize<List<int>>(coupon.CategoryIdsJson ?? "[]") ?? new List<int>();
            if (categoryIds.Count > 0)
            {
                if (!dto.CategoryId.HasValue || !categoryIds.Contains(dto.CategoryId.Value))
                    return new ApplyCouponResultDto { Error = "This coupon is not valid for this category." };
            }

            decimal discount;
            if (coupon.DiscountType == 0)
            {
                discount = dto.OrderTotal * (coupon.DiscountValue / 100m);
            }
            else
            {
                discount = Math.Min(coupon.DiscountValue, dto.OrderTotal);
            }

            discount = Math.Min(discount, dto.OrderTotal);

            return new ApplyCouponResultDto
            {
                Discount = discount,
                FinalTotal = dto.OrderTotal - discount,
                Error = null
            };
        }

        public async Task<decimal> CalculateDiscountAsync(string code, decimal orderTotal)
        {
            var coupon = await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code == code.ToUpper() && c.IsActive);

            if (coupon == null) return 0;

            if (coupon.DiscountType == 0)
                return Math.Min(orderTotal * (coupon.DiscountValue / 100m), orderTotal);
            else
                return Math.Min(coupon.DiscountValue, orderTotal);
        }

        public async Task MarkCouponAsUsedAsync(string code)
        {
            var coupon = await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code == code.ToUpper());

            if (coupon == null) return;

            coupon.TimesUsed += 1;

            if (coupon.UsageLimit.HasValue && coupon.TimesUsed >= coupon.UsageLimit)
            {
                coupon.IsActive = false;
            }

            await _context.SaveChangesAsync();
        }
    }
}