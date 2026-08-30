using WebApplication2.DTOs.Products;

namespace WebApplication2.Services.Products.Interfaces
{
    public interface IAttributeService
    {
        Task<IEnumerable<ProductAttributeDto>> GetMaterialsAsync(string languageCode = "en");
        Task<IEnumerable<ProductAttributeDto>> GetStylesAsync(string languageCode = "en");
        Task<IEnumerable<ProductAttributeDto>> GetOccasionsAsync(string languageCode = "en");
        Task<IEnumerable<ProductAttributeDto>> GetPatternsAsync(string languageCode = "en");

        Task<ProductAttributeDto?> CreateMaterialAsync(CreateProductAttributeDto dto);
        Task<ProductAttributeDto?> CreateStyleAsync(CreateProductAttributeDto dto);
        Task<ProductAttributeDto?> CreateOccasionAsync(CreateProductAttributeDto dto);
        Task<ProductAttributeDto?> CreatePatternAsync(CreateProductAttributeDto dto);

        Task<bool> UpdateMaterialAsync(int id, CreateProductAttributeDto dto);
        Task<bool> UpdateStyleAsync(int id, CreateProductAttributeDto dto);
        Task<bool> UpdateOccasionAsync(int id, CreateProductAttributeDto dto);
        Task<bool> UpdatePatternAsync(int id, CreateProductAttributeDto dto);

        Task<bool> DeleteMaterialAsync(int id);
        Task<bool> DeleteStyleAsync(int id);
        Task<bool> DeleteOccasionAsync(int id);
        Task<bool> DeletePatternAsync(int id);
    }
}
