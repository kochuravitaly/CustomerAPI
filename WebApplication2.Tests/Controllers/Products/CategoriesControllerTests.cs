using Microsoft.AspNetCore.Mvc;
using Moq;
using WebApplication2.Controllers.Products;
using WebApplication2.DTOs.Products;
using WebApplication2.Services.Products.Interfaces;

namespace WebApplication2.Tests.Controllers
{
    public class CategoriesControllerTests
    {
        private readonly Mock<ICategoryService> _categoryServiceMock;
        private readonly CategoriesController _controller;

        public CategoriesControllerTests()
        {
            _categoryServiceMock = new Mock<ICategoryService>();
            _controller = new CategoriesController(_categoryServiceMock.Object);
        }

        [Fact]
        public async Task CreateCategory_Should_Return_CreatedAtAction_When_Created()
        {
            var createdCategory = new CategoryResponseDto
            {
                Id = 1,
                Name = "New Category"
            };

            _categoryServiceMock
                .Setup(x => x.CreateCategoryAsync(It.IsAny<CreateCategoryDto>()))
                .ReturnsAsync(createdCategory);

            var result = await _controller.CreateCategory(new CreateCategoryDto
            {
                Name = "New Category"
            });

            var createdAtActionResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            Assert.Equal("GetCategoryById", createdAtActionResult.ActionName);
        }

        [Fact]
        public async Task GetAllCategories_Should_Return_Ok_With_Categories()
        {
            var categories = new List<CategoryResponseDto>
            {
                new CategoryResponseDto { Id = 1, Name = "Category 1" },
                new CategoryResponseDto { Id = 2, Name = "Category 2" }
            };

            _categoryServiceMock
                .Setup(x => x.GetAllCategoriesAsync())
                .ReturnsAsync(categories);

            var result = await _controller.GetAllCategories();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(categories, okResult.Value);
        }

        [Fact]
        public async Task GetAllCategories_Should_Return_Ok_With_Empty_When_No_Categories()
        {
            _categoryServiceMock
                .Setup(x => x.GetAllCategoriesAsync())
                .ReturnsAsync(new List<CategoryResponseDto>());

            var result = await _controller.GetAllCategories();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var categories = Assert.IsAssignableFrom<IEnumerable<CategoryResponseDto>>(okResult.Value);
            Assert.Empty(categories);
        }

        [Fact]
        public async Task GetCategoryById_Should_Return_Ok_When_Found()
        {
            var category = new CategoryResponseDto
            {
                Id = 1,
                Name = "Found Category"
            };

            _categoryServiceMock
                .Setup(x => x.GetCategoryByIdAsync(1))
                .ReturnsAsync(category);

            var result = await _controller.GetCategoryById(1);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(category, okResult.Value);
        }

        [Fact]
        public async Task GetCategoryById_Should_Return_NotFound_When_Not_Found()
        {
            _categoryServiceMock
                .Setup(x => x.GetCategoryByIdAsync(999))
                .ReturnsAsync((CategoryResponseDto)null);

            var result = await _controller.GetCategoryById(999);

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Equal("Category not found.", notFoundResult.Value);
        }

        [Fact]
        public async Task UpdateCategory_Should_Return_NoContent_When_Updated()
        {
            _categoryServiceMock
                .Setup(x => x.UpdateCategoryAsync(1, It.IsAny<UpdateCategoryDto>()))
                .ReturnsAsync(true);

            var result = await _controller.UpdateCategory(1, new UpdateCategoryDto
            {
                Name = "Updated"
            });

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task UpdateCategory_Should_Return_NotFound_When_Not_Found()
        {
            _categoryServiceMock
                .Setup(x => x.UpdateCategoryAsync(999, It.IsAny<UpdateCategoryDto>()))
                .ReturnsAsync(false);

            var result = await _controller.UpdateCategory(999, new UpdateCategoryDto
            {
                Name = "Updated"
            });

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Category not found.", notFoundResult.Value);
        }

        [Fact]
        public async Task DeleteCategory_Should_Return_NoContent_When_Deleted()
        {
            _categoryServiceMock
                .Setup(x => x.DeleteCategoryAsync(1))
                .ReturnsAsync((string)null);

            var result = await _controller.DeleteCategory(1);

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeleteCategory_Should_Return_NotFound_When_Not_Found()
        {
            _categoryServiceMock
                .Setup(x => x.DeleteCategoryAsync(999))
                .ReturnsAsync("Category not found.");

            var result = await _controller.DeleteCategory(999);

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Category not found.", notFoundResult.Value);
        }

        [Fact]
        public async Task DeleteCategory_Should_Return_BadRequest_When_Has_Products()
        {
            _categoryServiceMock
                .Setup(x => x.DeleteCategoryAsync(1))
                .ReturnsAsync("Cannot delete this category because it has products. Remove products first.");

            var result = await _controller.DeleteCategory(1);

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Cannot delete this category because it has products. Remove products first.", badRequestResult.Value);
        }
    }
}