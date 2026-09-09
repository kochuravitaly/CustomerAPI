namespace WebApplication2.DTOs.Filters
{
    public class ColorFilterDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string HexCode { get; set; } = string.Empty;
        public Dictionary<string, string> NameTranslations { get; set; } = new();
    }
}
