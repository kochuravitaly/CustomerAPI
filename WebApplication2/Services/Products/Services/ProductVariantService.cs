using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.Products;
using WebApplication2.Models.Products;
using WebApplication2.Services.Products.Interfaces;

namespace WebApplication2.Services.Products.Services
{
    public class ProductVariantService : IProductVariantService
    {
        private readonly AppDbContext _context;

        public ProductVariantService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<ProductVariantResponseDto>> GetProductVariantsAsync(int productId)
        {
            return await _context.ProductVariants
                .AsNoTracking()
                .Where(v => v.ProductId == productId)
                .Select(v => new ProductVariantResponseDto
                {
                    Id = v.Id,
                    ColorId = v.ColorId,
                    ColorName = v.Color.Name,
                    HexCode = v.Color.HexCode,
                    SizeId = v.SizeId,
                    SizeName = v.Size.Name,
                    StockQuantity = v.StockQuantity,
                    SKU = v.SKU,
                    Price = v.Price
                })
                .ToListAsync();
        }

        public async Task<List<ProductColorDto>> GetProductColorsAsync(int productId)
        {
            return await _context.ProductColors
                .AsNoTracking()
                .Where(c => c.ProductId == productId)
                .Select(c => new ProductColorDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    HexCode = c.HexCode
                })
                .ToListAsync();
        }

        public async Task<List<ProductSizeDto>> GetProductSizesAsync(int productId)
        {
            return await _context.ProductSizes
                .AsNoTracking()
                .Where(s => s.ProductId == productId)
                .Select(s => new ProductSizeDto
                {
                    Id = s.Id,
                    Name = s.Name
                })
                .ToListAsync();
        }

        public async Task<ProductVariantResponseDto?> CreateVariantAsync(int productId, CreateProductVariantDto dto)
        {
            var productExists = await _context.Products.AnyAsync(p => p.Id == productId);
            if (!productExists) return null;

            var variant = new ProductVariant
            {
                ProductId = productId,
                ColorId = dto.ColorId,
                SizeId = dto.SizeId,
                StockQuantity = dto.StockQuantity,
                SKU = dto.SKU,
                Price = dto.Price
            };

            _context.ProductVariants.Add(variant);
            await _context.SaveChangesAsync();

            return new ProductVariantResponseDto
            {
                Id = variant.Id,
                ColorId = variant.ColorId,
                SizeId = variant.SizeId,
                StockQuantity = variant.StockQuantity,
                SKU = variant.SKU,
                Price = variant.Price
            };
        }

        public async Task<ProductColorDto?> CreateColorAsync(int productId, CreateProductColorDto dto)
        {
            var productExists = await _context.Products.AnyAsync(p => p.Id == productId);
            if (!productExists) return null;

            var color = new ProductColor
            {
                ProductId = productId,
                Name = dto.Name,
                HexCode = dto.HexCode
            };

            _context.ProductColors.Add(color);
            await _context.SaveChangesAsync();

            return new ProductColorDto
            {
                Id = color.Id,
                Name = color.Name,
                HexCode = color.HexCode
            };
        }

        public async Task<ProductSizeDto?> CreateSizeAsync(int productId, CreateProductSizeDto dto)
        {
            var productExists = await _context.Products.AnyAsync(p => p.Id == productId);
            if (!productExists) return null;

            var size = new ProductSize
            {
                ProductId = productId,
                Name = dto.Name
            };

            _context.ProductSizes.Add(size);
            await _context.SaveChangesAsync();

            return new ProductSizeDto
            {
                Id = size.Id,
                Name = size.Name
            };
        }

        public async Task<bool> DeleteVariantAsync(int variantId)
        {
            var variant = await _context.ProductVariants.FindAsync(variantId);
            if (variant == null) return false;

            _context.ProductVariants.Remove(variant);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteColorAsync(int productId, int colorId)
        {
            var color = await _context.ProductColors
                .FirstOrDefaultAsync(c => c.Id == colorId && c.ProductId == productId);

            if (color == null) return false;

            _context.ProductColors.Remove(color);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteSizeAsync(int productId, int sizeId)
        {
            var size = await _context.ProductSizes
                .FirstOrDefaultAsync(s => s.Id == sizeId && s.ProductId == productId);

            if (size == null) return false;

            _context.ProductSizes.Remove(size);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}