using WebApplication2.DTOs.Home;
using WebApplication2.DTOs.Products;

namespace WebApplication2.Services.Home
{
    public interface IHomeSectionService
    {
        Task<IEnumerable<HomeSectionResponseDto>> GetActiveSectionsAsync();
        Task<IEnumerable<HomeSectionResponseDto>> GetAllSectionsAsync();
        Task<HomeSectionResponseDto?> CreateSectionAsync(CreateHomeSectionDto dto);
        Task<HomeSectionResponseDto?> UpdateSectionAsync(int id, CreateHomeSectionDto dto);
        Task<bool> DeleteSectionAsync(int id);
        Task<PagedResponseDto<ProductResponseDto>> GetSectionProductsAsync(int sectionId, int page = 1, int pageSize = 4);
    }
}