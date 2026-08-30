using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.ShoppingCart;
using WebApplication2.Models.ShoppingCart;

namespace WebApplication2.Services.ShoppingCart
{
    public class CartService : ICartService
    {
        private readonly AppDbContext _context;

        public CartService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<CartResponseDto> GetCartAsync(Guid customerId)
        {
            var cart = await _context.Carts
                .AsNoTracking()
                .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Product)
                    .ThenInclude(p => p.ProductImages)
                .SingleOrDefaultAsync(c => c.CustomerId == customerId);

            if (cart == null)
            {
                return new CartResponseDto();
            }

            var items = cart.CartItems
                .Select(ci => new CartItemResponseDto
                {
                    ProductId = ci.ProductId,
                    ProductName = ci.Product.Name,
                    UnitPrice = ci.Product.Price,
                    Quantity = ci.Quantity,
                    Total = ci.Product.Price * ci.Quantity,
                    MainImageId = ci.Product.ProductImages
                        .OrderBy(i => i.SortOrder)
                        .Select(i => i.Id)
                        .FirstOrDefault()
                })
                .ToList();

            return new CartResponseDto
            {
                CartItems = items,
                Total = items.Sum(i => i.Total)
            };
        }

        public async Task<bool> AddCartItemAsync(Guid customerId, AddCartItemDto dto)
        {
            var product = await _context.Products
                .SingleOrDefaultAsync(p => p.Id == dto.ProductId);

            if (product == null)
                return false;

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .SingleOrDefaultAsync(c => c.CustomerId == customerId);

            if (cart == null)
            {
                if (dto.Quantity > product.StockQuantity)
                    return false;

                cart = new Cart
                {
                    CustomerId = customerId
                };

                cart.CartItems.Add(new CartItem
                {
                    ProductId = dto.ProductId,
                    Quantity = dto.Quantity
                });

                _context.Carts.Add(cart);

                await _context.SaveChangesAsync();

                return true;
            }

            var cartItem = cart.CartItems
                .SingleOrDefault(ci => ci.ProductId == dto.ProductId);

            if (cartItem != null)
            {
                var newQuantity = cartItem.Quantity + dto.Quantity;

                if (newQuantity > product.StockQuantity)
                    return false;

                cartItem.Quantity = newQuantity;
            }
            else
            {
                if (dto.Quantity > product.StockQuantity)
                    return false;

                cart.CartItems.Add(new CartItem
                {
                    ProductId = dto.ProductId,
                    Quantity = dto.Quantity
                });
            }

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UpdateCartItemAsync(Guid customerId, int productId, UpdateCartItemDto dto)
        {
            var cartItem = await _context.CartItems
                .Include(ci => ci.Cart)
                .Include(ci => ci.Product)
                .SingleOrDefaultAsync(ci =>
                    ci.Cart.CustomerId == customerId &&
                    ci.ProductId == productId);

            if (cartItem == null)
                return false;

            if (dto.Quantity > cartItem.Product.StockQuantity)
                return false;

            cartItem.Quantity = dto.Quantity;

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> RemoveCartItemAsync(Guid customerId, int productId)
        {
            var cartItem = await _context.CartItems
                .Include(ci => ci.Cart)
                .SingleOrDefaultAsync(ci =>
                    ci.Cart.CustomerId == customerId &&
                    ci.ProductId == productId);

            if (cartItem == null)
                return false;

            _context.CartItems.Remove(cartItem);

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task ClearCartAsync(Guid customerId)
        {
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .SingleOrDefaultAsync(c => c.CustomerId == customerId);

            if (cart == null)
                return;

            _context.CartItems.RemoveRange(cart.CartItems);

            await _context.SaveChangesAsync();
        }
    }
}