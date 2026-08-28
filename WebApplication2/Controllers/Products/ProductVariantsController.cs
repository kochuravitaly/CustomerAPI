using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication2.DTOs.Products;
using WebApplication2.Services.Products.Interfaces;

namespace WebApplication2.Controllers.Products
{
    [ApiController]
    [Route("api/products/{productId}/variants")]
    public class ProductVariantsController : ControllerBase
    {
        private readonly IProductVariantService _variantService;

        public ProductVariantsController(IProductVariantService variantService)
        {
            _variantService = variantService;
        }

        [HttpGet]
        public async Task<ActionResult<List<ProductVariantResponseDto>>> GetVariants(int productId)
        {
            var variants = await _variantService.GetProductVariantsAsync(productId);
            return Ok(variants);
        }

        [HttpGet("colors")]
        public async Task<ActionResult<List<ProductColorDto>>> GetColors(int productId)
        {
            var colors = await _variantService.GetProductColorsAsync(productId);
            return Ok(colors);
        }

        [HttpGet("sizes")]
        public async Task<ActionResult<List<ProductSizeDto>>> GetSizes(int productId)
        {
            var sizes = await _variantService.GetProductSizesAsync(productId);
            return Ok(sizes);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<ProductVariantResponseDto>> CreateVariant(int productId, CreateProductVariantDto dto)
        {
            var variant = await _variantService.CreateVariantAsync(productId, dto);
            if (variant == null) return NotFound();
            return Ok(variant);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("colors")]
        public async Task<ActionResult<ProductColorDto>> CreateColor(int productId, CreateProductColorDto dto)
        {
            var color = await _variantService.CreateColorAsync(productId, dto);
            if (color == null) return NotFound();
            return Ok(color);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("sizes")]
        public async Task<ActionResult<ProductSizeDto>> CreateSize(int productId, CreateProductSizeDto dto)
        {
            var size = await _variantService.CreateSizeAsync(productId, dto);
            if (size == null) return NotFound();
            return Ok(size);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{variantId}")]
        public async Task<IActionResult> DeleteVariant(int variantId)
        {
            var result = await _variantService.DeleteVariantAsync(variantId);
            if (!result) return NotFound();
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("colors/{colorId}")]
        public async Task<IActionResult> DeleteColor(int productId, int colorId)
        {
            var result = await _variantService.DeleteColorAsync(productId, colorId);
            if (!result) return NotFound();
            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("sizes/{sizeId}")]
        public async Task<IActionResult> DeleteSize(int productId, int sizeId)
        {
            var result = await _variantService.DeleteSizeAsync(productId, sizeId);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}