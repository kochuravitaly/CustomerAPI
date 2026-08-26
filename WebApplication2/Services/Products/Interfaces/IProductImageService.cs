using WebApplication2.DTOs.Products;

namespace WebApplication2.Services.Products.Interfaces
{
    public interface IProductImageService
    {
        Task<ProductImageResponseDto?> UploadAsync(
            int productId,
            IFormFile file,
            int? colorId = null,
            CancellationToken cancellationToken = default);

        Task<ProductImageResponseDto?> GetByIdAsync(
            int productId,
            int imageId,
            CancellationToken cancellationToken = default);

        Task<bool> DeleteAsync(
            int productId,
            int imageId,
            CancellationToken cancellationToken = default);

        Task<bool> SetMainAsync(
            int productId,
            int imageId,
            CancellationToken cancellationToken = default);

        Task<bool> UpdateSortOrderAsync(
            int productId,
            int imageId,
            int sortOrder,
            CancellationToken cancellationToken = default);

        Task<bool> UpdateColorAsync(int productId, int imageId, int? colorId);
    }
}