namespace WebApplication2.DTOs.Home
{
    public class HomeSectionResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public int ProductsToShow { get; set; }
        public bool IsActive { get; set; }
        public string FilterJson { get; set; } = "{}";
    }
}
