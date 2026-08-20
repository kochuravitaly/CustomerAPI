using WebApplication2.DTOs.ShoppingCart;

namespace WebApplication2.Services.ShoppingCart
{
    public interface ICartService
    {
        Task<CartResponseDto> GetCartAsync(Guid customerId);
        Task<bool> AddCartItemAsync(Guid customerId, AddCartItemDto dto);
        Task<bool> UpdateCartItemAsync(Guid customerId, int productId, UpdateCartItemDto dto);
        Task<bool> RemoveCartItemAsync(Guid customerId, int productId);
        Task ClearCartAsync(Guid customerId);
    }
}
