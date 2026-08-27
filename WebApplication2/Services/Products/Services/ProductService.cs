using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.Products;
using WebApplication2.Models.Products;
using WebApplication2.Services.Products.Interfaces;

namespace WebApplication2.Services.Products.Services
{
    public class ProductService : IProductService
    {
        private readonly AppDbContext _context;

        public ProductService(AppDbContext context)
        {
            _context = context;
        }

        private ProductResponseDto MapToDto(Product p)
        {
            return new ProductResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                StockQuantity = p.StockQuantity,
                CategoryId = p.CategoryId,
                CategoryName = p.Category?.Name ?? string.Empty,
                Gender = p.Gender,
                Season = p.Season,
                AgeGroup = p.AgeGroup,
                SeasonsJson = p.SeasonsJson,
                AgeGroupsJson = p.AgeGroupsJson,
                MaterialCompositionJson = p.MaterialCompositionJson,
                MaterialId = p.MaterialId,
                MaterialName = p.Material?.Name,
                StyleId = p.StyleId,
                StyleName = p.Style?.Name,
                OccasionId = p.OccasionId,
                OccasionName = p.Occasion?.Name,
                PatternId = p.PatternId,
                PatternName = p.Pattern?.Name,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
                Images = p.ProductImages
                    .OrderBy(i => i.SortOrder)
                    .Select(i => new ProductImageResponseDto
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
                    })
                    .ToList(),
                NameTranslations = p.Translations.ToDictionary(t => t.LanguageCode, t => t.Name),
                DescriptionTranslations = p.Translations.ToDictionary(t => t.LanguageCode, t => t.Description)
            };
        }

        public async Task<ProductResponseDto?> CreateProductAsync(CreateProductDto dto)
        {
            var categoryExists = await _context.Categories
                .AnyAsync(c => c.Id == dto.CategoryId);

            if (!categoryExists)
                return null;

            var product = new Product
            {
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                StockQuantity = dto.StockQuantity,
                CategoryId = dto.CategoryId,
                Gender = dto.Gender,
                Season = dto.Season,
                AgeGroup = dto.AgeGroup,
                SeasonsJson = dto.SeasonsJson,
                AgeGroupsJson = dto.AgeGroupsJson,
                MaterialCompositionJson = dto.MaterialCompositionJson,
                MaterialId = dto.MaterialId,
                StyleId = dto.StyleId,
                OccasionId = dto.OccasionId,
                PatternId = dto.PatternId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return await GetProductByIdAsync(product.Id);
        }

        public async Task<ProductResponseDto?> GetProductByIdAsync(int id)
        {
            var product = await _context.Products
                .AsNoTracking()
                .Include(p => p.Category)
                .Include(p => p.Material)
                .Include(p => p.Style)
                .Include(p => p.Occasion)
                .Include(p => p.Pattern)
                .Include(p => p.ProductImages)
                .Include(p => p.Translations)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
                return null;

            return MapToDto(product);
        }

        public async Task<bool> UpdateProductAsync(int id, UpdateProductDto dto)
        {
            var product = await _context.Products
                .SingleOrDefaultAsync(p => p.Id == id);

            if (product == null)
                return false;

            if (dto.CategoryId.HasValue)
            {
                var categoryExists = await _context.Categories
                    .AnyAsync(c => c.Id == dto.CategoryId.Value);

                if (!categoryExists)
                    return false;

                product.CategoryId = dto.CategoryId.Value;
            }

            if (dto.Name is not null)
                product.Name = dto.Name;

            if (dto.Description is not null)
                product.Description = dto.Description;

            if (dto.Price.HasValue)
                product.Price = dto.Price.Value;

            if (dto.StockQuantity.HasValue)
                product.StockQuantity = dto.StockQuantity.Value;

            product.Gender = dto.Gender;
            product.Season = dto.Season;
            product.AgeGroup = dto.AgeGroup;
            product.MaterialId = dto.MaterialId;
            product.StyleId = dto.StyleId;
            product.OccasionId = dto.OccasionId;
            product.PatternId = dto.PatternId;

            if (dto.SeasonsJson != null)
                product.SeasonsJson = dto.SeasonsJson;

            if (dto.AgeGroupsJson != null)
                product.AgeGroupsJson = dto.AgeGroupsJson;

            if (dto.MaterialCompositionJson != null)
                product.MaterialCompositionJson = dto.MaterialCompositionJson;

            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteProductAsync(int id)
        {
            var product = await _context.Products
                .SingleOrDefaultAsync(p => p.Id == id);

            if (product == null)
                return false;

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<PagedResponseDto<ProductResponseDto>> GetAllProductsAsync(ProductQueryDto query)
        {
            var productsQuery = _context.Products.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var search = query.Search.Trim();
                productsQuery = productsQuery.Where(p =>
                    EF.Functions.ILike(p.Name, $"%{search}%") ||
                    EF.Functions.ILike(p.Description, $"%{search}%"));
            }

            if (query.CategoryId.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.CategoryId == query.CategoryId.Value);
            }

            if (query.MinPrice.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.Price >= query.MinPrice.Value);
            }

            if (query.MaxPrice.HasValue)
            {
                productsQuery = productsQuery.Where(p => p.Price <= query.MaxPrice.Value);
            }

            var totalCount = await productsQuery.CountAsync();

            productsQuery = query.SortBy.ToLower() switch
            {
                "name" => query.SortDirection.ToLower() == "asc"
                    ? productsQuery.OrderBy(p => p.Name)
                    : productsQuery.OrderByDescending(p => p.Name),
                "price" => query.SortDirection.ToLower() == "asc"
                    ? productsQuery.OrderBy(p => p.Price)
                    : productsQuery.OrderByDescending(p => p.Price),
                _ => query.SortDirection.ToLower() == "asc"
                    ? productsQuery.OrderBy(p => p.CreatedAt)
                    : productsQuery.OrderByDescending(p => p.CreatedAt)
            };

            var page = Math.Max(query.Page, 1);
            var pageSize = Math.Clamp(query.PageSize, 1, 100);

            var products = await productsQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Include(p => p.Category)
                .Include(p => p.Material)
                .Include(p => p.Style)
                .Include(p => p.Occasion)
                .Include(p => p.Pattern)
                .Include(p => p.ProductImages)
                .Include(p => p.Translations)
                .ToListAsync();

            var items = products.Select(p => MapToDto(p)).ToList();

            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            return new PagedResponseDto<ProductResponseDto>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = totalPages
            };
        }
    }
}