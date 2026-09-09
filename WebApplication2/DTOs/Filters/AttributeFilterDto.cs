namespace WebApplication2.DTOs.Filters
{
    public class AttributeFilterDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public Dictionary<string, string> NameTranslations { get; set; } = new();
    }
}
