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
    public class AttributeServiceTests
    {
        private readonly Mock<ITranslationService> _translationServiceMock;
        private readonly AppDbContext _context;
        private readonly AttributeService _attributeService;

        public AttributeServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _translationServiceMock = new Mock<ITranslationService>();

            _translationServiceMock
                .Setup(x => x.TranslateAsync(It.IsAny<string>(), It.IsAny<string[]>()))
                .ReturnsAsync((string text, string[] langs) => langs.ToDictionary(l => l, l => text));

            _attributeService = new AttributeService(_context, _translationServiceMock.Object);
        }

        private CreateProductAttributeDto CreateDto(string name = "Test") => new() { Name = name };

        [Fact]
        public async Task GetMaterialsAsync_WithEnglish_ReturnsOriginalName()
        {
            _context.ProductMaterials.Add(new ProductMaterial
            {
                Name = "Cotton",
                Translations = new List<MaterialTranslation>
                {
                    new MaterialTranslation { LanguageCode = "ru", Name = "Хлопок" }
                }
            });
            await _context.SaveChangesAsync();

            var result = await _attributeService.GetMaterialsAsync("en");

            Assert.Single(result);
            Assert.Equal("Cotton", result.First().Name);
        }

        [Fact]
        public async Task GetMaterialsAsync_WithRussian_ReturnsTranslatedName()
        {
            _context.ProductMaterials.Add(new ProductMaterial
            {
                Name = "Cotton",
                Translations = new List<MaterialTranslation>
                {
                    new MaterialTranslation { LanguageCode = "ru", Name = "Хлопок" }
                }
            });
            await _context.SaveChangesAsync();

            var result = await _attributeService.GetMaterialsAsync("ru");

            Assert.Single(result);
            Assert.Equal("Хлопок", result.First().Name);
        }

        [Fact]
        public async Task GetMaterialsAsync_WithMissingTranslation_FallsBackToOriginal()
        {
            _context.ProductMaterials.Add(new ProductMaterial
            {
                Name = "Cotton"
            });
            await _context.SaveChangesAsync();

            var result = await _attributeService.GetMaterialsAsync("de");

            Assert.Single(result);
            Assert.Equal("Cotton", result.First().Name);
        }

        [Fact]
        public async Task GetStylesAsync_WithEnglish_ReturnsOriginalName()
        {
            _context.ProductStyles.Add(new ProductStyle { Name = "Casual" });
            await _context.SaveChangesAsync();

            var result = await _attributeService.GetStylesAsync("en");

            Assert.Single(result);
            Assert.Equal("Casual", result.First().Name);
        }

        [Fact]
        public async Task GetStylesAsync_WithRussian_ReturnsTranslatedName()
        {
            _context.ProductStyles.Add(new ProductStyle
            {
                Name = "Casual",
                Translations = new List<StyleTranslation>
                {
                    new StyleTranslation { LanguageCode = "ru", Name = "Повседневный" }
                }
            });
            await _context.SaveChangesAsync();

            var result = await _attributeService.GetStylesAsync("ru");

            Assert.Single(result);
            Assert.Equal("Повседневный", result.First().Name);
        }

        [Fact]
        public async Task GetOccasionsAsync_WithEnglish_ReturnsOriginalName()
        {
            _context.ProductOccasions.Add(new ProductOccasion { Name = "Daily" });
            await _context.SaveChangesAsync();

            var result = await _attributeService.GetOccasionsAsync("en");

            Assert.Single(result);
            Assert.Equal("Daily", result.First().Name);
        }

        [Fact]
        public async Task GetOccasionsAsync_WithGerman_ReturnsTranslatedName()
        {
            _context.ProductOccasions.Add(new ProductOccasion
            {
                Name = "Daily",
                Translations = new List<OccasionTranslation>
                {
                    new OccasionTranslation { LanguageCode = "de", Name = "Täglich" }
                }
            });
            await _context.SaveChangesAsync();

            var result = await _attributeService.GetOccasionsAsync("de");

            Assert.Single(result);
            Assert.Equal("Täglich", result.First().Name);
        }

        [Fact]
        public async Task GetPatternsAsync_WithEnglish_ReturnsOriginalName()
        {
            _context.ProductPatterns.Add(new ProductPattern { Name = "Striped" });
            await _context.SaveChangesAsync();

            var result = await _attributeService.GetPatternsAsync("en");

            Assert.Single(result);
            Assert.Equal("Striped", result.First().Name);
        }

        [Fact]
        public async Task GetPatternsAsync_WithRussian_ReturnsTranslatedName()
        {
            _context.ProductPatterns.Add(new ProductPattern
            {
                Name = "Striped",
                Translations = new List<PatternTranslation>
                {
                    new PatternTranslation { LanguageCode = "ru", Name = "Полосатый" }
                }
            });
            await _context.SaveChangesAsync();

            var result = await _attributeService.GetPatternsAsync("ru");

            Assert.Single(result);
            Assert.Equal("Полосатый", result.First().Name);
        }

        [Fact]
        public async Task CreateMaterialAsync_Should_Create_With_Translations()
        {
            var result = await _attributeService.CreateMaterialAsync(CreateDto("Cotton"));

            Assert.NotNull(result);
            Assert.Equal("Cotton", result.Name);
            Assert.Single(await _context.ProductMaterials.ToListAsync());
            Assert.Equal(3, await _context.MaterialTranslations.CountAsync());
            Assert.True(await _context.MaterialTranslations.AnyAsync(t => t.LanguageCode == "en"));
            Assert.True(await _context.MaterialTranslations.AnyAsync(t => t.LanguageCode == "ru"));
            Assert.True(await _context.MaterialTranslations.AnyAsync(t => t.LanguageCode == "de"));
        }

        [Fact]
        public async Task CreateStyleAsync_Should_Create_With_Translations()
        {
            var result = await _attributeService.CreateStyleAsync(CreateDto("Casual"));

            Assert.NotNull(result);
            Assert.Equal("Casual", result.Name);
            Assert.Single(await _context.ProductStyles.ToListAsync());
            Assert.Equal(3, await _context.StyleTranslations.CountAsync());
            Assert.True(await _context.StyleTranslations.AnyAsync(t => t.LanguageCode == "en"));
            Assert.True(await _context.StyleTranslations.AnyAsync(t => t.LanguageCode == "ru"));
            Assert.True(await _context.StyleTranslations.AnyAsync(t => t.LanguageCode == "de"));
        }

        [Fact]
        public async Task CreateOccasionAsync_Should_Create_With_Translations()
        {
            var result = await _attributeService.CreateOccasionAsync(CreateDto("Daily"));

            Assert.NotNull(result);
            Assert.Equal("Daily", result.Name);
            Assert.Single(await _context.ProductOccasions.ToListAsync());
            Assert.Equal(3, await _context.OccasionTranslations.CountAsync());
            Assert.True(await _context.OccasionTranslations.AnyAsync(t => t.LanguageCode == "en"));
            Assert.True(await _context.OccasionTranslations.AnyAsync(t => t.LanguageCode == "ru"));
            Assert.True(await _context.OccasionTranslations.AnyAsync(t => t.LanguageCode == "de"));
        }

        [Fact]
        public async Task CreatePatternAsync_Should_Create_With_Translations()
        {
            var result = await _attributeService.CreatePatternAsync(CreateDto("Striped"));

            Assert.NotNull(result);
            Assert.Equal("Striped", result.Name);
            Assert.Single(await _context.ProductPatterns.ToListAsync());
            Assert.Equal(3, await _context.PatternTranslations.CountAsync());
            Assert.True(await _context.PatternTranslations.AnyAsync(t => t.LanguageCode == "en"));
            Assert.True(await _context.PatternTranslations.AnyAsync(t => t.LanguageCode == "ru"));
            Assert.True(await _context.PatternTranslations.AnyAsync(t => t.LanguageCode == "de"));
        }

        [Fact]
        public async Task UpdateMaterialAsync_Should_Return_False_When_Not_Found()
        {
            var result = await _attributeService.UpdateMaterialAsync(999, CreateDto("Updated"));

            Assert.False(result);
        }

        [Fact]
        public async Task UpdateMaterialAsync_Should_Update_Name()
        {
            var material = new ProductMaterial { Name = "Old" };
            _context.ProductMaterials.Add(material);
            await _context.SaveChangesAsync();

            var result = await _attributeService.UpdateMaterialAsync(material.Id, CreateDto("New"));

            Assert.True(result);
            var updated = await _context.ProductMaterials.FindAsync(material.Id);
            Assert.Equal("New", updated.Name);
        }

        [Fact]
        public async Task UpdateStyleAsync_Should_Return_False_When_Not_Found()
        {
            var result = await _attributeService.UpdateStyleAsync(999, CreateDto("Updated"));

            Assert.False(result);
        }

        [Fact]
        public async Task UpdateStyleAsync_Should_Update_Name()
        {
            var style = new ProductStyle { Name = "Old" };
            _context.ProductStyles.Add(style);
            await _context.SaveChangesAsync();

            var result = await _attributeService.UpdateStyleAsync(style.Id, CreateDto("New"));

            Assert.True(result);
            var updated = await _context.ProductStyles.FindAsync(style.Id);
            Assert.Equal("New", updated.Name);
        }

        [Fact]
        public async Task UpdateOccasionAsync_Should_Return_False_When_Not_Found()
        {
            var result = await _attributeService.UpdateOccasionAsync(999, CreateDto("Updated"));

            Assert.False(result);
        }

        [Fact]
        public async Task UpdateOccasionAsync_Should_Update_Name()
        {
            var occasion = new ProductOccasion { Name = "Old" };
            _context.ProductOccasions.Add(occasion);
            await _context.SaveChangesAsync();

            var result = await _attributeService.UpdateOccasionAsync(occasion.Id, CreateDto("New"));

            Assert.True(result);
            var updated = await _context.ProductOccasions.FindAsync(occasion.Id);
            Assert.Equal("New", updated.Name);
        }

        [Fact]
        public async Task UpdatePatternAsync_Should_Return_False_When_Not_Found()
        {
            var result = await _attributeService.UpdatePatternAsync(999, CreateDto("Updated"));

            Assert.False(result);
        }

        [Fact]
        public async Task UpdatePatternAsync_Should_Update_Name()
        {
            var pattern = new ProductPattern { Name = "Old" };
            _context.ProductPatterns.Add(pattern);
            await _context.SaveChangesAsync();

            var result = await _attributeService.UpdatePatternAsync(pattern.Id, CreateDto("New"));

            Assert.True(result);
            var updated = await _context.ProductPatterns.FindAsync(pattern.Id);
            Assert.Equal("New", updated.Name);
        }

        [Fact]
        public async Task DeleteMaterialAsync_Should_Return_False_When_Not_Found()
        {
            var result = await _attributeService.DeleteMaterialAsync(999);

            Assert.False(result);
        }

        [Fact]
        public async Task DeleteMaterialAsync_Should_Return_True_When_Deleted()
        {
            var material = new ProductMaterial { Name = "Cotton" };
            _context.ProductMaterials.Add(material);
            await _context.SaveChangesAsync();

            var result = await _attributeService.DeleteMaterialAsync(material.Id);

            Assert.True(result);
            Assert.Empty(await _context.ProductMaterials.ToListAsync());
        }

        [Fact]
        public async Task DeleteStyleAsync_Should_Return_False_When_Not_Found()
        {
            var result = await _attributeService.DeleteStyleAsync(999);

            Assert.False(result);
        }

        [Fact]
        public async Task DeleteStyleAsync_Should_Return_True_When_Deleted()
        {
            var style = new ProductStyle { Name = "Casual" };
            _context.ProductStyles.Add(style);
            await _context.SaveChangesAsync();

            var result = await _attributeService.DeleteStyleAsync(style.Id);

            Assert.True(result);
            Assert.Empty(await _context.ProductStyles.ToListAsync());
        }

        [Fact]
        public async Task DeleteOccasionAsync_Should_Return_False_When_Not_Found()
        {
            var result = await _attributeService.DeleteOccasionAsync(999);

            Assert.False(result);
        }

        [Fact]
        public async Task DeleteOccasionAsync_Should_Return_True_When_Deleted()
        {
            var occasion = new ProductOccasion { Name = "Daily" };
            _context.ProductOccasions.Add(occasion);
            await _context.SaveChangesAsync();

            var result = await _attributeService.DeleteOccasionAsync(occasion.Id);

            Assert.True(result);
            Assert.Empty(await _context.ProductOccasions.ToListAsync());
        }

        [Fact]
        public async Task DeletePatternAsync_Should_Return_False_When_Not_Found()
        {
            var result = await _attributeService.DeletePatternAsync(999);

            Assert.False(result);
        }

        [Fact]
        public async Task DeletePatternAsync_Should_Return_True_When_Deleted()
        {
            var pattern = new ProductPattern { Name = "Striped" };
            _context.ProductPatterns.Add(pattern);
            await _context.SaveChangesAsync();

            var result = await _attributeService.DeletePatternAsync(pattern.Id);

            Assert.True(result);
            Assert.Empty(await _context.ProductPatterns.ToListAsync());
        }
    }
}