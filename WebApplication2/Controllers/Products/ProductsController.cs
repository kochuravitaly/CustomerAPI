using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication2.DTOs.Products;
using WebApplication2.Services.Products.Interfaces;

namespace WebApplication2.Controllers.Products
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;

        public ProductsController(IProductService productService)
        {
            _productService = productService;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<ProductResponseDto>> CreateProduct(CreateProductDto dto)
        {
            var product = await _productService.CreateProductAsync(dto);

            if (product == null)
                return NotFound("Category not found.");

            return CreatedAtAction(
                nameof(GetProductById),
                new { id = product.Id },
                product);
        }

        [HttpGet]
        public async Task<ActionResult<PagedResponseDto<ProductResponseDto>>> GetAllProducts([FromQuery] ProductQueryDto query)
        {
            var products = await _productService.GetAllProductsAsync(query);
            return Ok(products);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductResponseDto>> GetProductById(int id)
        {
            var product = await _productService.GetProductByIdAsync(id);

            if (product == null)
                return NotFound("Product not found.");

            return Ok(product);
        }

        [Authorize(Roles = "Admin")]
        [HttpPatch("{id}")]
        public async Task<IActionResult> UpdateProduct(int id, UpdateProductDto dto)
        {
            var result = await _productService.UpdateProductAsync(id, dto);

            if (!result)
                return NotFound();

            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var result = await _productService.DeleteProductAsync(id);

            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpGet("best-sellers")]
        public async Task<ActionResult<IEnumerable<ProductResponseDto>>> GetBestSellers()
        {
            var products = await _productService.GetBestSellersAsync();
            return Ok(products);
        }

        [HttpGet("{id}/recommendations")]
        public async Task<ActionResult<List<RecommendationDto>>> GetRecommendations(int id)
        {
            var recommendations = await _productService.GetRecommendationsAsync(id);
            return Ok(recommendations);
        }

        [HttpGet("suggestions")]
        public async Task<ActionResult<List<ProductSuggestionDto>>> GetSuggestions([FromQuery] string search)
        {
            var suggestions = await _productService.GetSuggestionsAsync(search);
            return Ok(suggestions);
        }

        [HttpGet("{id}/recommendations/all")]
        public async Task<ActionResult<List<RecommendationDto>>> GetAllRecommendations(
            int id,
            string? sortBy = null,
            string? sortDirection = "desc",
            decimal? minPrice = null,
            decimal? maxPrice = null,
            int? minTimesBought = null)
        {
            var recommendations = await _productService.GetAllRecommendationsAsync(
                id, sortBy, sortDirection, minPrice, maxPrice, minTimesBought);
            return Ok(recommendations);
        }

        [HttpGet("{id}/similar")]
        public async Task<ActionResult<PagedResponseDto<ProductResponseDto>>> GetSimilarProducts(
            int id,
            [FromQuery] ProductQueryDto query)
        {
            var products = await _productService.GetSimilarProductsAsync(id, query);
            return Ok(products);
        }
    }
}