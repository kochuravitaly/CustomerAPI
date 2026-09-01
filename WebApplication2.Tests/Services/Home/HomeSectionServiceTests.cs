using Microsoft.EntityFrameworkCore;
using Moq;
using WebApplication2.Data;
using WebApplication2.DTOs.Home;
using WebApplication2.Models.Home;
using WebApplication2.Models.Products;
using WebApplication2.Services.Home;
using WebApplication2.Services.Translation.Interfaces;

namespace WebApplication2.Tests.Services.Home
{
    public class HomeSectionServiceTests
    {
        private readonly Mock<ITranslationService> _translationServiceMock;
        private readonly AppDbContext _context;
        private readonly HomeSectionService _homeSectionService;

        public HomeSectionServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _translationServiceMock = new Mock<ITranslationService>();

            _translationServiceMock
                .Setup(x => x.TranslateAsync(It.IsAny<string>(), It.IsAny<string[]>()))
                .ReturnsAsync((string text, string[] langs) => langs.ToDictionary(l => l, l => text));

            _homeSectionService = new HomeSectionService(_context, _translationServiceMock.Object);

            _context.Categories.Add(new Category
            {
                Name = "Test Category",
                Description = ""
            });
            _context.SaveChanges();
        }

        private HomeSection CreateSection(
            string title = "Test Section",
            int displayOrder = 1,
            bool isActive = true,
            int productsToShow = 4,
            string filterJson = "{}")
        {
            return new HomeSection
            {
                Title = title,
                DisplayOrder = displayOrder,
                IsActive = isActive,
                ProductsToShow = productsToShow,
                FilterJson = filterJson,
                CreatedAt = DateTime.UtcNow
            };
        }

        private Product CreateProduct(
            string name,
            decimal price = 10,
            ProductGender? gender = null,
            ProductSeason? season = null,
            ProductAgeGroup? ageGroup = null,
            int? materialId = null,
            int? styleId = null,
            int? occasionId = null,
            int? patternId = null)
        {
            return new Product
            {
                Name = name,
                Description = "",
                Price = price,
                StockQuantity = 100,
                CategoryId = 1,
                Gender = gender,
                Season = season,
                AgeGroup = ageGroup,
                MaterialId = materialId,
                StyleId = styleId,
                OccasionId = occasionId,
                PatternId = patternId,
                SeasonsJson = "[]",
                AgeGroupsJson = "[]",
                MaterialCompositionJson = "[]",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        [Fact]
        public async Task GetActiveSectionsAsync_Should_Return_Only_Active_Sections()
        {
            _context.HomeSections.Add(CreateSection("Active 1", 1, true));
            _context.HomeSections.Add(CreateSection("Active 2", 2, true));
            _context.HomeSections.Add(CreateSection("Inactive", 3, false));
            await _context.SaveChangesAsync();

            var result = await _homeSectionService.GetActiveSectionsAsync();

            Assert.Equal(2, result.Count());
            Assert.DoesNotContain(result, s => s.Title == "Inactive");
        }

        [Fact]
        public async Task GetActiveSectionsAsync_Should_Return_Ordered_By_DisplayOrder()
        {
            _context.HomeSections.Add(CreateSection("Second", 2));
            _context.HomeSections.Add(CreateSection("First", 1));
            _context.HomeSections.Add(CreateSection("Third", 3));
            await _context.SaveChangesAsync();

            var result = await _homeSectionService.GetActiveSectionsAsync();

            Assert.Equal("First", result.First().Title);
            Assert.Equal("Second", result.Skip(1).First().Title);
            Assert.Equal("Third", result.Last().Title);
        }

        [Fact]
        public async Task GetAllSectionsAsync_Should_Return_All_Sections_Including_Inactive()
        {
            _context.HomeSections.Add(CreateSection("Active", 1, true));
            _context.HomeSections.Add(CreateSection("Inactive", 2, false));
            await _context.SaveChangesAsync();

            var result = await _homeSectionService.GetAllSectionsAsync();

            Assert.Equal(2, result.Count());
        }

        [Fact]
        public async Task CreateSectionAsync_Should_Create_With_Next_Display_Order()
        {
            _context.HomeSections.Add(CreateSection("Existing", 1));
            await _context.SaveChangesAsync();

            var dto = new CreateHomeSectionDto
            {
                Title = "New Section",
                ProductsToShow = 4,
                FilterJson = "{}"
            };

            var result = await _homeSectionService.CreateSectionAsync(dto);

            Assert.NotNull(result);
            Assert.Equal("New Section", result.Title);
            Assert.Equal(2, result.DisplayOrder);
        }

        [Fact]
        public async Task CreateSectionAsync_Should_Create_With_Order_One_When_No_Sections()
        {
            var dto = new CreateHomeSectionDto
            {
                Title = "First Section",
                ProductsToShow = 4,
                FilterJson = "{}"
            };

            var result = await _homeSectionService.CreateSectionAsync(dto);

            Assert.NotNull(result);
            Assert.Equal(1, result.DisplayOrder);
        }

        [Fact]
        public async Task CreateSectionAsync_Should_Save_Translations()
        {
            var dto = new CreateHomeSectionDto
            {
                Title = "Translated Section",
                ProductsToShow = 4,
                FilterJson = "{}"
            };

            await _homeSectionService.CreateSectionAsync(dto);

            Assert.Equal(3, await _context.HomeSectionTranslations.CountAsync());
            Assert.True(await _context.HomeSectionTranslations.AnyAsync(t => t.LanguageCode == "en"));
            Assert.True(await _context.HomeSectionTranslations.AnyAsync(t => t.LanguageCode == "ru"));
            Assert.True(await _context.HomeSectionTranslations.AnyAsync(t => t.LanguageCode == "de"));
        }

        [Fact]
        public async Task UpdateSectionAsync_Should_Return_Null_When_Not_Found()
        {
            var dto = new CreateHomeSectionDto
            {
                Title = "Updated",
                ProductsToShow = 5,
                FilterJson = "{}"
            };

            var result = await _homeSectionService.UpdateSectionAsync(999, dto);

            Assert.Null(result);
        }

        [Fact]
        public async Task UpdateSectionAsync_Should_Update_Fields()
        {
            var section = CreateSection("Old Title", 1, true, 4, "{}");
            _context.HomeSections.Add(section);
            await _context.SaveChangesAsync();

            var dto = new CreateHomeSectionDto
            {
                Title = "New Title",
                ProductsToShow = 10,
                FilterJson = "{}"
            };

            var result = await _homeSectionService.UpdateSectionAsync(section.Id, dto);

            Assert.NotNull(result);
            Assert.Equal("New Title", result.Title);
            Assert.Equal(10, result.ProductsToShow);
        }

        [Fact]
        public async Task DeleteSectionAsync_Should_Return_False_When_Not_Found()
        {
            var result = await _homeSectionService.DeleteSectionAsync(999);

            Assert.False(result);
        }

        [Fact]
        public async Task DeleteSectionAsync_Should_Return_True_When_Deleted()
        {
            var section = CreateSection("To Delete");
            _context.HomeSections.Add(section);
            await _context.SaveChangesAsync();

            var result = await _homeSectionService.DeleteSectionAsync(section.Id);

            Assert.True(result);
            Assert.Empty(await _context.HomeSections.ToListAsync());
        }

        [Fact]
        public async Task GetSectionProductsAsync_Should_Return_Empty_When_Section_Not_Found()
        {
            var result = await _homeSectionService.GetSectionProductsAsync(999);

            Assert.Empty(result.Items);
            Assert.Equal(0, result.TotalCount);
        }

        [Fact]
        public async Task GetSectionProductsAsync_Should_Return_All_Products_With_No_Filters()
        {
            var section = CreateSection("No Filters", 1, true, 10, "{}");
            _context.HomeSections.Add(section);
            _context.Products.Add(CreateProduct("Product 1"));
            _context.Products.Add(CreateProduct("Product 2"));
            await _context.SaveChangesAsync();

            var result = await _homeSectionService.GetSectionProductsAsync(section.Id);

            Assert.Equal(2, result.Items.Count());
        }

        [Fact]
        public async Task GetSectionProductsAsync_Should_Filter_By_Gender()
        {
            var filterJson = "{\"gender\": 1}";
            var section = CreateSection("Men Section", 1, true, 10, filterJson);
            _context.HomeSections.Add(section);
            _context.Products.Add(CreateProduct("Men Product", gender: ProductGender.Men));
            _context.Products.Add(CreateProduct("Women Product", gender: ProductGender.Women));
            await _context.SaveChangesAsync();

            var result = await _homeSectionService.GetSectionProductsAsync(section.Id);

            Assert.Single(result.Items);
            Assert.Equal("Men Product", result.Items.First().Name);
        }

        [Fact]
        public async Task GetSectionProductsAsync_Should_Filter_By_Season()
        {
            var filterJson = "{\"season\": 2}";
            var section = CreateSection("Winter", 1, true, 10, filterJson);
            _context.HomeSections.Add(section);
            _context.Products.Add(CreateProduct("Winter Product", season: ProductSeason.Winter));
            _context.Products.Add(CreateProduct("Summer Product", season: ProductSeason.Summer));
            await _context.SaveChangesAsync();

            var result = await _homeSectionService.GetSectionProductsAsync(section.Id);

            Assert.Single(result.Items);
            Assert.Equal("Winter Product", result.Items.First().Name);
        }

        [Fact]
        public async Task GetSectionProductsAsync_Should_Filter_By_AgeGroup()
        {
            var filterJson = "{\"ageGroup\": 0}";
            var section = CreateSection("Adult", 1, true, 10, filterJson);
            _context.HomeSections.Add(section);
            _context.Products.Add(CreateProduct("Adult Product", ageGroup: ProductAgeGroup.Adult));
            _context.Products.Add(CreateProduct("Kids Product", ageGroup: ProductAgeGroup.Kids));
            await _context.SaveChangesAsync();

            var result = await _homeSectionService.GetSectionProductsAsync(section.Id);

            Assert.Single(result.Items);
            Assert.Equal("Adult Product", result.Items.First().Name);
        }

        [Fact]
        public async Task GetSectionProductsAsync_Should_Filter_By_MaterialId()
        {
            var filterJson = "{\"materialId\": 1}";
            var section = CreateSection("Cotton", 1, true, 10, filterJson);
            _context.HomeSections.Add(section);
            _context.Products.Add(CreateProduct("Cotton Product", materialId: 1));
            _context.Products.Add(CreateProduct("Polyester Product", materialId: 2));
            await _context.SaveChangesAsync();

            var result = await _homeSectionService.GetSectionProductsAsync(section.Id);

            Assert.Single(result.Items);
            Assert.Equal("Cotton Product", result.Items.First().Name);
        }

        [Fact]
        public async Task GetSectionProductsAsync_Should_Filter_By_StyleId()
        {
            var filterJson = "{\"styleId\": 1}";
            var section = CreateSection("Casual", 1, true, 10, filterJson);
            _context.HomeSections.Add(section);
            _context.Products.Add(CreateProduct("Casual Product", styleId: 1));
            _context.Products.Add(CreateProduct("Formal Product", styleId: 2));
            await _context.SaveChangesAsync();

            var result = await _homeSectionService.GetSectionProductsAsync(section.Id);

            Assert.Single(result.Items);
            Assert.Equal("Casual Product", result.Items.First().Name);
        }

        [Fact]
        public async Task GetSectionProductsAsync_Should_Filter_By_OccasionId()
        {
            var filterJson = "{\"occasionId\": 1}";
            var section = CreateSection("Daily", 1, true, 10, filterJson);
            _context.HomeSections.Add(section);
            _context.Products.Add(CreateProduct("Daily Product", occasionId: 1));
            _context.Products.Add(CreateProduct("Party Product", occasionId: 2));
            await _context.SaveChangesAsync();

            var result = await _homeSectionService.GetSectionProductsAsync(section.Id);

            Assert.Single(result.Items);
            Assert.Equal("Daily Product", result.Items.First().Name);
        }

        [Fact]
        public async Task GetSectionProductsAsync_Should_Filter_By_PatternId()
        {
            var filterJson = "{\"patternId\": 1}";
            var section = CreateSection("Striped", 1, true, 10, filterJson);
            _context.HomeSections.Add(section);
            _context.Products.Add(CreateProduct("Striped Product", patternId: 1));
            _context.Products.Add(CreateProduct("Plain Product", patternId: 2));
            await _context.SaveChangesAsync();

            var result = await _homeSectionService.GetSectionProductsAsync(section.Id);

            Assert.Single(result.Items);
            Assert.Equal("Striped Product", result.Items.First().Name);
        }

        [Fact]
        public async Task GetSectionProductsAsync_Should_Return_Paginated_Results()
        {
            var section = CreateSection("Paginated", 1, true, 2, "{}");
            _context.HomeSections.Add(section);

            for (int i = 1; i <= 5; i++)
            {
                _context.Products.Add(CreateProduct($"Product {i}", price: i * 10));
            }
            await _context.SaveChangesAsync();

            var result = await _homeSectionService.GetSectionProductsAsync(section.Id, page: 1, pageSize: 2);

            Assert.Equal(2, result.Items.Count());
            Assert.Equal(5, result.TotalCount);
            Assert.Equal(3, result.TotalPages);
        }

        [Fact]
        public async Task GetSectionProductsAsync_Should_Handle_Invalid_Filter_Json()
        {
            var section = CreateSection("Invalid", 1, true, 10, "invalid-json");
            _context.HomeSections.Add(section);
            _context.Products.Add(CreateProduct("Test Product"));
            await _context.SaveChangesAsync();

            var result = await _homeSectionService.GetSectionProductsAsync(section.Id);

            Assert.Single(result.Items);
        }
    }
}