namespace WebApplication2.DTOs.Products
{
    public class RecommendationDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public Dictionary<string, string> ProductNameTranslations { get; set; } = new();
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public int TimesBoughtTogether { get; set; }
    }
}