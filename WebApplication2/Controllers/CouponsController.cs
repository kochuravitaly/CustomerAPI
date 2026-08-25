using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication2.DTOs.Orders;
using WebApplication2.Services.Orders;

namespace WebApplication2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CouponsController : ControllerBase
    {
        private readonly ICouponService _couponService;

        public CouponsController(ICouponService couponService)
        {
            _couponService = couponService;
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CouponResponseDto>>> GetCoupons()
        {
            return Ok(await _couponService.GetCouponsAsync());
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<CouponResponseDto>> CreateCoupon(CreateCouponDto dto)
        {
            var coupon = await _couponService.CreateCouponAsync(dto);
            if (coupon == null) return BadRequest("Coupon already exists.");
            return Ok(coupon);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCoupon(int id)
        {
            var result = await _couponService.DeleteCouponAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }

        [Authorize]
        [HttpPost("apply")]
        public async Task<ActionResult> ApplyCoupon(ApplyCouponDto dto)
        {
            var error = await _couponService.ApplyCouponAsync(dto);
            if (error != null) return BadRequest(error);

            var discount = await _couponService.CalculateDiscountAsync(dto.Code, dto.OrderTotal);
            return Ok(new { discount, finalTotal = dto.OrderTotal - discount });
        }
    }
}