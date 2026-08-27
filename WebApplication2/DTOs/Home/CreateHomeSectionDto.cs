namespace WebApplication2.DTOs.Home
{
    public class CreateHomeSectionDto
    {
        public string Title { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public int ProductsToShow { get; set; } = 4;
        public string FilterJson { get; set; } = "{}";
    }
}
