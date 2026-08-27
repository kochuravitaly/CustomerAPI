using WebApplication2.DTOs.Orders;

namespace WebApplication2.Services.Orders
{
    public interface ICouponService
    {
        Task<IEnumerable<CouponResponseDto>> GetCouponsAsync();
        Task<CouponResponseDto?> CreateCouponAsync(CreateCouponDto dto);
        Task<CouponResponseDto?> UpdateCouponAsync(int id, CreateCouponDto dto);
        Task<bool> DeleteCouponAsync(int id);
        Task<ApplyCouponResultDto?> ApplyCouponAsync(ApplyCouponDto dto);
        Task<decimal> CalculateDiscountAsync(string code, decimal orderTotal);
        Task MarkCouponAsUsedAsync(string code);
    }
}