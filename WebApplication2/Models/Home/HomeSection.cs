using WebApplication2.Models.Translations;

namespace WebApplication2.Models.Home
{
    public class HomeSection
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public int ProductsToShow { get; set; } = 4;
        public bool IsActive { get; set; } = true;
        public string FilterJson { get; set; } = "{}";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<HomeSectionTranslation> Translations { get; set; } = [];
    }
}
