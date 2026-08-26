using WebApplication2.Models.Products;

namespace WebApplication2.DTOs.Products
{
    public class CreateProductDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public int CategoryId { get; set; }
        public ProductGender Gender { get; set; } = ProductGender.Unisex;
        public ProductSeason Season { get; set; } = ProductSeason.AllSeason;
        public ProductAgeGroup AgeGroup { get; set; } = ProductAgeGroup.Adult;
        public string SeasonsJson { get; set; } = "[]";
        public string AgeGroupsJson { get; set; } = "[]";
        public string MaterialCompositionJson { get; set; } = "[]";
        public int? MaterialId { get; set; }
        public int? StyleId { get; set; }
        public int? OccasionId { get; set; }
        public int? PatternId { get; set; }
    }
}