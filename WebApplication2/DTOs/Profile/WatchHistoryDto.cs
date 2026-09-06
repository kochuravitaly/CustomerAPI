namespace WebApplication2.DTOs.Profile
{
    public class WatchHistoryDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public DateTime ViewedAt { get; set; }
    }
}