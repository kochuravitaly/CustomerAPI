namespace WebApplication2.DTOs.Products
{
    public class CategoryResponseDto
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public Dictionary<string, string> NameTranslations { get; set; } = new();

        public Dictionary<string, string?> DescriptionTranslations { get; set; } = new();
    }
}
