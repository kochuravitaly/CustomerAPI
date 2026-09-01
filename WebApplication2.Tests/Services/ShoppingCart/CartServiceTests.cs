using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.ShoppingCart;
using WebApplication2.Models.Auth;
using WebApplication2.Models.Products;
using WebApplication2.Models.ShoppingCart;
using WebApplication2.Services.ShoppingCart;

namespace WebApplication2.Tests.Services.ShoppingCart
{
    public class CartServiceTests
    {
        private readonly AppDbContext _context;
        private readonly CartService _cartService;

        public CartServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _cartService = new CartService(_context);

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

        private async Task<Cart> CreateCartAsync(Guid customerId)
        {
            var cart = new Cart
            {
                CustomerId = customerId
            };

            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();
            return cart;
        }

        [Fact]
        public async Task GetCartAsync_Should_Return_Empty_Cart_When_Not_Found()
        {
            var result = await _cartService.GetCartAsync(Guid.NewGuid());

            Assert.Empty(result.CartItems);
            Assert.Equal(0, result.Total);
        }

        [Fact]
        public async Task GetCartAsync_Should_Return_Cart_With_Items_And_Total()
        {
            var customer = await CreateCustomerAsync();
            var cart = await CreateCartAsync(customer.Id);
            var product1 = await CreateProductAsync("Product 1", 100);
            var product2 = await CreateProductAsync("Product 2", 50);

            _context.CartItems.Add(new CartItem
            {
                CartId = cart.Id,
                ProductId = product1.Id,
                Quantity = 2
            });
            _context.CartItems.Add(new CartItem
            {
                CartId = cart.Id,
                ProductId = product2.Id,
                Quantity = 1
            });
            await _context.SaveChangesAsync();

            var result = await _cartService.GetCartAsync(customer.Id);

            Assert.Equal(2, result.CartItems.Count);
            Assert.Equal(250, result.Total);
        }

        [Fact]
        public async Task AddCartItemAsync_Should_Return_False_When_Product_Not_Found()
        {
            var customer = await CreateCustomerAsync();

            var result = await _cartService.AddCartItemAsync(
                customer.Id,
                new AddCartItemDto { ProductId = 999, Quantity = 1 });

            Assert.False(result);
        }

        [Fact]
        public async Task AddCartItemAsync_Should_Create_New_Cart_When_Not_Exists()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync(stockQuantity: 10);

            var result = await _cartService.AddCartItemAsync(
                customer.Id,
                new AddCartItemDto { ProductId = product.Id, Quantity = 3 });

            Assert.True(result);
            Assert.Single(await _context.Carts.ToListAsync());
            Assert.Single(await _context.CartItems.ToListAsync());
        }

        [Fact]
        public async Task AddCartItemAsync_Should_Return_False_When_Quantity_Exceeds_Stock_For_New_Cart()
        {
            var customer = await CreateCustomerAsync();
            var product = await CreateProductAsync(stockQuantity: 5);

            var result = await _cartService.AddCartItemAsync(
                customer.Id,
                new AddCartItemDto { ProductId = product.Id, Quantity = 10 });

            Assert.False(result);
            Assert.Empty(await _context.Carts.ToListAsync());
        }

        [Fact]
        public async Task AddCartItemAsync_Should_Add_New_Item_To_Existing_Cart()
        {
            var customer = await CreateCustomerAsync();
            var cart = await CreateCartAsync(customer.Id);
            var product = await CreateProductAsync(stockQuantity: 10);

            var result = await _cartService.AddCartItemAsync(
                customer.Id,
                new AddCartItemDto { ProductId = product.Id, Quantity = 2 });

            Assert.True(result);
            Assert.Single(await _context.CartItems.ToListAsync());
            var cartItem = await _context.CartItems.FirstAsync();
            Assert.Equal(2, cartItem.Quantity);
        }

        [Fact]
        public async Task AddCartItemAsync_Should_Update_Quantity_When_Item_Exists()
        {
            var customer = await CreateCustomerAsync();
            var cart = await CreateCartAsync(customer.Id);
            var product = await CreateProductAsync(stockQuantity: 10);

            _context.CartItems.Add(new CartItem
            {
                CartId = cart.Id,
                ProductId = product.Id,
                Quantity = 3
            });
            await _context.SaveChangesAsync();

            var result = await _cartService.AddCartItemAsync(
                customer.Id,
                new AddCartItemDto { ProductId = product.Id, Quantity = 2 });

            Assert.True(result);
            var cartItem = await _context.CartItems.FirstAsync();
            Assert.Equal(5, cartItem.Quantity);
        }

        [Fact]
        public async Task AddCartItemAsync_Should_Return_False_When_Total_Quantity_Exceeds_Stock()
        {
            var customer = await CreateCustomerAsync();
            var cart = await CreateCartAsync(customer.Id);
            var product = await CreateProductAsync(stockQuantity: 5);

            _context.CartItems.Add(new CartItem
            {
                CartId = cart.Id,
                ProductId = product.Id,
                Quantity = 3
            });
            await _context.SaveChangesAsync();

            var result = await _cartService.AddCartItemAsync(
                customer.Id,
                new AddCartItemDto { ProductId = product.Id, Quantity = 3 });

            Assert.False(result);
        }

        [Fact]
        public async Task UpdateCartItemAsync_Should_Return_False_When_Item_Not_Found()
        {
            var customer = await CreateCustomerAsync();

            var result = await _cartService.UpdateCartItemAsync(
                customer.Id,
                999,
                new UpdateCartItemDto { Quantity = 5 });

            Assert.False(result);
        }

        [Fact]
        public async Task UpdateCartItemAsync_Should_Return_False_When_Quantity_Exceeds_Stock()
        {
            var customer = await CreateCustomerAsync();
            var cart = await CreateCartAsync(customer.Id);
            var product = await CreateProductAsync(stockQuantity: 5);

            _context.CartItems.Add(new CartItem
            {
                CartId = cart.Id,
                ProductId = product.Id,
                Quantity = 2
            });
            await _context.SaveChangesAsync();

            var result = await _cartService.UpdateCartItemAsync(
                customer.Id,
                product.Id,
                new UpdateCartItemDto { Quantity = 10 });

            Assert.False(result);
        }

        [Fact]
        public async Task UpdateCartItemAsync_Should_Update_Quantity()
        {
            var customer = await CreateCustomerAsync();
            var cart = await CreateCartAsync(customer.Id);
            var product = await CreateProductAsync(stockQuantity: 10);

            _context.CartItems.Add(new CartItem
            {
                CartId = cart.Id,
                ProductId = product.Id,
                Quantity = 2
            });
            await _context.SaveChangesAsync();

            var result = await _cartService.UpdateCartItemAsync(
                customer.Id,
                product.Id,
                new UpdateCartItemDto { Quantity = 7 });

            Assert.True(result);
            var cartItem = await _context.CartItems.FirstAsync();
            Assert.Equal(7, cartItem.Quantity);
        }

        [Fact]
        public async Task RemoveCartItemAsync_Should_Return_False_When_Item_Not_Found()
        {
            var customer = await CreateCustomerAsync();

            var result = await _cartService.RemoveCartItemAsync(customer.Id, 999);

            Assert.False(result);
        }

        [Fact]
        public async Task RemoveCartItemAsync_Should_Remove_Item()
        {
            var customer = await CreateCustomerAsync();
            var cart = await CreateCartAsync(customer.Id);
            var product = await CreateProductAsync();

            _context.CartItems.Add(new CartItem
            {
                CartId = cart.Id,
                ProductId = product.Id,
                Quantity = 1
            });
            await _context.SaveChangesAsync();

            var result = await _cartService.RemoveCartItemAsync(customer.Id, product.Id);

            Assert.True(result);
            Assert.Empty(await _context.CartItems.ToListAsync());
        }

        [Fact]
        public async Task ClearCartAsync_Should_Do_Nothing_When_Cart_Not_Found()
        {
            await _cartService.ClearCartAsync(Guid.NewGuid());
        }

        [Fact]
        public async Task ClearCartAsync_Should_Remove_All_Items()
        {
            var customer = await CreateCustomerAsync();
            var cart = await CreateCartAsync(customer.Id);
            var product1 = await CreateProductAsync("Product 1");
            var product2 = await CreateProductAsync("Product 2");

            _context.CartItems.Add(new CartItem
            {
                CartId = cart.Id,
                ProductId = product1.Id,
                Quantity = 1
            });
            _context.CartItems.Add(new CartItem
            {
                CartId = cart.Id,
                ProductId = product2.Id,
                Quantity = 2
            });
            await _context.SaveChangesAsync();

            await _cartService.ClearCartAsync(customer.Id);

            Assert.Empty(await _context.CartItems.ToListAsync());
        }
    }
}