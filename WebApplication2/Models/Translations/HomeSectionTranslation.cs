using System.Text.Json.Serialization;
using WebApplication2.Models.Home;
using WebApplication2.Models.Orders;

namespace WebApplication2.Models.Translations
{
    public class HomeSectionTranslation
    {
        public int Id { get; set; }
        public int HomeSectionId { get; set; }
        public string LanguageCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;

        [JsonIgnore]
        public HomeSection? HomeSection { get; set; }
    }
}