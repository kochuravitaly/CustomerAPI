using WebApplication2.DTOs.Products;

namespace WebApplication2.Services.Products.Interfaces
{
    public interface IProductService
    {
        Task<ProductResponseDto> CreateProductAsync(CreateProductDto dto);
        Task<PagedResponseDto<ProductResponseDto>> GetAllProductsAsync(ProductQueryDto query);
        Task<ProductResponseDto?> GetProductByIdAsync(int id);
        Task<bool> UpdateProductAsync(int id, UpdateProductDto dto);
        Task<bool> DeleteProductAsync(int id);
    }
}
