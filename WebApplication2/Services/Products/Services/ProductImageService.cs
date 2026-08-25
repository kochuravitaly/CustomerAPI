using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.Products;
using WebApplication2.Models.Products;
using WebApplication2.Services.FileStorage.Interfaces;
using WebApplication2.Services.Products.Interfaces;

namespace WebApplication2.Services.Products.Services
{
    public class ProductImageService : IProductImageService
    {
        private readonly AppDbContext _context;
        private readonly IFileStorageService _fileStorage;
        private readonly IImageFileValidator _imageValidator;

        public ProductImageService(
            AppDbContext context,
            IFileStorageService fileStorage,
            IImageFileValidator imageValidator)
        {
            _context = context;
            _fileStorage = fileStorage;
            _imageValidator = imageValidator;
        }

        public async Task<ProductImageResponseDto?> UploadAsync(
            int productId,
            IFormFile file,
            int? colorId = null,
            CancellationToken cancellationToken = default)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);

            if (product == null)
                return null;

            if (file == null || file.Length == 0)
                return null;

            var objectKey = $"products/{productId}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

            using var stream = file.OpenReadStream();
            await _fileStorage.UploadAsync(stream, objectKey, file.ContentType, cancellationToken);

            var image = new ProductImage
            {
                ProductId = productId,
                ColorId = colorId,
                ObjectKey = objectKey,
                FileName = file.FileName,
                ContentType = file.ContentType,
                FileSize = file.Length,
                SortOrder = 0,
                IsMain = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.ProductImages.Add(image);
            await _context.SaveChangesAsync(cancellationToken);

            return new ProductImageResponseDto
            {
                Id = image.Id,
                ProductId = image.ProductId,
                ColorId = image.ColorId,
                FileName = image.FileName,
                ContentType = image.ContentType,
                FileSize = image.FileSize,
                SortOrder = image.SortOrder,
                IsMain = image.IsMain,
                ObjectKey = image.ObjectKey
            };
        }

        public async Task<ProductImageResponseDto?> GetByIdAsync(
            int productId,
            int imageId,
            CancellationToken cancellationToken = default)
        {
            var image = await _context.ProductImages
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == imageId && i.ProductId == productId, cancellationToken);

            if (image == null)
                return null;

            return new ProductImageResponseDto
            {
                Id = image.Id,
                ProductId = image.ProductId,
                ColorId = image.ColorId,
                FileName = image.FileName,
                ContentType = image.ContentType,
                FileSize = image.FileSize,
                SortOrder = image.SortOrder,
                IsMain = image.IsMain,
                ObjectKey = image.ObjectKey
            };
        }

        public async Task<bool> DeleteAsync(
            int productId,
            int imageId,
            CancellationToken cancellationToken = default)
        {
            var image = await _context.ProductImages
                .FirstOrDefaultAsync(i => i.Id == imageId && i.ProductId == productId, cancellationToken);

            if (image == null)
                return false;

            try
            {
                await _fileStorage.DeleteAsync(image.ObjectKey, cancellationToken);
            }
            catch
            {
                // Ignore storage delete errors
            }

            _context.ProductImages.Remove(image);
            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }

        public async Task<bool> SetMainAsync(
            int productId,
            int imageId,
            CancellationToken cancellationToken = default)
        {
            var image = await _context.ProductImages
                .FirstOrDefaultAsync(i => i.Id == imageId && i.ProductId == productId, cancellationToken);

            if (image == null)
                return false;

            var allProductImages = await _context.ProductImages
                .Where(i => i.ProductId == productId)
                .ToListAsync(cancellationToken);

            foreach (var img in allProductImages)
            {
                img.IsMain = false;
            }

            image.IsMain = true;
            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }

        public async Task<bool> UpdateSortOrderAsync(
            int productId,
            int imageId,
            int sortOrder,
            CancellationToken cancellationToken = default)
        {
            var image = await _context.ProductImages
                .FirstOrDefaultAsync(i => i.Id == imageId && i.ProductId == productId, cancellationToken);

            if (image == null)
                return false;

            image.SortOrder = sortOrder;
            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}