namespace WebApplication2.DTOs.Products
{
    public class ProductSuggestionDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string MatchedName { get; set; } = string.Empty;
    }
}