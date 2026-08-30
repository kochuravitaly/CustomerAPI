namespace WebApplication2.DTOs.Wishlist
{
    public class WishlistItemResponseDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? CategoryName { get; set; }
        public int StockQuantity { get; set; }
        public int? MainImageId { get; set; }
        public Dictionary<string, string> NameTranslations { get; set; } = new();
        public DateTime AddedAt { get; set; }
    }
}