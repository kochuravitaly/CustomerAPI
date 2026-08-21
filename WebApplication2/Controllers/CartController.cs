using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using WebApplication2.DTOs.ShoppingCart;
using WebApplication2.Services.ShoppingCart;

namespace WebApplication2.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;

        public CartController(ICartService cartService)
        {
            _cartService = cartService;
        }

        [HttpGet]
        public async Task<ActionResult<CartResponseDto>> GetCart()
        {
            var customerId = GetCustomerId();

            var cart = await _cartService.GetCartAsync(customerId);

            return Ok(cart);
        }

        [HttpPost("items")]
        public async Task<IActionResult> AddCartItem(AddCartItemDto dto)
        {
            var customerId = GetCustomerId();

            var result = await _cartService.AddCartItemAsync(
                customerId,
                dto);

            if (!result)
                return NotFound("Product not found.");

            return NoContent();
        }

        [HttpPatch("items/{productId}")]
        public async Task<IActionResult> UpdateCartItem(int productId, UpdateCartItemDto dto)
        {
            var customerId = GetCustomerId();

            var result = await _cartService.UpdateCartItemAsync(
                customerId,
                productId,
                dto);

            if (!result)
                return NotFound("Cart item not found.");

            return NoContent();
        }

        [HttpDelete("items/{productId}")]
        public async Task<IActionResult> RemoveCartItem( int productId)
        {
            var customerId = GetCustomerId();

            var result = await _cartService.RemoveCartItemAsync(
                customerId,
                productId);

            if (!result)
                return NotFound("Cart item not found.");

            return NoContent();
        }

        [HttpDelete]
        public async Task<IActionResult> ClearCart()
        {
            var customerId = GetCustomerId();

            await _cartService.ClearCartAsync(customerId);

            return NoContent();
        }

        private Guid GetCustomerId()
        {
            return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
        }
    }
}
