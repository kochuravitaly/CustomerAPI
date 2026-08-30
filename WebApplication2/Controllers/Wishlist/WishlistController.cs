using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApplication2.DTOs.Wishlist;
using WebApplication2.Services.Wishlist;

namespace WebApplication2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WishlistController : ControllerBase
    {
        private readonly IWishlistService _wishlistService;

        public WishlistController(IWishlistService wishlistService)
        {
            _wishlistService = wishlistService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<WishlistItemResponseDto>>> GetWishlist()
        {
            var customerId = GetCustomerId();
            return Ok(await _wishlistService.GetWishlistAsync(customerId));
        }

        [HttpPost]
        public async Task<IActionResult> AddToWishlist(AddWishlistItemDto dto)
        {
            var customerId = GetCustomerId();
            var result = await _wishlistService.AddToWishlistAsync(customerId, dto);
            if (!result) return NotFound("Product not found");
            return Ok();
        }

        [HttpDelete("{productId}")]
        public async Task<IActionResult> RemoveFromWishlist(int productId)
        {
            var customerId = GetCustomerId();
            var result = await _wishlistService.RemoveFromWishlistAsync(customerId, productId);
            if (!result) return NotFound();
            return NoContent();
        }

        [HttpGet("check/{productId}")]
        public async Task<ActionResult<bool>> IsInWishlist(int productId)
        {
            var customerId = GetCustomerId();
            return Ok(await _wishlistService.IsInWishlistAsync(customerId, productId));
        }

        [HttpDelete]
        public async Task<IActionResult> ClearWishlist()
        {
            var customerId = GetCustomerId();
            await _wishlistService.ClearWishlistAsync(customerId);
            return NoContent();
        }

        private Guid GetCustomerId()
        {
            return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        }
    }
}