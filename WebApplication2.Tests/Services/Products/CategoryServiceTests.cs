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
    public class CategoryServiceTests
    {
        private readonly Mock<ITranslationService> _translationServiceMock;
        private readonly AppDbContext _context;
        private readonly CategoryService _categoryService;

        public CategoryServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _translationServiceMock = new Mock<ITranslationService>();

            _translationServiceMock
                .Setup(x => x.TranslateAsync(It.IsAny<string>(), It.IsAny<string[]>()))
                .ReturnsAsync((string text, string[] langs) => langs.ToDictionary(l => l, l => text));

            _categoryService = new CategoryService(_context, _translationServiceMock.Object);
        }

        private Category CreateCategory(
            string name = "Test Category",
            string description = "Test Description")
        {
            return new Category
            {
                Name = name,
                Description = description
            };
        }

        [Fact]
        public async Task CreateCategoryAsync_Should_Create_Category()
        {
            var dto = new CreateCategoryDto
            {
                Name = "New Category",
                Description = "New Description"
            };

            var result = await _categoryService.CreateCategoryAsync(dto);

            Assert.NotNull(result);
            Assert.Equal("New Category", result.Name);
            Assert.Equal("New Description", result.Description);
            Assert.Single(await _context.Categories.ToListAsync());
        }

        [Fact]
        public async Task CreateCategoryAsync_Should_Save_Translations()
        {
            var dto = new CreateCategoryDto
            {
                Name = "Test Category",
                Description = "Test Description"
            };

            await _categoryService.CreateCategoryAsync(dto);

            Assert.Equal(3, await _context.CategoryTranslations.CountAsync());
            Assert.True(await _context.CategoryTranslations.AnyAsync(t => t.LanguageCode == "en"));
            Assert.True(await _context.CategoryTranslations.AnyAsync(t => t.LanguageCode == "ru"));
            Assert.True(await _context.CategoryTranslations.AnyAsync(t => t.LanguageCode == "de"));
        }

        [Fact]
        public async Task GetAllCategoriesAsync_Should_Return_All_Categories()
        {
            _context.Categories.Add(CreateCategory("Category 1"));
            _context.Categories.Add(CreateCategory("Category 2"));
            _context.Categories.Add(CreateCategory("Category 3"));
            await _context.SaveChangesAsync();

            var result = await _categoryService.GetAllCategoriesAsync();

            Assert.Equal(3, result.Count());
        }

        [Fact]
        public async Task GetAllCategoriesAsync_Should_Return_Empty_When_No_Categories()
        {
            var result = await _categoryService.GetAllCategoriesAsync();

            Assert.Empty(result);
        }

        [Fact]
        public async Task GetCategoryByIdAsync_Should_Return_Category_When_Found()
        {
            var category = CreateCategory("Found Category");
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            var result = await _categoryService.GetCategoryByIdAsync(category.Id);

            Assert.NotNull(result);
            Assert.Equal("Found Category", result.Name);
        }

        [Fact]
        public async Task GetCategoryByIdAsync_Should_Return_Null_When_Not_Found()
        {
            var result = await _categoryService.GetCategoryByIdAsync(999);

            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateCategoryAsync_Should_Return_False_When_Not_Found()
        {
            var dto = new UpdateCategoryDto
            {
                Name = "Updated"
            };

            var result = await _categoryService.UpdateCategoryAsync(999, dto);

            Assert.False(result);
        }

        [Fact]
        public async Task UpdateCategoryAsync_Should_Update_Name_Only()
        {
            var category = CreateCategory("Old Name", "Old Description");
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            var dto = new UpdateCategoryDto
            {
                Name = "New Name"
            };

            var result = await _categoryService.UpdateCategoryAsync(category.Id, dto);

            Assert.True(result);
            var updated = await _context.Categories.FindAsync(category.Id);
            Assert.Equal("New Name", updated.Name);
            Assert.Equal("Old Description", updated.Description);
        }

        [Fact]
        public async Task UpdateCategoryAsync_Should_Update_Description_Only()
        {
            var category = CreateCategory("Old Name", "Old Description");
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            var dto = new UpdateCategoryDto
            {
                Description = "New Description"
            };

            var result = await _categoryService.UpdateCategoryAsync(category.Id, dto);

            Assert.True(result);
            var updated = await _context.Categories.FindAsync(category.Id);
            Assert.Equal("Old Name", updated.Name);
            Assert.Equal("New Description", updated.Description);
        }

        [Fact]
        public async Task UpdateCategoryAsync_Should_Update_Both_Name_And_Description()
        {
            var category = CreateCategory("Old Name", "Old Description");
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            var dto = new UpdateCategoryDto
            {
                Name = "New Name",
                Description = "New Description"
            };

            var result = await _categoryService.UpdateCategoryAsync(category.Id, dto);

            Assert.True(result);
            var updated = await _context.Categories.FindAsync(category.Id);
            Assert.Equal("New Name", updated.Name);
            Assert.Equal("New Description", updated.Description);
        }

        [Fact]
        public async Task DeleteCategoryAsync_Should_Return_Error_When_Not_Found()
        {
            var result = await _categoryService.DeleteCategoryAsync(999);

            Assert.Equal("Category not found.", result);
        }

        [Fact]
        public async Task DeleteCategoryAsync_Should_Return_Null_When_Deleted()
        {
            var category = CreateCategory("To Delete");
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            var result = await _categoryService.DeleteCategoryAsync(category.Id);

            Assert.Null(result);
            Assert.Empty(await _context.Categories.ToListAsync());
        }

        [Fact]
        public async Task DeleteCategoryAsync_Should_Return_Error_When_Category_Has_Products()
        {
            var category = CreateCategory("With Products");
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            _context.Products.Add(new Product
            {
                Name = "Test Product",
                Description = "",
                Price = 10,
                StockQuantity = 5,
                CategoryId = category.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            var result = await _categoryService.DeleteCategoryAsync(category.Id);

            Assert.Equal("Cannot delete this category because it has products. Remove products first.", result);
        }
    }
}