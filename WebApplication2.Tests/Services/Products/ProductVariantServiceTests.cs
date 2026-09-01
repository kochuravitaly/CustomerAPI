using Microsoft.EntityFrameworkCore;
using Moq;
using WebApplication2.Data;
using WebApplication2.DTOs.Products;
using WebApplication2.Models.Products;
using WebApplication2.Models.Translations;
using WebApplication2.Services.Products.Services;
using WebApplication2.Services.Translation.Interfaces;

namespace WebApplication2.Tests.Services.Products
{
    public class ProductVariantServiceTests
    {
        private readonly Mock<ITranslationService> _translationServiceMock;
        private readonly AppDbContext _context;
        private readonly ProductVariantService _variantService;

        public ProductVariantServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _translationServiceMock = new Mock<ITranslationService>();

            _translationServiceMock
                .Setup(x => x.TranslateAsync(It.IsAny<string>(), It.IsAny<string[]>()))
                .ReturnsAsync((string text, string[] langs) => langs.ToDictionary(l => l, l => text));

            _variantService = new ProductVariantService(_context, _translationServiceMock.Object);

            _context.Categories.Add(new Category { Name = "Test Category", Description = "" });
            _context.SaveChanges();
        }

        private async Task<Product> CreateProductAsync()
        {
            var product = new Product
            {
                Name = "Test Product",
                Description = "",
                Price = 100,
                StockQuantity = 10,
                CategoryId = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return product;
        }

        private async Task<ProductColor> CreateColorAsync(int productId, string name = "Red", string hexCode = "#FF0000")
        {
            var color = new ProductColor
            {
                ProductId = productId,
                Name = name,
                HexCode = hexCode
            };

            _context.ProductColors.Add(color);
            await _context.SaveChangesAsync();
            return color;
        }

        private async Task<ProductSize> CreateSizeAsync(int productId, string name = "M")
        {
            var size = new ProductSize
            {
                ProductId = productId,
                Name = name,
                StockQuantity = 10,
                SKU = "SKU-M",
                Price = null
            };

            _context.ProductSizes.Add(size);
            await _context.SaveChangesAsync();
            return size;
        }

        [Fact]
        public async Task GetProductVariantsAsync_Should_Return_Variants_For_Product()
        {
            var product = await CreateProductAsync();
            var color = await CreateColorAsync(product.Id);
            var size = await CreateSizeAsync(product.Id);

            _context.ProductVariants.Add(new ProductVariant
            {
                ProductId = product.Id,
                ColorId = color.Id,
                SizeId = size.Id,
                StockQuantity = 5,
                SKU = "TEST-RED-M"
            });
            await _context.SaveChangesAsync();

            var result = await _variantService.GetProductVariantsAsync(product.Id);

            Assert.Single(result);
            Assert.Equal("Red", result.First().ColorName);
            Assert.Equal("M", result.First().SizeName);
            Assert.Equal(5, result.First().StockQuantity);
        }

        [Fact]
        public async Task GetProductVariantsAsync_Should_Return_Empty_When_No_Variants()
        {
            var product = await CreateProductAsync();

            var result = await _variantService.GetProductVariantsAsync(product.Id);

            Assert.Empty(result);
        }

        [Fact]
        public async Task GetProductColorsAsync_Should_Return_Colors_For_Product()
        {
            var product = await CreateProductAsync();
            await CreateColorAsync(product.Id, "Red", "#FF0000");
            await CreateColorAsync(product.Id, "Blue", "#0000FF");

            var result = await _variantService.GetProductColorsAsync(product.Id);

            Assert.Equal(2, result.Count());
        }

        [Fact]
        public async Task GetProductColorsAsync_Should_Include_Translations()
        {
            var product = await CreateProductAsync();
            var color = await CreateColorAsync(product.Id);

            _context.ColorTranslations.Add(new ColorTranslation
            {
                ColorId = color.Id,
                LanguageCode = "ru",
                Name = "Красный"
            });
            await _context.SaveChangesAsync();

            var result = await _variantService.GetProductColorsAsync(product.Id);

            Assert.Single(result);
            Assert.NotNull(result.First().NameTranslations);
            Assert.Equal("Красный", result.First().NameTranslations["ru"]);
        }

        [Fact]
        public async Task GetProductSizesAsync_Should_Return_Sizes_For_Product()
        {
            var product = await CreateProductAsync();
            await CreateSizeAsync(product.Id, "S");
            await CreateSizeAsync(product.Id, "M");
            await CreateSizeAsync(product.Id, "L");

            var result = await _variantService.GetProductSizesAsync(product.Id);

            Assert.Equal(3, result.Count());
        }

        [Fact]
        public async Task CreateVariantAsync_Should_Return_Null_When_Product_Not_Found()
        {
            var dto = new CreateProductVariantDto
            {
                ColorId = 1,
                SizeId = 1,
                StockQuantity = 5,
                SKU = "TEST-SKU"
            };

            var result = await _variantService.CreateVariantAsync(999, dto);

            Assert.Null(result);
        }

        [Fact]
        public async Task CreateVariantAsync_Should_Create_Variant()
        {
            var product = await CreateProductAsync();

            var dto = new CreateProductVariantDto
            {
                ColorId = 1,
                SizeId = 1,
                StockQuantity = 5,
                SKU = "TEST-SKU",
                Price = 95
            };

            var result = await _variantService.CreateVariantAsync(product.Id, dto);

            Assert.NotNull(result);
            Assert.Equal(1, result.ColorId);
            Assert.Equal(1, result.SizeId);
            Assert.Equal(5, result.StockQuantity);
            Assert.Equal("TEST-SKU", result.SKU);
            Assert.Equal(95, result.Price);
            Assert.Single(await _context.ProductVariants.ToListAsync());
        }

        [Fact]
        public async Task CreateColorAsync_Should_Return_Null_When_Product_Not_Found()
        {
            var dto = new CreateProductColorDto
            {
                Name = "Red",
                HexCode = "#FF0000"
            };

            var result = await _variantService.CreateColorAsync(999, dto);

            Assert.Null(result);
        }

        [Fact]
        public async Task CreateColorAsync_Should_Create_Color()
        {
            var product = await CreateProductAsync();

            var dto = new CreateProductColorDto
            {
                Name = "Red",
                HexCode = "#FF0000"
            };

            var result = await _variantService.CreateColorAsync(product.Id, dto);

            Assert.NotNull(result);
            Assert.Equal("Red", result.Name);
            Assert.Equal("#FF0000", result.HexCode);
            Assert.Single(await _context.ProductColors.ToListAsync());
        }

        [Fact]
        public async Task CreateColorAsync_Should_Save_Translations()
        {
            var product = await CreateProductAsync();

            var dto = new CreateProductColorDto
            {
                Name = "Red",
                HexCode = "#FF0000"
            };

            await _variantService.CreateColorAsync(product.Id, dto);

            Assert.Equal(3, await _context.ColorTranslations.CountAsync());
            Assert.True(await _context.ColorTranslations.AnyAsync(t => t.LanguageCode == "en"));
            Assert.True(await _context.ColorTranslations.AnyAsync(t => t.LanguageCode == "ru"));
            Assert.True(await _context.ColorTranslations.AnyAsync(t => t.LanguageCode == "de"));
        }

        [Fact]
        public async Task CreateSizeAsync_Should_Return_Null_When_Product_Not_Found()
        {
            var dto = new CreateProductSizeDto
            {
                Name = "M"
            };

            var result = await _variantService.CreateSizeAsync(999, dto);

            Assert.Null(result);
        }

        [Fact]
        public async Task CreateSizeAsync_Should_Create_Size()
        {
            var product = await CreateProductAsync();

            var dto = new CreateProductSizeDto
            {
                Name = "M"
            };

            var result = await _variantService.CreateSizeAsync(product.Id, dto);

            Assert.NotNull(result);
            Assert.Equal("M", result.Name);
            Assert.Single(await _context.ProductSizes.ToListAsync());
        }

        [Fact]
        public async Task DeleteVariantAsync_Should_Return_False_When_Not_Found()
        {
            var result = await _variantService.DeleteVariantAsync(999);

            Assert.False(result);
        }

        [Fact]
        public async Task DeleteVariantAsync_Should_Return_True_When_Deleted()
        {
            var product = await CreateProductAsync();
            var color = await CreateColorAsync(product.Id);
            var size = await CreateSizeAsync(product.Id);

            var variant = new ProductVariant
            {
                ProductId = product.Id,
                ColorId = color.Id,
                SizeId = size.Id,
                StockQuantity = 5,
                SKU = "TEST"
            };

            _context.ProductVariants.Add(variant);
            await _context.SaveChangesAsync();

            var result = await _variantService.DeleteVariantAsync(variant.Id);

            Assert.True(result);
            Assert.Empty(await _context.ProductVariants.ToListAsync());
        }

        [Fact]
        public async Task DeleteColorAsync_Should_Return_False_When_Not_Found()
        {
            var result = await _variantService.DeleteColorAsync(999, 999);

            Assert.False(result);
        }

        [Fact]
        public async Task DeleteColorAsync_Should_Return_True_When_Deleted()
        {
            var product = await CreateProductAsync();
            var color = await CreateColorAsync(product.Id);

            var result = await _variantService.DeleteColorAsync(product.Id, color.Id);

            Assert.True(result);
            Assert.Empty(await _context.ProductColors.ToListAsync());
        }

        [Fact]
        public async Task DeleteColorAsync_Should_Return_False_When_Color_Belongs_To_Other_Product()
        {
            var product1 = await CreateProductAsync();
            var product2 = await CreateProductAsync();
            var color = await CreateColorAsync(product1.Id);

            var result = await _variantService.DeleteColorAsync(product2.Id, color.Id);

            Assert.False(result);
        }

        [Fact]
        public async Task DeleteSizeAsync_Should_Return_False_When_Not_Found()
        {
            var result = await _variantService.DeleteSizeAsync(999, 999);

            Assert.False(result);
        }

        [Fact]
        public async Task DeleteSizeAsync_Should_Return_True_When_Deleted()
        {
            var product = await CreateProductAsync();
            var size = await CreateSizeAsync(product.Id);

            var result = await _variantService.DeleteSizeAsync(product.Id, size.Id);

            Assert.True(result);
            Assert.Empty(await _context.ProductSizes.ToListAsync());
        }

        [Fact]
        public async Task DeleteSizeAsync_Should_Return_False_When_Size_Belongs_To_Other_Product()
        {
            var product1 = await CreateProductAsync();
            var product2 = await CreateProductAsync();
            var size = await CreateSizeAsync(product1.Id);

            var result = await _variantService.DeleteSizeAsync(product2.Id, size.Id);

            Assert.False(result);
        }
    }
}