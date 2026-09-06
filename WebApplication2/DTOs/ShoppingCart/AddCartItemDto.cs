namespace WebApplication2.DTOs.ShoppingCart
{
    public class AddCartItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public int? ColorId { get; set; }
        public string? SizeName { get; set; }
    }
}
