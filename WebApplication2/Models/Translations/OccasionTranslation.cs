using System.Text.Json.Serialization;
using WebApplication2.Models.Products;

namespace WebApplication2.Models.Translations
{
    public class OccasionTranslation
    {
        public int Id { get; set; }
        public int OccasionId { get; set; }
        public string LanguageCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;

        [JsonIgnore]
        public ProductOccasion? Occasion { get; set; }
    }
}