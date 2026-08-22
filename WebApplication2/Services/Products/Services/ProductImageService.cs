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
        private readonly IFileStorageService _fileStorageService;
        private readonly ILogger<ProductImageService> _logger;
        private readonly IImageFileValidator _imageFileValidator;

        public ProductImageService(AppDbContext context, IFileStorageService fileStorageService, ILogger<ProductImageService> logger, IImageFileValidator imageFileValidator)
        {
            _context = context;
            _fileStorageService = fileStorageService;
            _logger = logger;
            _imageFileValidator = imageFileValidator;
        }

        public async Task<ProductImageResponseDto?> UploadAsync(
            int productId,
            IFormFile file,
            CancellationToken cancellationToken)
        {
            var validationError = _imageFileValidator.Validate(file);

            if (validationError is not null)
                throw new ArgumentException(validationError);

            var productExists = await _context.Products
                .AnyAsync(
                    p => p.Id == productId,
                    cancellationToken);

            if (!productExists)
                return null;

            var objectKey = $"products/{productId}/{Guid.NewGuid()}{Path.GetExtension(file.FileName).ToLowerInvariant()}";

            await using var stream = file.OpenReadStream();

            await _fileStorageService.UploadAsync(
                stream,
                objectKey,
                file.ContentType,
                cancellationToken);

            var nextSortOrder = await _context.ProductImages
                .Where(i => i.ProductId == productId)
                .Select(i => (int?)i.SortOrder)
                .MaxAsync(cancellationToken) ?? -1;

            nextSortOrder++;

            var image = new ProductImage
            {
                ProductId = productId,
                ObjectKey = objectKey,
                FileName = file.FileName,
                ContentType = file.ContentType,
                FileSize = file.Length,
                SortOrder = nextSortOrder,
                IsMain = false
            };

            try
            {
                _context.ProductImages.Add(image);

                await _context.SaveChangesAsync(cancellationToken);
            }
            catch
            {
                try
                {
                    await _fileStorageService.DeleteAsync(
                        objectKey,
                        CancellationToken.None);
                }
                catch (Exception cleanupException)
                {
                    _logger.LogError(
                        cleanupException,
                        "Failed to clean up uploaded object {ObjectKey}.",
                        objectKey);
                }

                throw;
            }

            return new ProductImageResponseDto
            {
                Id = image.Id,
                ProductId = image.ProductId,
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
            CancellationToken cancellationToken)
        {
            var image = await _context.ProductImages
                .FirstOrDefaultAsync(
                    i => i.Id == imageId &&
                         i.ProductId == productId,
                    cancellationToken);

            if (image is null)
                return false;

            var objectKey = image.ObjectKey;

            _context.ProductImages.Remove(image);

            await _context.SaveChangesAsync(cancellationToken);

            try
            {
                await _fileStorageService.DeleteAsync(
                    objectKey,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to delete product image {ObjectKey} from file storage.",
                    objectKey);
            }

            return true;
        }

        public async Task<bool> SetMainAsync(
            int productId,
            int imageId,
            CancellationToken cancellationToken)
        {
            var image = await _context.ProductImages
                .FirstOrDefaultAsync(
                    i => i.Id == imageId &&
                         i.ProductId == productId,
                    cancellationToken);

            if (image is null)
                return false;

            var currentMainImage = await _context.ProductImages
                .FirstOrDefaultAsync(
                    i => i.ProductId == productId &&
                         i.IsMain,
                    cancellationToken);

            if (currentMainImage is not null)
                currentMainImage.IsMain = false;

            image.IsMain = true;

            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }

        public async Task<bool> UpdateSortOrderAsync(
            int productId,
            int imageId,
            int newSortOrder,
            CancellationToken cancellationToken)
        {
            var images = await _context.ProductImages
                .Where(i => i.ProductId == productId)
                .OrderBy(i => i.SortOrder)
                .ToListAsync(cancellationToken);

            var image = images.FirstOrDefault(i => i.Id == imageId);

            if (image is null)
                return false;

            if (newSortOrder < 0 || newSortOrder >= images.Count)
                throw new ArgumentException(
                    "Invalid sort order.");

            if (image.SortOrder == newSortOrder)
                return true;

            var oldSortOrder = image.SortOrder;

            if (newSortOrder < oldSortOrder)
            {
                foreach (var otherImage in images)
                {
                    if (otherImage.Id == imageId)
                        continue;

                    if (otherImage.SortOrder >= newSortOrder &&
                        otherImage.SortOrder < oldSortOrder)
                    {
                        otherImage.SortOrder++;
                    }
                }
            }
            else
            {
                foreach (var otherImage in images)
                {
                    if (otherImage.Id == imageId)
                        continue;

                    if (otherImage.SortOrder > oldSortOrder &&
                        otherImage.SortOrder <= newSortOrder)
                    {
                        otherImage.SortOrder--;
                    }
                }
            }

            image.SortOrder = newSortOrder;

            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }

        public async Task<ProductImageResponseDto?> GetByIdAsync(
            int productId,
            int imageId,
            CancellationToken cancellationToken = default)
        {
            var image = await _context.ProductImages
                .FirstOrDefaultAsync(
                    i => i.Id == imageId && i.ProductId == productId,
                    cancellationToken);

            if (image == null)
                return null;

            return new ProductImageResponseDto
            {
                Id = image.Id,
                ProductId = image.ProductId,
                FileName = image.FileName,
                ContentType = image.ContentType,
                FileSize = image.FileSize,
                SortOrder = image.SortOrder,
                IsMain = image.IsMain,
                ObjectKey = image.ObjectKey
            };
        }
    }
}