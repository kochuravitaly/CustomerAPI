namespace WebApplication2.DTOs.ShoppingCart
{
    public class CartItemResponseDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public decimal Total { get; set; }
        public int? MainImageId { get; set; }
    }
}