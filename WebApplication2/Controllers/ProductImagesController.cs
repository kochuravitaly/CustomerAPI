using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebApplication2.DTOs.Products;
using WebApplication2.Services.FileStorage.Interfaces;
using WebApplication2.Services.Products.Interfaces;

namespace WebApplication2.Controllers
{
    [ApiController]
    [Route("api/products/{productId}/images")]
    public class ProductImagesController : ControllerBase
    {
        private readonly IProductImageService _productImageService;
        private readonly IFileStorageService _fileStorageService;

        public ProductImagesController(
            IProductImageService productImageService,
            IFileStorageService fileStorageService)
        {
            _productImageService = productImageService;
            _fileStorageService = fileStorageService;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Upload(
            int productId,
            [FromForm] IFormFile file,
            [FromQuery] int? colorId = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var image = await _productImageService.UploadAsync(
                    productId,
                    file,
                    colorId,
                    cancellationToken);

                if (image is null)
                    return NotFound("Product not found.");

                return Ok(image);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{imageId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetImage(
            int productId,
            int imageId,
            CancellationToken cancellationToken = default)
        {
            var image = await _productImageService.GetByIdAsync(
                productId,
                imageId,
                cancellationToken);

            if (image == null)
                return NotFound();

            try
            {
                var stream = await _fileStorageService.GetFileAsync(
                    image.ObjectKey,
                    cancellationToken);

                return File(stream, image.ContentType);
            }
            catch
            {
                return NotFound();
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{imageId}")]
        public async Task<IActionResult> Delete(
            int productId,
            int imageId,
            CancellationToken cancellationToken = default)
        {
            var deleted = await _productImageService.DeleteAsync(
                productId,
                imageId,
                cancellationToken);

            if (!deleted)
                return NotFound("Image not found.");

            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{imageId}/main")]
        public async Task<IActionResult> SetMain(
            int productId,
            int imageId,
            CancellationToken cancellationToken = default)
        {
            var updated = await _productImageService.SetMainAsync(
                productId,
                imageId,
                cancellationToken);

            if (!updated)
                return NotFound("Image not found.");

            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{imageId}/sort-order")]
        public async Task<IActionResult> UpdateSortOrder(
            int productId,
            int imageId,
            UpdateProductImageOrderDto dto,
            CancellationToken cancellationToken = default)
        {
            var updated = await _productImageService.UpdateSortOrderAsync(
                productId,
                imageId,
                dto.SortOrder,
                cancellationToken);

            if (!updated)
                return NotFound("Image not found.");

            return NoContent();
        }
    }
}