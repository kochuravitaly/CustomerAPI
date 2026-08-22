using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.Products;
using WebApplication2.Models;
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
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);

            await _context.SaveChangesAsync();

            return await GetProductByIdAsync(product.Id);
        }
        public async Task<ProductResponseDto?> GetProductByIdAsync(int id)
        {
            return await _context.Products
                .AsNoTracking()
                .Where(p => p.Id == id)
                .Select(p => new ProductResponseDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    StockQuantity = p.StockQuantity,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category.Name,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,

                    Images = p.ProductImages
                        .OrderBy(i => i.SortOrder)
                        .Select(i => new ProductImageResponseDto
                        {
                            Id = i.Id,
                            ProductId = i.ProductId,
                            FileName = i.FileName,
                            ContentType = i.ContentType,
                            FileSize = i.FileSize,
                            SortOrder = i.SortOrder,
                            IsMain = i.IsMain,
                            ObjectKey = i.ObjectKey
                        })
                        .ToList()
                })
                .SingleOrDefaultAsync();
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
            var products = _context.Products.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var search = query.Search.Trim();

                products = products.Where(p =>
                    EF.Functions.ILike(p.Name, $"%{search}%") ||
                    EF.Functions.ILike(p.Description, $"%{search}%"));
            }

            if (query.CategoryId.HasValue)
            {
                products = products.Where(p =>
                    p.CategoryId == query.CategoryId.Value);
            }

            if (query.MinPrice.HasValue)
            {
                products = products.Where(p =>
                    p.Price >= query.MinPrice.Value);
            }

            if (query.MaxPrice.HasValue)
            {
                products = products.Where(p =>
                    p.Price <= query.MaxPrice.Value);
            }

            var totalCount = await products.CountAsync();

            products = query.SortBy.ToLower() switch
            {
                "name" => query.SortDirection.ToLower() == "asc"
                    ? products.OrderBy(p => p.Name)
                    : products.OrderByDescending(p => p.Name),

                "price" => query.SortDirection.ToLower() == "asc"
                    ? products.OrderBy(p => p.Price)
                    : products.OrderByDescending(p => p.Price),

                "stock" => query.SortDirection.ToLower() == "asc"
                    ? products.OrderBy(p => p.StockQuantity)
                    : products.OrderByDescending(p => p.StockQuantity),

                "updatedat" => query.SortDirection.ToLower() == "asc"
                    ? products.OrderBy(p => p.UpdatedAt)
                    : products.OrderByDescending(p => p.UpdatedAt),

                _ => query.SortDirection.ToLower() == "asc"
                    ? products.OrderBy(p => p.CreatedAt)
                    : products.OrderByDescending(p => p.CreatedAt)
            };

            var page = Math.Max(query.Page, 1);
            var pageSize = Math.Clamp(query.PageSize, 1, 100);

            var items = await products
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new ProductResponseDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    StockQuantity = p.StockQuantity,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category.Name,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,

                    Images = p.ProductImages
                        .OrderBy(i => i.SortOrder)
                        .Select(i => new ProductImageResponseDto
                        {
                            Id = i.Id,
                            ProductId = i.ProductId,
                            FileName = i.FileName,
                            ContentType = i.ContentType,
                            FileSize = i.FileSize,
                            SortOrder = i.SortOrder,
                            IsMain = i.IsMain,
                            ObjectKey = i.ObjectKey
                        })
                        .ToList()
                })
                .ToListAsync();

            var totalPages = (int)Math.Ceiling(
                totalCount / (double)pageSize);

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
