using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication2.DTOs.Products;
using WebApplication2.Services.Products.Interfaces;

namespace WebApplication2.Controllers
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
    }
}