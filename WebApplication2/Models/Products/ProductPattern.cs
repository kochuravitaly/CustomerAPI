using System.Text.Json.Serialization;
using WebApplication2.Models.Translations;

namespace WebApplication2.Models.Products
{
    public class ProductPattern
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        [JsonIgnore]
        public ICollection<Product> Products { get; set; } = [];
        public ICollection<PatternTranslation> Translations { get; set; } = [];
    }
}