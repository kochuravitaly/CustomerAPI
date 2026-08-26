using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.Products;

namespace WebApplication2.Controllers
{
    [ApiController]
    [Route("api/products")]
    public class BestSellersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BestSellersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("best-sellers")]
        public async Task<ActionResult<IEnumerable<ProductResponseDto>>> GetBestSellers()
        {
            var products = await _context.Products
                .AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.ProductImages)
                .Include(p => p.Translations)
                .Where(p => p.OrderItems.Any())
                .OrderByDescending(p => p.OrderItems.Count)
                .Take(50)
                .ToListAsync();

            var items = products.Select(p => new ProductResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                StockQuantity = p.StockQuantity,
                CategoryId = p.CategoryId,
                CategoryName = p.Category?.Name ?? "",
                Gender = p.Gender,
                Season = p.Season,
                AgeGroup = p.AgeGroup,
                MaterialId = p.MaterialId,
                StyleId = p.StyleId,
                OccasionId = p.OccasionId,
                PatternId = p.PatternId,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                Images = p.ProductImages.OrderBy(i => i.SortOrder).Select(i => new ProductImageResponseDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    ColorId = i.ColorId,
                    FileName = i.FileName,
                    ContentType = i.ContentType,
                    FileSize = i.FileSize,
                    SortOrder = i.SortOrder,
                    IsMain = i.IsMain,
                    ObjectKey = i.ObjectKey
                }).ToList(),
                NameTranslations = p.Translations.ToDictionary(t => t.LanguageCode, t => t.Name),
                DescriptionTranslations = p.Translations.ToDictionary(t => t.LanguageCode, t => t.Description)
            }).ToList();

            return Ok(items);
        }
    }
}