namespace WebApplication2.DTOs.ShoppingCart
{
    public class CartItemResponseDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public Dictionary<string, string> ProductNameTranslations { get; set; } = new();
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public decimal Total { get; set; }
        public int? MainImageId { get; set; }
        public int? ColorId { get; set; }
        public string? ColorName { get; set; }
        public string? SizeName { get; set; }
    }
}