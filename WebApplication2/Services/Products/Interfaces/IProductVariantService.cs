using WebApplication2.DTOs.Products;

namespace WebApplication2.Services.Products.Interfaces
{
    public interface IProductVariantService
    {
        Task<List<ProductVariantResponseDto>> GetProductVariantsAsync(int productId);
        Task<List<ProductColorDto>> GetProductColorsAsync(int productId);
        Task<List<ProductSizeDto>> GetProductSizesAsync(int productId);
        Task<ProductVariantResponseDto?> CreateVariantAsync(int productId, CreateProductVariantDto dto);
        Task<ProductColorDto?> CreateColorAsync(int productId, CreateProductColorDto dto);
        Task<ProductSizeDto?> CreateSizeAsync(int productId, CreateProductSizeDto dto);
        Task<bool> DeleteVariantAsync(int variantId);
        Task<bool> DeleteColorAsync(int productId, int colorId);
        Task<bool> DeleteSizeAsync(int productId, int sizeId);
    }
}