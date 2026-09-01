using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs.Orders;
using WebApplication2.Models.Orders;
using WebApplication2.Models.Products;
using WebApplication2.Models.ShoppingCart;
using WebApplication2.Services.Orders.Services;

namespace WebApplication2.Tests.Services.Orders
{
    public class OrderServiceTests
    {
        private readonly AppDbContext _context;
        private readonly OrderService _orderService;

        public OrderServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _orderService = new OrderService(_context);

            _context.Categories.Add(new Category { Name = "Test Category", Description = "" });
            _context.SaveChanges();
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

        private async Task<Cart> CreateCartAsync(Guid customerId, List<(Product product, int quantity)>? items = null)
        {
            var cart = new Cart
            {
                CustomerId = customerId
            };

            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();

            if (items != null)
            {
                foreach (var (product, quantity) in items)
                {
                    _context.CartItems.Add(new CartItem
                    {
                        CartId = cart.Id,
                        ProductId = product.Id,
                        Quantity = quantity
                    });
                }
                await _context.SaveChangesAsync();
            }

            return cart;
        }

        [Fact]
        public async Task CreateOrderAsync_Should_Return_Null_When_Cart_Not_Found()
        {
            var result = await _orderService.CreateOrderAsync(Guid.NewGuid());

            Assert.Null(result);
        }

        [Fact]
        public async Task CreateOrderAsync_Should_Return_Null_When_Cart_Is_Empty()
        {
            var customerId = Guid.NewGuid();
            await CreateCartAsync(customerId);

            var result = await _orderService.CreateOrderAsync(customerId);

            Assert.Null(result);
        }

        [Fact]
        public async Task CreateOrderAsync_Should_Return_Null_When_Insufficient_Stock()
        {
            var customerId = Guid.NewGuid();
            var product = await CreateProductAsync(stockQuantity: 1);
            await CreateCartAsync(customerId, new List<(Product, int)>
            {
                (product, 5)
            });

            var result = await _orderService.CreateOrderAsync(customerId);

            Assert.Null(result);
            Assert.Empty(await _context.Orders.ToListAsync());
        }

        [Fact]
        public async Task CreateOrderAsync_Should_Create_Order_With_Correct_Total()
        {
            var customerId = Guid.NewGuid();
            var product1 = await CreateProductAsync("Product 1", price: 100, stockQuantity: 10);
            var product2 = await CreateProductAsync("Product 2", price: 50, stockQuantity: 10);

            await CreateCartAsync(customerId, new List<(Product, int)>
            {
                (product1, 2),
                (product2, 1)
            });

            var result = await _orderService.CreateOrderAsync(customerId);

            Assert.NotNull(result);
            Assert.Equal(250, result.TotalAmount);
            Assert.Equal(2, result.Items.Count());
        }

        [Fact]
        public async Task CreateOrderAsync_Should_Deduct_Stock()
        {
            var customerId = Guid.NewGuid();
            var product = await CreateProductAsync(stockQuantity: 10);
            await CreateCartAsync(customerId, new List<(Product, int)>
            {
                (product, 3)
            });

            await _orderService.CreateOrderAsync(customerId);

            var updatedProduct = await _context.Products.FindAsync(product.Id);
            Assert.Equal(7, updatedProduct.StockQuantity);
        }

        [Fact]
        public async Task CreateOrderAsync_Should_Remove_Cart_After_Order()
        {
            var customerId = Guid.NewGuid();
            var product = await CreateProductAsync(stockQuantity: 10);
            await CreateCartAsync(customerId, new List<(Product, int)>
            {
                (product, 1)
            });

            await _orderService.CreateOrderAsync(customerId);

            Assert.Empty(await _context.Carts.ToListAsync());
        }

        [Fact]
        public async Task CreateOrderAsync_Should_Apply_Flash_Sale_Discount()
        {
            var customerId = Guid.NewGuid();
            var product = await CreateProductAsync(price: 100, stockQuantity: 10);

            _context.FlashSales.Add(new FlashSale
            {
                DiscountPercentage = 20,
                StartsAt = DateTime.UtcNow.AddHours(-1),
                EndsAt = DateTime.UtcNow.AddHours(1),
                IsActive = true,
                ProductIdsJson = "[]",
                CategoryIdsJson = "[]"
            });
            await _context.SaveChangesAsync();

            await CreateCartAsync(customerId, new List<(Product, int)>
            {
                (product, 1)
            });

            var result = await _orderService.CreateOrderAsync(customerId);

            Assert.NotNull(result);
            Assert.Equal(80, result.TotalAmount);
        }

        [Fact]
        public async Task CreateOrderAsync_Should_Apply_Flash_Sale_For_Specific_Product()
        {
            var customerId = Guid.NewGuid();
            var product1 = await CreateProductAsync("Product 1", price: 100, stockQuantity: 10);
            var product2 = await CreateProductAsync("Product 2", price: 50, stockQuantity: 10);

            _context.FlashSales.Add(new FlashSale
            {
                DiscountPercentage = 50,
                StartsAt = DateTime.UtcNow.AddHours(-1),
                EndsAt = DateTime.UtcNow.AddHours(1),
                IsActive = true,
                ProductIdsJson = $"[{product1.Id}]",
                CategoryIdsJson = "[]"
            });
            await _context.SaveChangesAsync();

            await CreateCartAsync(customerId, new List<(Product, int)>
            {
                (product1, 1),
                (product2, 1)
            });

            var result = await _orderService.CreateOrderAsync(customerId);

            Assert.NotNull(result);
            Assert.Equal(100, result.TotalAmount);
        }

        [Fact]
        public async Task GetCustomerOrdersAsync_Should_Return_Orders_For_Customer()
        {
            var customerId = Guid.NewGuid();
            var otherCustomerId = Guid.NewGuid();

            _context.Orders.Add(new Order
            {
                CustomerId = customerId,
                Status = OrderStatus.Pending,
                TotalAmount = 100,
                CreatedAt = DateTime.UtcNow
            });
            _context.Orders.Add(new Order
            {
                CustomerId = otherCustomerId,
                Status = OrderStatus.Pending,
                TotalAmount = 200,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            var result = await _orderService.GetCustomerOrdersAsync(customerId);

            Assert.Single(result);
            Assert.Equal(100, result.First().TotalAmount);
        }

        [Fact]
        public async Task GetCustomerOrdersAsync_Should_Return_Empty_When_No_Orders()
        {
            var result = await _orderService.GetCustomerOrdersAsync(Guid.NewGuid());

            Assert.Empty(result);
        }

        [Fact]
        public async Task GetOrderByIdAsync_Should_Return_Order_When_Found()
        {
            var customerId = Guid.NewGuid();
            var order = new Order
            {
                CustomerId = customerId,
                Status = OrderStatus.Pending,
                TotalAmount = 100,
                CreatedAt = DateTime.UtcNow
            };
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            var result = await _orderService.GetOrderByIdAsync(order.Id, customerId);

            Assert.NotNull(result);
            Assert.Equal(100, result.TotalAmount);
        }

        [Fact]
        public async Task GetOrderByIdAsync_Should_Return_Null_When_Not_Found()
        {
            var result = await _orderService.GetOrderByIdAsync(Guid.NewGuid(), Guid.NewGuid());

            Assert.Null(result);
        }

        [Fact]
        public async Task GetOrderByIdAsync_Should_Return_Null_When_Order_Belongs_To_Other_Customer()
        {
            var customerId = Guid.NewGuid();
            var otherCustomerId = Guid.NewGuid();

            var order = new Order
            {
                CustomerId = customerId,
                Status = OrderStatus.Pending,
                TotalAmount = 100,
                CreatedAt = DateTime.UtcNow
            };
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            var result = await _orderService.GetOrderByIdAsync(order.Id, otherCustomerId);

            Assert.Null(result);
        }
    }
}