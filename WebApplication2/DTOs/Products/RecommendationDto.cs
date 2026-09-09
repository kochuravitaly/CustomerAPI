namespace WebApplication2.DTOs.Products
{
    public class RecommendationDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public Dictionary<string, string> ProductNameTranslations { get; set; } = new();
        public string? ProductDescription { get; set; }
        public Dictionary<string, string?> ProductDescriptionTranslations { get; set; } = new();
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public string? ImageUrl { get; set; }
        public int TimesBoughtTogether { get; set; }
        public List<ProductImageResponseDto> Images { get; set; } = new();
    }
}