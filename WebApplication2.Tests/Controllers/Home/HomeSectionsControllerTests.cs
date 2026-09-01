using Microsoft.AspNetCore.Mvc;
using Moq;
using WebApplication2.Controllers.Home;
using WebApplication2.DTOs.Home;
using WebApplication2.DTOs.Products;
using WebApplication2.Services.Home;

namespace WebApplication2.Tests.Controllers
{
    public class HomeSectionsControllerTests
    {
        private readonly Mock<IHomeSectionService> _homeSectionServiceMock;
        private readonly HomeSectionsController _controller;

        public HomeSectionsControllerTests()
        {
            _homeSectionServiceMock = new Mock<IHomeSectionService>();
            _controller = new HomeSectionsController(_homeSectionServiceMock.Object);
        }

        [Fact]
        public async Task GetActiveSections_Should_Return_Ok_With_Sections()
        {
            var sections = new List<HomeSectionResponseDto>
            {
                new HomeSectionResponseDto { Id = 1, Title = "Featured" },
                new HomeSectionResponseDto { Id = 2, Title = "Sale" }
            };

            _homeSectionServiceMock
                .Setup(x => x.GetActiveSectionsAsync())
                .ReturnsAsync(sections);

            var result = await _controller.GetActiveSections();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(sections, okResult.Value);
        }

        [Fact]
        public async Task GetActiveSections_Should_Return_Ok_With_Empty_When_No_Sections()
        {
            _homeSectionServiceMock
                .Setup(x => x.GetActiveSectionsAsync())
                .ReturnsAsync(new List<HomeSectionResponseDto>());

            var result = await _controller.GetActiveSections();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var sections = Assert.IsAssignableFrom<IEnumerable<HomeSectionResponseDto>>(okResult.Value);
            Assert.Empty(sections);
        }

        [Fact]
        public async Task GetAllSections_Should_Return_Ok_With_All_Sections()
        {
            var sections = new List<HomeSectionResponseDto>
            {
                new HomeSectionResponseDto { Id = 1, Title = "Active", IsActive = true },
                new HomeSectionResponseDto { Id = 2, Title = "Inactive", IsActive = false }
            };

            _homeSectionServiceMock
                .Setup(x => x.GetAllSectionsAsync())
                .ReturnsAsync(sections);

            var result = await _controller.GetAllSections();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(sections, okResult.Value);
        }

        [Fact]
        public async Task CreateSection_Should_Return_Ok_With_Created_Section()
        {
            var createdSection = new HomeSectionResponseDto
            {
                Id = 1,
                Title = "New Section"
            };

            _homeSectionServiceMock
                .Setup(x => x.CreateSectionAsync(It.IsAny<CreateHomeSectionDto>()))
                .ReturnsAsync(createdSection);

            var result = await _controller.CreateSection(new CreateHomeSectionDto
            {
                Title = "New Section",
                ProductsToShow = 4,
                FilterJson = "{}"
            });

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(createdSection, okResult.Value);
        }

        [Fact]
        public async Task UpdateSection_Should_Return_Ok_When_Found()
        {
            var updatedSection = new HomeSectionResponseDto
            {
                Id = 1,
                Title = "Updated"
            };

            _homeSectionServiceMock
                .Setup(x => x.UpdateSectionAsync(1, It.IsAny<CreateHomeSectionDto>()))
                .ReturnsAsync(updatedSection);

            var result = await _controller.UpdateSection(1, new CreateHomeSectionDto
            {
                Title = "Updated"
            });

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(updatedSection, okResult.Value);
        }

        [Fact]
        public async Task UpdateSection_Should_Return_NotFound_When_Not_Found()
        {
            _homeSectionServiceMock
                .Setup(x => x.UpdateSectionAsync(999, It.IsAny<CreateHomeSectionDto>()))
                .ReturnsAsync((HomeSectionResponseDto)null);

            var result = await _controller.UpdateSection(999, new CreateHomeSectionDto
            {
                Title = "Updated"
            });

            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task DeleteSection_Should_Return_NoContent_When_Deleted()
        {
            _homeSectionServiceMock
                .Setup(x => x.DeleteSectionAsync(1))
                .ReturnsAsync(true);

            var result = await _controller.DeleteSection(1);

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeleteSection_Should_Return_NotFound_When_Not_Found()
        {
            _homeSectionServiceMock
                .Setup(x => x.DeleteSectionAsync(999))
                .ReturnsAsync(false);

            var result = await _controller.DeleteSection(999);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task GetSectionProducts_Should_Return_Ok_With_Products()
        {
            var pagedResult = new PagedResponseDto<ProductResponseDto>
            {
                Items = new List<ProductResponseDto>
                {
                    new ProductResponseDto { Id = 1, Name = "Product 1" }
                },
                Page = 1,
                PageSize = 4,
                TotalCount = 1,
                TotalPages = 1
            };

            _homeSectionServiceMock
                .Setup(x => x.GetSectionProductsAsync(1, 1, 4))
                .ReturnsAsync(pagedResult);

            var result = await _controller.GetSectionProducts(1);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Same(pagedResult, okResult.Value);
        }

        [Fact]
        public async Task GetSectionProducts_Should_Return_Ok_With_Empty_When_No_Products()
        {
            var pagedResult = new PagedResponseDto<ProductResponseDto>
            {
                Items = new List<ProductResponseDto>(),
                Page = 1,
                PageSize = 4,
                TotalCount = 0,
                TotalPages = 0
            };

            _homeSectionServiceMock
                .Setup(x => x.GetSectionProductsAsync(999, 1, 4))
                .ReturnsAsync(pagedResult);

            var result = await _controller.GetSectionProducts(999);

            var okResult = Assert.IsType<OkObjectResult>(result);
            var products = Assert.IsAssignableFrom<PagedResponseDto<ProductResponseDto>>(okResult.Value);
            Assert.Empty(products.Items);
        }
    }
}