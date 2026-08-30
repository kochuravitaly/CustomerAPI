using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.Wishlist;
using WebApplication2.Models.Wishlist;

namespace WebApplication2.Services.Wishlist
{
    public class WishlistService : IWishlistService
    {
        private readonly AppDbContext _context;

        public WishlistService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<WishlistItemResponseDto>> GetWishlistAsync(Guid customerId)
        {
            var items = await _context.WishlistItems
                .AsNoTracking()
                .Include(w => w.Product)
                    .ThenInclude(p => p.Category)
                .Include(w => w.Product)
                    .ThenInclude(p => p.ProductImages)
                .Include(w => w.Product)
                    .ThenInclude(p => p.Translations)
                .Where(w => w.CustomerId == customerId)
                .OrderByDescending(w => w.AddedAt)
                .ToListAsync();

            return items.Select(w => new WishlistItemResponseDto
            {
                Id = w.Id,
                ProductId = w.ProductId,
                ProductName = w.Product?.Name ?? "",
                Price = w.Product?.Price ?? 0,
                CategoryName = w.Product?.Category?.Name,
                StockQuantity = w.Product?.StockQuantity ?? 0,
                MainImageId = w.Product?.ProductImages
                    .OrderBy(i => i.SortOrder)
                    .Select(i => i.Id)
                    .FirstOrDefault(),
                NameTranslations = w.Product?.Translations
                    .ToDictionary(t => t.LanguageCode, t => t.Name) ?? new Dictionary<string, string>(),
                AddedAt = w.AddedAt
            });
        }

        public async Task<bool> AddToWishlistAsync(Guid customerId, AddWishlistItemDto dto)
        {
            var productExists = await _context.Products.AnyAsync(p => p.Id == dto.ProductId);
            if (!productExists) return false;

            var existing = await _context.WishlistItems
                .FirstOrDefaultAsync(w => w.CustomerId == customerId && w.ProductId == dto.ProductId);

            if (existing != null) return true;

            _context.WishlistItems.Add(new WishlistItem
            {
                CustomerId = customerId,
                ProductId = dto.ProductId
            });

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveFromWishlistAsync(Guid customerId, int productId)
        {
            var item = await _context.WishlistItems
                .FirstOrDefaultAsync(w => w.CustomerId == customerId && w.ProductId == productId);

            if (item == null) return false;

            _context.WishlistItems.Remove(item);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> IsInWishlistAsync(Guid customerId, int productId)
        {
            return await _context.WishlistItems
                .AnyAsync(w => w.CustomerId == customerId && w.ProductId == productId);
        }

        public async Task ClearWishlistAsync(Guid customerId)
        {
            var items = await _context.WishlistItems
                .Where(w => w.CustomerId == customerId)
                .ToListAsync();

            _context.WishlistItems.RemoveRange(items);
            await _context.SaveChangesAsync();
        }
    }
}