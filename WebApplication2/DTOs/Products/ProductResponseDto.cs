using WebApplication2.Models.Products;

namespace WebApplication2.DTOs.Products
{
    public class ProductResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public ProductGender? Gender { get; set; }
        public ProductSeason? Season { get; set; }
        public ProductAgeGroup? AgeGroup { get; set; }
        public string SeasonsJson { get; set; } = "[]";
        public string AgeGroupsJson { get; set; } = "[]";
        public string MaterialCompositionJson { get; set; } = "[]";
        public int? MaterialId { get; set; }
        public string? MaterialName { get; set; }
        public int? StyleId { get; set; }
        public string? StyleName { get; set; }
        public int? OccasionId { get; set; }
        public string? OccasionName { get; set; }
        public int? PatternId { get; set; }
        public string? PatternName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<ProductImageResponseDto> Images { get; set; } = [];
        public Dictionary<string, string> NameTranslations { get; set; } = new();
        public Dictionary<string, string?> DescriptionTranslations { get; set; } = new();
    }
}