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
            if (coupon == null) return BadRequest("Invalid coupon data or code already exists.");
            return Ok(coupon);
        }

        [Authorize(Roles = "Admin")]
        [HttpPatch("{id}")]
        public async Task<ActionResult<CouponResponseDto>> UpdateCoupon(int id, CreateCouponDto dto)
        {
            var coupon = await _couponService.UpdateCouponAsync(id, dto);
            if (coupon == null) return BadRequest("Invalid coupon data or not found.");
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
            var result = await _couponService.ApplyCouponAsync(dto);

            if (result == null)
                return BadRequest(new { error = "Error applying coupon." });

            if (result.Error != null)
                return BadRequest(new { error = result.Error });

            return Ok(new { discount = result.Discount, finalTotal = result.FinalTotal });
        }

        [Authorize]
        [HttpPost("validate")]
        public async Task<ActionResult> ValidateCoupon(ApplyCouponDto dto)
        {
            var result = await _couponService.ApplyCouponAsync(dto);

            if (result == null)
                return BadRequest(new { error = "Error validating coupon." });

            if (result.Error != null)
                return BadRequest(new { error = result.Error });

            return Ok(new { discount = result.Discount, finalTotal = result.FinalTotal });
        }
    }
}