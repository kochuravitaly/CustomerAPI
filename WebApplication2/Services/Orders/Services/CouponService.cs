using Microsoft.EntityFrameworkCore;
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
                    IsActive = c.IsActive
                })
                .ToListAsync();
        }

        public async Task<CouponResponseDto?> CreateCouponAsync(CreateCouponDto dto)
        {
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
                IsActive = coupon.IsActive
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

        public async Task<string?> ApplyCouponAsync(ApplyCouponDto dto)
        {
            var coupon = await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code == dto.Code.ToUpper() && c.IsActive);

            if (coupon == null)
                return "Invalid coupon code.";

            if (coupon.ExpiryDate.HasValue && coupon.ExpiryDate < DateTime.UtcNow)
                return "Coupon has expired.";

            if (coupon.UsageLimit.HasValue && coupon.TimesUsed >= coupon.UsageLimit)
                return "Coupon usage limit reached.";

            if (coupon.MinOrderAmount.HasValue && dto.OrderTotal < coupon.MinOrderAmount)
                return $"Minimum order amount is ${coupon.MinOrderAmount}.";

            decimal discount = coupon.DiscountType == 0
                ? dto.OrderTotal * (coupon.DiscountValue / 100m)
                : coupon.DiscountValue;

            return null;
        }

        public async Task<decimal> CalculateDiscountAsync(string code, decimal orderTotal)
        {
            var coupon = await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code == code.ToUpper() && c.IsActive);

            if (coupon == null) return 0;

            if (coupon.DiscountType == 0)
                return orderTotal * (coupon.DiscountValue / 100m);
            else
                return Math.Min(coupon.DiscountValue, orderTotal);
        }
    }
}