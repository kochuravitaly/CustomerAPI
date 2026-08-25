namespace WebApplication2.DTOs.Products
{
    public class UpdateProductDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public decimal? Price { get; set; }
        public int? StockQuantity { get; set; }
        public int? CategoryId { get; set; }
        public int? Gender { get; set; }
        public int? Season { get; set; }
        public int? AgeGroup { get; set; }
        public int? MaterialId { get; set; }
        public int? StyleId { get; set; }
        public int? OccasionId { get; set; }
        public int? PatternId { get; set; }
    }
}