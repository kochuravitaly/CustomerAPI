using Microsoft.EntityFrameworkCore;
using Moq;
using WebApplication2.Data;
using WebApplication2.Models.Auth;
using WebApplication2.Models.Home;
using WebApplication2.Models.Products;
using WebApplication2.Models.Translations;
using WebApplication2.Services.Translation.Interfaces;
using WebApplication2.Services.Translation.Services;

namespace WebApplication2.Tests.Services.Translation
{
    public class TranslationBackfillServiceTests
    {
        private readonly Mock<ITranslationService> _translationServiceMock;
        private readonly AppDbContext _context;
        private readonly TranslationBackfillService _backfillService;

        public TranslationBackfillServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _translationServiceMock = new Mock<ITranslationService>();

            _translationServiceMock
                .Setup(x => x.TranslateSingleAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync((string text, string lang) => $"{text}-{lang}");

            _backfillService = new TranslationBackfillService(_context, _translationServiceMock.Object);

            _context.Roles.Add(new Role { Id = 1, Name = "Customer" });
            _context.Categories.Add(new Category { Name = "Test Category", Description = "" });
            _context.SaveChanges();
        }

        private async Task<Product> CreateProductAsync(string name = "Product", string? description = "Description")
        {
            var product = new Product
            {
                Name = name,
                Description = description ?? "",
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

        [Fact]
        public async Task TranslateAllAsync_Should_Translate_Products_To_All_Languages()
        {
            await CreateProductAsync("Test Product", "Test Description");

            await _backfillService.TranslateAllAsync();

            Assert.Equal(3, await _context.ProductTranslations.CountAsync());
            Assert.True(await _context.ProductTranslations.AnyAsync(t => t.LanguageCode == "en"));
            Assert.True(await _context.ProductTranslations.AnyAsync(t => t.LanguageCode == "ru"));
            Assert.True(await _context.ProductTranslations.AnyAsync(t => t.LanguageCode == "de"));
        }

        [Fact]
        public async Task TranslateAllAsync_Should_Translate_Products_With_Empty_Description()
        {
            await CreateProductAsync("Test Product", "");

            await _backfillService.TranslateAllAsync();

            var translations = await _context.ProductTranslations.ToListAsync();
            Assert.Equal(3, translations.Count);
            Assert.All(translations, t => Assert.Equal("", t.Description));
        }

        [Fact]
        public async Task TranslateAllAsync_Should_Skip_Existing_Product_Translations()
        {
            var product = await CreateProductAsync("Test Product");

            _context.ProductTranslations.Add(new ProductTranslation
            {
                ProductId = product.Id,
                LanguageCode = "de",
                Name = "Existing Translation",
                Description = "Existing Description"
            });
            await _context.SaveChangesAsync();

            await _backfillService.TranslateAllAsync();

            var translations = await _context.ProductTranslations.ToListAsync();
            Assert.Equal(3, translations.Count);
            var existing = translations.First(t => t.LanguageCode == "de");
            Assert.Equal("Existing Translation", existing.Name);
        }

        [Fact]
        public async Task TranslateAllAsync_Should_Translate_Categories_To_All_Languages()
        {
            await _backfillService.TranslateAllAsync();

            Assert.Equal(3, await _context.CategoryTranslations.CountAsync());
            Assert.True(await _context.CategoryTranslations.AnyAsync(t => t.LanguageCode == "en"));
            Assert.True(await _context.CategoryTranslations.AnyAsync(t => t.LanguageCode == "ru"));
            Assert.True(await _context.CategoryTranslations.AnyAsync(t => t.LanguageCode == "de"));
        }

        [Fact]
        public async Task TranslateAllAsync_Should_Skip_Existing_Category_Translations()
        {
            _context.CategoryTranslations.Add(new CategoryTranslation
            {
                CategoryId = 1,
                LanguageCode = "de",
                Name = "Existing Category"
            });
            await _context.SaveChangesAsync();

            await _backfillService.TranslateAllAsync();

            var translations = await _context.CategoryTranslations.ToListAsync();
            Assert.Equal(3, translations.Count);
            var existing = translations.First(t => t.LanguageCode == "de");
            Assert.Equal("Existing Category", existing.Name);
        }

        [Fact]
        public async Task TranslateAllAsync_Should_Translate_Materials_To_All_Languages()
        {
            _context.ProductMaterials.Add(new ProductMaterial { Name = "Cotton" });
            await _context.SaveChangesAsync();

            await _backfillService.TranslateAllAsync();

            Assert.Equal(3, await _context.MaterialTranslations.CountAsync());
            Assert.True(await _context.MaterialTranslations.AnyAsync(t => t.LanguageCode == "en"));
            Assert.True(await _context.MaterialTranslations.AnyAsync(t => t.LanguageCode == "ru"));
            Assert.True(await _context.MaterialTranslations.AnyAsync(t => t.LanguageCode == "de"));
        }

        [Fact]
        public async Task TranslateAllAsync_Should_Skip_Existing_Material_Translations()
        {
            var material = new ProductMaterial { Name = "Cotton" };
            _context.ProductMaterials.Add(material);
            await _context.SaveChangesAsync();

            _context.MaterialTranslations.Add(new MaterialTranslation
            {
                MaterialId = material.Id,
                LanguageCode = "de",
                Name = "Existing Material"
            });
            await _context.SaveChangesAsync();

            await _backfillService.TranslateAllAsync();

            var translations = await _context.MaterialTranslations.ToListAsync();
            Assert.Equal(3, translations.Count);
        }

        [Fact]
        public async Task TranslateAllAsync_Should_Translate_Styles_To_All_Languages()
        {
            _context.ProductStyles.Add(new ProductStyle { Name = "Casual" });
            await _context.SaveChangesAsync();

            await _backfillService.TranslateAllAsync();

            Assert.Equal(3, await _context.StyleTranslations.CountAsync());
        }

        [Fact]
        public async Task TranslateAllAsync_Should_Skip_Existing_Style_Translations()
        {
            var style = new ProductStyle { Name = "Casual" };
            _context.ProductStyles.Add(style);
            await _context.SaveChangesAsync();

            _context.StyleTranslations.Add(new StyleTranslation
            {
                StyleId = style.Id,
                LanguageCode = "de",
                Name = "Existing Style"
            });
            await _context.SaveChangesAsync();

            await _backfillService.TranslateAllAsync();

            var translations = await _context.StyleTranslations.ToListAsync();
            Assert.Equal(3, translations.Count);
        }

        [Fact]
        public async Task TranslateAllAsync_Should_Translate_Occasions_To_All_Languages()
        {
            _context.ProductOccasions.Add(new ProductOccasion { Name = "Daily" });
            await _context.SaveChangesAsync();

            await _backfillService.TranslateAllAsync();

            Assert.Equal(3, await _context.OccasionTranslations.CountAsync());
        }

        [Fact]
        public async Task TranslateAllAsync_Should_Skip_Existing_Occasion_Translations()
        {
            var occasion = new ProductOccasion { Name = "Daily" };
            _context.ProductOccasions.Add(occasion);
            await _context.SaveChangesAsync();

            _context.OccasionTranslations.Add(new OccasionTranslation
            {
                OccasionId = occasion.Id,
                LanguageCode = "de",
                Name = "Existing Occasion"
            });
            await _context.SaveChangesAsync();

            await _backfillService.TranslateAllAsync();

            var translations = await _context.OccasionTranslations.ToListAsync();
            Assert.Equal(3, translations.Count);
        }

        [Fact]
        public async Task TranslateAllAsync_Should_Translate_Patterns_To_All_Languages()
        {
            _context.ProductPatterns.Add(new ProductPattern { Name = "Striped" });
            await _context.SaveChangesAsync();

            await _backfillService.TranslateAllAsync();

            Assert.Equal(3, await _context.PatternTranslations.CountAsync());
        }

        [Fact]
        public async Task TranslateAllAsync_Should_Skip_Existing_Pattern_Translations()
        {
            var pattern = new ProductPattern { Name = "Striped" };
            _context.ProductPatterns.Add(pattern);
            await _context.SaveChangesAsync();

            _context.PatternTranslations.Add(new PatternTranslation
            {
                PatternId = pattern.Id,
                LanguageCode = "de",
                Name = "Existing Pattern"
            });
            await _context.SaveChangesAsync();

            await _backfillService.TranslateAllAsync();

            var translations = await _context.PatternTranslations.ToListAsync();
            Assert.Equal(3, translations.Count);
        }

        [Fact]
        public async Task TranslateAllAsync_Should_Translate_Colors_To_All_Languages()
        {
            _context.ProductColors.Add(new ProductColor
            {
                ProductId = 1,
                Name = "Red",
                HexCode = "#FF0000"
            });
            await _context.SaveChangesAsync();

            await _backfillService.TranslateAllAsync();

            Assert.Equal(3, await _context.ColorTranslations.CountAsync());
        }

        [Fact]
        public async Task TranslateAllAsync_Should_Skip_Existing_Color_Translations()
        {
            var color = new ProductColor
            {
                ProductId = 1,
                Name = "Red",
                HexCode = "#FF0000"
            };
            _context.ProductColors.Add(color);
            await _context.SaveChangesAsync();

            _context.ColorTranslations.Add(new ColorTranslation
            {
                ColorId = color.Id,
                LanguageCode = "de",
                Name = "Existing Color"
            });
            await _context.SaveChangesAsync();

            await _backfillService.TranslateAllAsync();

            var translations = await _context.ColorTranslations.ToListAsync();
            Assert.Equal(3, translations.Count);
        }

        [Fact]
        public async Task TranslateAllAsync_Should_Translate_Home_Sections_To_All_Languages()
        {
            _context.HomeSections.Add(new HomeSection
            {
                Title = "Featured Products",
                DisplayOrder = 1,
                ProductsToShow = 4,
                IsActive = true,
                FilterJson = "{}"
            });
            await _context.SaveChangesAsync();

            await _backfillService.TranslateAllAsync();

            Assert.Equal(3, await _context.HomeSectionTranslations.CountAsync());
        }

        [Fact]
        public async Task TranslateAllAsync_Should_Skip_Existing_Home_Section_Translations()
        {
            var section = new HomeSection
            {
                Title = "Featured Products",
                DisplayOrder = 1,
                ProductsToShow = 4,
                IsActive = true,
                FilterJson = "{}"
            };
            _context.HomeSections.Add(section);
            await _context.SaveChangesAsync();

            _context.HomeSectionTranslations.Add(new HomeSectionTranslation
            {
                HomeSectionId = section.Id,
                LanguageCode = "de",
                Title = "Existing Section"
            });
            await _context.SaveChangesAsync();

            await _backfillService.TranslateAllAsync();

            var translations = await _context.HomeSectionTranslations.ToListAsync();
            Assert.Equal(3, translations.Count);
        }
    }
}