namespace WebApplication2.DTOs.Products
{
    public class CreateProductDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int StockQuantity { get; set; }
        public int CategoryId { get; set; }
        public int Gender { get; set; } = 0;
        public int Season { get; set; } = 0;
        public int AgeGroup { get; set; } = 0;
        public int? MaterialId { get; set; }
        public int? StyleId { get; set; }
        public int? OccasionId { get; set; }
        public int? PatternId { get; set; }
    }
}