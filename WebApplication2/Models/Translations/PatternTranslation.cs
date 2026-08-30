using System.Text.Json.Serialization;
using WebApplication2.Models.Products;

namespace WebApplication2.Models.Translations
{
    public class PatternTranslation
    {
        public int Id { get; set; }
        public int PatternId { get; set; }
        public string LanguageCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;

        [JsonIgnore]
        public ProductPattern? Pattern { get; set; }
    }
}