using Microsoft.EntityFrameworkCore;
using Moq;
using WebApplication2.Data;
using WebApplication2.DTOs.Products;
using WebApplication2.Models.Products;
using WebApplication2.Services.Products.Services;
using WebApplication2.Services.Translation.Interfaces;

namespace WebApplication2.Tests.Services.Products
{
    public class ProductServiceTests
    {
        private readonly Mock<ITranslationService> _translationServiceMock;
        private readonly AppDbContext _context;
        private readonly ProductService _productService;

        public ProductServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _translationServiceMock = new Mock<ITranslationService>();

            _translationServiceMock
                .Setup(x => x.TranslateAsync(It.IsAny<string>(), It.IsAny<string[]>()))
                .ReturnsAsync((string text, string[] langs) => langs.ToDictionary(l => l, l => text));

            _productService = new ProductService(_context, _translationServiceMock.Object);

            _context.Categories.Add(new Category { Name = "Test Category", Description = "" });
            _context.SaveChanges();
        }

        private CreateProductDto CreateDto(
            string name = "Test Product",
            string? description = "Test Description",
            decimal price = 100,
            int stockQuantity = 10,
            int categoryId = 1)
        {
            return new CreateProductDto
            {
                Name = name,
                Description = description,
                Price = price,
                StockQuantity = stockQuantity,
                CategoryId = categoryId,
                SeasonsJson = "[]",
                AgeGroupsJson = "[]",
                MaterialCompositionJson = "[]"
            };
        }

        private async Task<Product> CreateProductAsync(
            string name = "Test Product",
            string description = "Test Description",
            decimal price = 100,
            int stockQuantity = 10,
            int categoryId = 1)
        {
            var product = new Product
            {
                Name = name,
                Description = description,
                Price = price,
                StockQuantity = stockQuantity,
                CategoryId = categoryId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return product;
        }

        [Fact]
        public async Task CreateProductAsync_Should_Return_Null_When_Category_Not_Found()
        {
            var dto = CreateDto(categoryId: 999);

            var result = await _productService.CreateProductAsync(dto);

            Assert.Null(result);
        }

        [Fact]
        public async Task CreateProductAsync_Should_Create_Product()
        {
            var dto = CreateDto("New Product", "New Description", 150, 20, 1);

            var result = await _productService.CreateProductAsync(dto);

            Assert.NotNull(result);
            Assert.Equal("New Product", result.Name);
            Assert.Equal(150, result.Price);
            Assert.Equal(20, result.StockQuantity);
            Assert.Single(await _context.Products.ToListAsync());
        }

        [Fact]
        public async Task CreateProductAsync_Should_Save_Translations()
        {
            var dto = CreateDto("Translated Product", "Translated Description");

            await _productService.CreateProductAsync(dto);

            Assert.Equal(3, await _context.ProductTranslations.CountAsync());
            Assert.True(await _context.ProductTranslations.AnyAsync(t => t.LanguageCode == "en"));
            Assert.True(await _context.ProductTranslations.AnyAsync(t => t.LanguageCode == "ru"));
            Assert.True(await _context.ProductTranslations.AnyAsync(t => t.LanguageCode == "de"));
        }

        [Fact]
        public async Task GetProductByIdAsync_Should_Return_Product_When_Found()
        {
            var product = await CreateProductAsync("Found Product");

            var result = await _productService.GetProductByIdAsync(product.Id);

            Assert.NotNull(result);
            Assert.Equal("Found Product", result.Name);
        }

        [Fact]
        public async Task GetProductByIdAsync_Should_Return_Null_When_Not_Found()
        {
            var result = await _productService.GetProductByIdAsync(999);

            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateProductAsync_Should_Return_False_When_Not_Found()
        {
            var dto = new UpdateProductDto { Name = "Updated" };

            var result = await _productService.UpdateProductAsync(999, dto);

            Assert.False(result);
        }

        [Fact]
        public async Task UpdateProductAsync_Should_Return_False_When_Category_Not_Found()
        {
            var product = await CreateProductAsync();
            var dto = new UpdateProductDto { CategoryId = 999 };

            var result = await _productService.UpdateProductAsync(product.Id, dto);

            Assert.False(result);
        }

        [Fact]
        public async Task UpdateProductAsync_Should_Update_Product()
        {
            var product = await CreateProductAsync("Old Name", "Old Description", 100, 10);
            var dto = new UpdateProductDto
            {
                Name = "New Name",
                Description = "New Description",
                Price = 200,
                StockQuantity = 20
            };

            var result = await _productService.UpdateProductAsync(product.Id, dto);

            Assert.True(result);

            var updated = await _context.Products.FindAsync(product.Id);
            Assert.Equal("New Name", updated.Name);
            Assert.Equal("New Description", updated.Description);
            Assert.Equal(200, updated.Price);
            Assert.Equal(20, updated.StockQuantity);
        }

        [Fact]
        public async Task DeleteProductAsync_Should_Return_False_When_Not_Found()
        {
            var result = await _productService.DeleteProductAsync(999);

            Assert.False(result);
        }

        [Fact]
        public async Task DeleteProductAsync_Should_Return_True_When_Deleted()
        {
            var product = await CreateProductAsync();

            var result = await _productService.DeleteProductAsync(product.Id);

            Assert.True(result);
            Assert.Empty(await _context.Products.ToListAsync());
        }

        [Fact]
        public async Task GetAllProductsAsync_Should_Return_All_Products()
        {
            await CreateProductAsync("Product 1");
            await CreateProductAsync("Product 2");
            await CreateProductAsync("Product 3");

            var result = await _productService.GetAllProductsAsync(new ProductQueryDto());

            Assert.Equal(3, result.TotalCount);
            Assert.Equal(3, result.Items.Count());
        }

        [Fact]
        public async Task GetAllProductsAsync_Should_Return_Empty_When_No_Products()
        {
            var result = await _productService.GetAllProductsAsync(new ProductQueryDto());

            Assert.Equal(0, result.TotalCount);
            Assert.Empty(result.Items);
        }

        [Fact]
        public async Task GetAllProductsAsync_Should_Filter_By_Search()
        {
            await CreateProductAsync("Apple iPhone");
            await CreateProductAsync("Samsung Galaxy");
            await CreateProductAsync("Google Pixel");

            var query = new ProductQueryDto { Search = "iPhone" };

            var result = await _productService.GetAllProductsAsync(query);

            Assert.Equal(1, result.TotalCount);
            Assert.Equal("Apple iPhone", result.Items.First().Name);
        }

        [Fact]
        public async Task GetAllProductsAsync_Should_Filter_By_Search_Case_Insensitive()
        {
            await CreateProductAsync("Apple iPhone");
            await CreateProductAsync("Samsung Galaxy");

            var query = new ProductQueryDto { Search = "iphone" };

            var result = await _productService.GetAllProductsAsync(query);

            Assert.Equal(1, result.TotalCount);
            Assert.Equal("Apple iPhone", result.Items.First().Name);
        }

        [Fact]
        public async Task GetAllProductsAsync_Should_Filter_By_Category()
        {
            _context.Categories.Add(new Category { Name = "Category 2", Description = "" });
            await _context.SaveChangesAsync();

            await CreateProductAsync("Product 1", categoryId: 1);
            await CreateProductAsync("Product 2", categoryId: 2);

            var query = new ProductQueryDto { CategoryId = 2 };

            var result = await _productService.GetAllProductsAsync(query);

            Assert.Equal(1, result.TotalCount);
            Assert.Equal("Product 2", result.Items.First().Name);
        }

        [Fact]
        public async Task GetAllProductsAsync_Should_Filter_By_MinPrice()
        {
            await CreateProductAsync("Cheap", price: 10);
            await CreateProductAsync("Expensive", price: 1000);

            var query = new ProductQueryDto { MinPrice = 500 };

            var result = await _productService.GetAllProductsAsync(query);

            Assert.Equal(1, result.TotalCount);
            Assert.Equal("Expensive", result.Items.First().Name);
        }

        [Fact]
        public async Task GetAllProductsAsync_Should_Filter_By_MaxPrice()
        {
            await CreateProductAsync("Cheap", price: 10);
            await CreateProductAsync("Expensive", price: 1000);

            var query = new ProductQueryDto { MaxPrice = 500 };

            var result = await _productService.GetAllProductsAsync(query);

            Assert.Equal(1, result.TotalCount);
            Assert.Equal("Cheap", result.Items.First().Name);
        }

        [Fact]
        public async Task GetAllProductsAsync_Should_Sort_By_Name_Ascending()
        {
            await CreateProductAsync("Banana");
            await CreateProductAsync("Apple");
            await CreateProductAsync("Cherry");

            var query = new ProductQueryDto { SortBy = "name", SortDirection = "asc" };

            var result = await _productService.GetAllProductsAsync(query);

            Assert.Equal("Apple", result.Items.First().Name);
            Assert.Equal("Banana", result.Items.Skip(1).First().Name);
            Assert.Equal("Cherry", result.Items.Last().Name);
        }

        [Fact]
        public async Task GetAllProductsAsync_Should_Sort_By_Name_Descending()
        {
            await CreateProductAsync("Banana");
            await CreateProductAsync("Apple");
            await CreateProductAsync("Cherry");

            var query = new ProductQueryDto { SortBy = "name", SortDirection = "desc" };

            var result = await _productService.GetAllProductsAsync(query);

            Assert.Equal("Cherry", result.Items.First().Name);
            Assert.Equal("Banana", result.Items.Skip(1).First().Name);
            Assert.Equal("Apple", result.Items.Last().Name);
        }

        [Fact]
        public async Task GetAllProductsAsync_Should_Sort_By_Price_Ascending()
        {
            await CreateProductAsync("Medium", price: 50);
            await CreateProductAsync("Cheap", price: 10);
            await CreateProductAsync("Expensive", price: 100);

            var query = new ProductQueryDto { SortBy = "price", SortDirection = "asc" };

            var result = await _productService.GetAllProductsAsync(query);

            Assert.Equal(10, result.Items.First().Price);
            Assert.Equal(50, result.Items.Skip(1).First().Price);
            Assert.Equal(100, result.Items.Last().Price);
        }

        [Fact]
        public async Task GetAllProductsAsync_Should_Sort_By_Price_Descending()
        {
            await CreateProductAsync("Medium", price: 50);
            await CreateProductAsync("Cheap", price: 10);
            await CreateProductAsync("Expensive", price: 100);

            var query = new ProductQueryDto { SortBy = "price", SortDirection = "desc" };

            var result = await _productService.GetAllProductsAsync(query);

            Assert.Equal(100, result.Items.First().Price);
            Assert.Equal(50, result.Items.Skip(1).First().Price);
            Assert.Equal(10, result.Items.Last().Price);
        }

        [Fact]
        public async Task GetAllProductsAsync_Should_Sort_By_CreatedAt_Descending_By_Default()
        {
            var product1 = await CreateProductAsync("Oldest");
            product1.CreatedAt = DateTime.UtcNow.AddDays(-3);
            await _context.SaveChangesAsync();

            var product2 = await CreateProductAsync("Middle");
            product2.CreatedAt = DateTime.UtcNow.AddDays(-2);
            await _context.SaveChangesAsync();

            var product3 = await CreateProductAsync("Newest");
            product3.CreatedAt = DateTime.UtcNow.AddDays(-1);
            await _context.SaveChangesAsync();

            var query = new ProductQueryDto();

            var result = await _productService.GetAllProductsAsync(query);

            Assert.Equal("Newest", result.Items.First().Name);
            Assert.Equal("Middle", result.Items.Skip(1).First().Name);
            Assert.Equal("Oldest", result.Items.Last().Name);
        }

        [Fact]
        public async Task GetAllProductsAsync_Should_Return_Paginated_Results()
        {
            for (int i = 1; i <= 5; i++)
            {
                await CreateProductAsync($"Product {i}", price: i * 10);
            }

            var query = new ProductQueryDto { Page = 1, PageSize = 2 };

            var result = await _productService.GetAllProductsAsync(query);

            Assert.Equal(2, result.Items.Count());
            Assert.Equal(5, result.TotalCount);
            Assert.Equal(3, result.TotalPages);
        }

        [Fact]
        public async Task GetAllProductsAsync_Should_Clamp_PageSize_To_Max_100()
        {
            for (int i = 1; i <= 3; i++)
            {
                await CreateProductAsync($"Product {i}");
            }

            var query = new ProductQueryDto { Page = 1, PageSize = 500 };

            var result = await _productService.GetAllProductsAsync(query);

            Assert.Equal(3, result.Items.Count());
        }

        [Fact]
        public async Task GetAllProductsAsync_Should_Handle_Page_Greater_Than_Total_Pages()
        {
            await CreateProductAsync("Product 1");

            var query = new ProductQueryDto { Page = 5, PageSize = 10 };

            var result = await _productService.GetAllProductsAsync(query);

            Assert.Empty(result.Items);
            Assert.Equal(1, result.TotalCount);
        }

        [Fact]
        public async Task GetBestSellersAsync_Should_Return_Products_With_Orders()
        {
            var product1 = await CreateProductAsync("Bestseller");
            var product2 = await CreateProductAsync("Regular");

            _context.OrderItems.Add(new WebApplication2.Models.Orders.OrderItem
            {
                OrderId = Guid.NewGuid(),
                ProductId = product1.Id,
                ProductName = product1.Name,
                UnitPrice = product1.Price,
                Quantity = 5,
                Total = product1.Price * 5
            });
            await _context.SaveChangesAsync();

            var result = await _productService.GetBestSellersAsync();

            Assert.Single(result);
            Assert.Equal("Bestseller", result.First().Name);
        }

        [Fact]
        public async Task GetBestSellersAsync_Should_Return_Empty_When_No_Orders()
        {
            await CreateProductAsync("No Orders");

            var result = await _productService.GetBestSellersAsync();

            Assert.Empty(result);
        }

        [Fact]
        public async Task GetBestSellersAsync_Should_Order_By_Total_Quantity_Sold()
        {
            var product1 = await CreateProductAsync("Product 1");
            var product2 = await CreateProductAsync("Product 2");

            _context.OrderItems.Add(new WebApplication2.Models.Orders.OrderItem
            {
                OrderId = Guid.NewGuid(),
                ProductId = product1.Id,
                ProductName = product1.Name,
                UnitPrice = product1.Price,
                Quantity = 2,
                Total = product1.Price * 2
            });
            _context.OrderItems.Add(new WebApplication2.Models.Orders.OrderItem
            {
                OrderId = Guid.NewGuid(),
                ProductId = product2.Id,
                ProductName = product2.Name,
                UnitPrice = product2.Price,
                Quantity = 10,
                Total = product2.Price * 10
            });
            await _context.SaveChangesAsync();

            var result = await _productService.GetBestSellersAsync();

            Assert.Equal(2, result.Count());
            Assert.Equal("Product 2", result.First().Name);
            Assert.Equal("Product 1", result.Last().Name);
        }

        [Fact]
        public async Task UpdateProductAsync_Should_Not_Overwrite_Nullable_Fields_When_Null()
        {
            var product = await CreateProductAsync();
            product.Gender = ProductGender.Men;
            product.MaterialId = 1;
            await _context.SaveChangesAsync();

            var dto = new UpdateProductDto
            {
                Name = "Updated Name"
            };

            var result = await _productService.UpdateProductAsync(product.Id, dto);

            Assert.True(result);
            var updated = await _context.Products.FindAsync(product.Id);
            Assert.Equal(ProductGender.Men, updated.Gender);
            Assert.Equal(1, updated.MaterialId);
            Assert.Equal("Updated Name", updated.Name);
        }
    }
}