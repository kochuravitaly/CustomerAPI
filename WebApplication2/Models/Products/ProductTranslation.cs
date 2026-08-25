using System.Text.Json.Serialization;

namespace WebApplication2.Models.Products
{
    public class ProductTranslation
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string LanguageCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        [JsonIgnore]
        public Product? Product { get; set; }
    }
}
