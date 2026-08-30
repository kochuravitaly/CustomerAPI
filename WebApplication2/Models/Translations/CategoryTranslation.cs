using System.Text.Json.Serialization;
using WebApplication2.Models.Products;

namespace WebApplication2.Models.Translations
{
    public class CategoryTranslation
    {
        public int Id { get; set; }
        public int CategoryId { get; set; }
        public string LanguageCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        [JsonIgnore]
        public Category? Category { get; set; }
    }
}
