namespace WebApplication2.DTOs.ShoppingCart
{
    public class CartResponseDto
    {
        public List<CartItemResponseDto> CartItems { get; set; } = [];
        public decimal Total { get; set; }
    }
}
