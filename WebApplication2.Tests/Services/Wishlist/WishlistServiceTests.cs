using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.Wishlist;
using WebApplication2.Models.Auth;
using WebApplication2.Models.Products;
using WebApplication2.Models.Wishlist;
using WebApplication2.Services.Wishlist;

namespace WebApplication2.Tests.Services.Wishlist
{
    public class WishlistServiceTests
    {
        private readonly AppDbContext _context;
        private readonly WishlistService _wishlistService;

        public WishlistServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _wishlistService = new WishlistService(_context);

            _context.Roles.Add(new Role { Id = 1, Name = "Customer" });
            _context.Categories.Add(new Category { Name = "Test Category", Description = "" });
            _context.SaveChanges();
        }

        private async Task<Customer> CreateCustomerAsync()
        {
            var customer = new Customer
            {
                Id = Guid.NewGuid(),
                Name = "Test User",
                Email = "test@test.com",
                PasswordHash = "hashed",
                IsEmailConfirmed = true,
                RoleId = 1
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
            return customer;
        }

        private async Task<Product> CreateProductAsync(
            string name = "Test Product",
            decimal price = 100,
            int stockQuantity = 10)
        {
            var product = new Product
            {
                Name = name,
                Description = "",
                Price = price,
                StockQuantity = stockQuantity,
                CategoryId = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return product;
        }

        [Fact]
        public async Task GetWishlistAsync_Should_Return_Empty_When_No_Items()
        {
            var customer = await CreateCustomerAsync();

            var result = await _wishlistService.GetWishlistAsync(customer.Id);

            Assert.Empty(result);
        }

        [Fact]
        public async Task GetWishlistAsync_Should_Return_Items_With_Product_Details()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync("Wishlist Product", 150, 5);

            _context.WishlistItems.Add(new WishlistItem
            {
                CustomerId = customer.Id,
                ProductId = product.Id
            });
            await _context.SaveChangesAsync();

            var result = await _wishlistService.GetWishlistAsync(customer.Id);

            Assert.Single(result);
            var item = result.First();
            Assert.Equal(product.Id, item.ProductId);
            Assert.Equal("Wishlist Product", item.ProductName);
            Assert.Equal(150, item.Price);
            Assert.Equal(5, item.StockQuantity);
            Assert.Equal("Test Category", item.CategoryName);
        }

        [Fact]
        public async Task AddToWishlistAsync_Should_Return_False_When_Product_Not_Found()
        {
            var customer = await CreateCustomerAsync();

            var result = await _wishlistService.AddToWishlistAsync(
                customer.Id,
                new AddWishlistItemDto { ProductId = 999 });

            Assert.False(result);
        }

        [Fact]
        public async Task AddToWishlistAsync_Should_Add_Item()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();

            var result = await _wishlistService.AddToWishlistAsync(
                customer.Id,
                new AddWishlistItemDto { ProductId = product.Id });

            Assert.True(result);
            Assert.Single(await _context.WishlistItems.ToListAsync());
        }

        [Fact]
        public async Task AddToWishlistAsync_Should_Return_True_When_Already_Exists()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();

            _context.WishlistItems.Add(new WishlistItem
            {
                CustomerId = customer.Id,
                ProductId = product.Id
            });
            await _context.SaveChangesAsync();

            var result = await _wishlistService.AddToWishlistAsync(
                customer.Id,
                new AddWishlistItemDto { ProductId = product.Id });

            Assert.True(result);
            Assert.Single(await _context.WishlistItems.ToListAsync());
        }

        [Fact]
        public async Task RemoveFromWishlistAsync_Should_Return_False_When_Not_Found()
        {
            var customer = await CreateCustomerAsync();

            var result = await _wishlistService.RemoveFromWishlistAsync(customer.Id, 999);

            Assert.False(result);
        }

        [Fact]
        public async Task RemoveFromWishlistAsync_Should_Remove_Item()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();

            _context.WishlistItems.Add(new WishlistItem
            {
                CustomerId = customer.Id,
                ProductId = product.Id
            });
            await _context.SaveChangesAsync();

            var result = await _wishlistService.RemoveFromWishlistAsync(customer.Id, product.Id);

            Assert.True(result);
            Assert.Empty(await _context.WishlistItems.ToListAsync());
        }

        [Fact]
        public async Task IsInWishlistAsync_Should_Return_False_When_Not_In_Wishlist()
        {
            var customer = await CreateCustomerAsync();

            var result = await _wishlistService.IsInWishlistAsync(customer.Id, 999);

            Assert.False(result);
        }

        [Fact]
        public async Task IsInWishlistAsync_Should_Return_True_When_In_Wishlist()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync();

            _context.WishlistItems.Add(new WishlistItem
            {
                CustomerId = customer.Id,
                ProductId = product.Id
            });
            await _context.SaveChangesAsync();

            var result = await _wishlistService.IsInWishlistAsync(customer.Id, product.Id);

            Assert.True(result);
        }

        [Fact]
        public async Task ClearWishlistAsync_Should_Do_Nothing_When_No_Items()
        {
            var customer = await CreateCustomerAsync();

            await _wishlistService.ClearWishlistAsync(customer.Id);
        }

        [Fact]
        public async Task ClearWishlistAsync_Should_Remove_All_Items()
        {
            var customer = await CreateCustomerAsync();
            var product1 = await CreateProductAsync("Product 1");
            var product2 = await CreateProductAsync("Product 2");

            _context.WishlistItems.Add(new WishlistItem
            {
                CustomerId = customer.Id,
                ProductId = product1.Id
            });
            _context.WishlistItems.Add(new WishlistItem
            {
                CustomerId = customer.Id,
                ProductId = product2.Id
            });
            await _context.SaveChangesAsync();

            await _wishlistService.ClearWishlistAsync(customer.Id);

            Assert.Empty(await _context.WishlistItems.ToListAsync());
        }
    }
}