using WebApplication2.DTOs.Products;

namespace WebApplication2.Services.Products.Interfaces
{
    public interface IProductImageService
    {
        Task<ProductImageResponseDto?> UploadAsync(
            int productId,
            IFormFile file,
            CancellationToken cancellationToken);

        Task<bool> DeleteAsync(
            int productId,
            int imageId,
            CancellationToken cancellationToken);

        Task<bool> SetMainAsync(
            int productId,
            int imageId,
            CancellationToken cancellationToken);

        Task<bool> UpdateSortOrderAsync(
            int productId,
            int imageId,
            int newSortOrder,
            CancellationToken cancellationToken);
    }
}
