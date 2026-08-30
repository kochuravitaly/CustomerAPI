using WebApplication2.DTOs.Wishlist;

namespace WebApplication2.Services.Wishlist
{
    public interface IWishlistService
    {
        Task<IEnumerable<WishlistItemResponseDto>> GetWishlistAsync(Guid customerId);
        Task<bool> AddToWishlistAsync(Guid customerId, AddWishlistItemDto dto);
        Task<bool> RemoveFromWishlistAsync(Guid customerId, int productId);
        Task<bool> IsInWishlistAsync(Guid customerId, int productId);
        Task ClearWishlistAsync(Guid customerId);
    }
}