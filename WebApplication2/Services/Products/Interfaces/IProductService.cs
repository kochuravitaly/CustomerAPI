using WebApplication2.DTOs.Products;

namespace WebApplication2.Services.Products.Interfaces
{
    public interface IProductService
    {
        Task<ProductResponseDto?> CreateProductAsync(CreateProductDto dto);
        Task<PagedResponseDto<ProductResponseDto>> GetAllProductsAsync(ProductQueryDto query);
        Task<ProductResponseDto?> GetProductByIdAsync(int id);
        Task<bool> UpdateProductAsync(int id, UpdateProductDto dto);
        Task<bool> DeleteProductAsync(int id);
        Task<IEnumerable<ProductResponseDto>> GetBestSellersAsync();
        Task<List<RecommendationDto>> GetRecommendationsAsync(int productId);
        Task<List<ProductSuggestionDto>> GetSuggestionsAsync(string search);
        Task<List<RecommendationDto>> GetAllRecommendationsAsync(int productId, string? sortBy = null, string? sortDirection = "desc", decimal? minPrice = null, decimal? maxPrice = null, int? minTimesBought = null);
        Task<PagedResponseDto<ProductResponseDto>> GetSimilarProductsAsync(int productId, ProductQueryDto query);
    }
}