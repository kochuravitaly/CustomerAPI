using Microsoft.AspNetCore.Mvc;
using Moq;
using WebApplication2.Controllers.Products;
using WebApplication2.DTOs.Products;
using WebApplication2.Services.Products.Interfaces;

namespace WebApplication2.Tests.Controllers
{
    public class ProductAttributesControllerTests
    {
        private readonly Mock<IAttributeService> _attributeServiceMock;
        private readonly ProductAttributesController _controller;

        public ProductAttributesControllerTests()
        {
            _attributeServiceMock = new Mock<IAttributeService>();
            _controller = new ProductAttributesController(_attributeServiceMock.Object);
        }

        [Fact]
        public async Task GetMaterials_Should_Return_Ok_With_Default_Language()
        {
            var materials = new List<ProductAttributeDto>
            {
                new ProductAttributeDto { Id = 1, Name = "Cotton" }
            };

            _attributeServiceMock
                .Setup(x => x.GetMaterialsAsync("en"))
                .ReturnsAsync(materials);

            var result = await _controller.GetMaterials();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(materials, okResult.Value);
        }

        [Fact]
        public async Task GetMaterials_Should_Parse_Language_From_Header()
        {
            _attributeServiceMock
                .Setup(x => x.GetMaterialsAsync("ru"))
                .ReturnsAsync(new List<ProductAttributeDto>());

            var result = await _controller.GetMaterials("ru-RU,ru;q=0.9");

            _attributeServiceMock.Verify(x => x.GetMaterialsAsync("ru"), Times.Once);
        }

        [Fact]
        public async Task GetStyles_Should_Return_Ok()
        {
            _attributeServiceMock
                .Setup(x => x.GetStylesAsync("en"))
                .ReturnsAsync(new List<ProductAttributeDto>());

            var result = await _controller.GetStyles();

            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task GetOccasions_Should_Return_Ok()
        {
            _attributeServiceMock
                .Setup(x => x.GetOccasionsAsync("en"))
                .ReturnsAsync(new List<ProductAttributeDto>());

            var result = await _controller.GetOccasions();

            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task GetPatterns_Should_Return_Ok()
        {
            _attributeServiceMock
                .Setup(x => x.GetPatternsAsync("en"))
                .ReturnsAsync(new List<ProductAttributeDto>());

            var result = await _controller.GetPatterns();

            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task CreateMaterial_Should_Return_Ok_When_Created()
        {
            var material = new ProductAttributeDto { Id = 1, Name = "Cotton" };

            _attributeServiceMock
                .Setup(x => x.CreateMaterialAsync(It.IsAny<CreateProductAttributeDto>()))
                .ReturnsAsync(material);

            var result = await _controller.CreateMaterial(new CreateProductAttributeDto { Name = "Cotton" });

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(material, okResult.Value);
        }

        [Fact]
        public async Task CreateMaterial_Should_Return_BadRequest_When_Failed()
        {
            _attributeServiceMock
                .Setup(x => x.CreateMaterialAsync(It.IsAny<CreateProductAttributeDto>()))
                .ReturnsAsync((ProductAttributeDto)null);

            var result = await _controller.CreateMaterial(new CreateProductAttributeDto { Name = "" });

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Failed to create material", badRequestResult.Value);
        }

        [Fact]
        public async Task CreateStyle_Should_Return_Ok_When_Created()
        {
            var style = new ProductAttributeDto { Id = 1, Name = "Casual" };

            _attributeServiceMock
                .Setup(x => x.CreateStyleAsync(It.IsAny<CreateProductAttributeDto>()))
                .ReturnsAsync(style);

            var result = await _controller.CreateStyle(new CreateProductAttributeDto { Name = "Casual" });

            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task CreateStyle_Should_Return_BadRequest_When_Failed()
        {
            _attributeServiceMock
                .Setup(x => x.CreateStyleAsync(It.IsAny<CreateProductAttributeDto>()))
                .ReturnsAsync((ProductAttributeDto)null);

            var result = await _controller.CreateStyle(new CreateProductAttributeDto { Name = "" });

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Failed to create style", badRequestResult.Value);
        }

        [Fact]
        public async Task CreateOccasion_Should_Return_Ok_When_Created()
        {
            var occasion = new ProductAttributeDto { Id = 1, Name = "Daily" };

            _attributeServiceMock
                .Setup(x => x.CreateOccasionAsync(It.IsAny<CreateProductAttributeDto>()))
                .ReturnsAsync(occasion);

            var result = await _controller.CreateOccasion(new CreateProductAttributeDto { Name = "Daily" });

            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task CreateOccasion_Should_Return_BadRequest_When_Failed()
        {
            _attributeServiceMock
                .Setup(x => x.CreateOccasionAsync(It.IsAny<CreateProductAttributeDto>()))
                .ReturnsAsync((ProductAttributeDto)null);

            var result = await _controller.CreateOccasion(new CreateProductAttributeDto { Name = "" });

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Failed to create occasion", badRequestResult.Value);
        }

        [Fact]
        public async Task CreatePattern_Should_Return_Ok_When_Created()
        {
            var pattern = new ProductAttributeDto { Id = 1, Name = "Striped" };

            _attributeServiceMock
                .Setup(x => x.CreatePatternAsync(It.IsAny<CreateProductAttributeDto>()))
                .ReturnsAsync(pattern);

            var result = await _controller.CreatePattern(new CreateProductAttributeDto { Name = "Striped" });

            Assert.IsType<OkObjectResult>(result.Result);
        }

        [Fact]
        public async Task CreatePattern_Should_Return_BadRequest_When_Failed()
        {
            _attributeServiceMock
                .Setup(x => x.CreatePatternAsync(It.IsAny<CreateProductAttributeDto>()))
                .ReturnsAsync((ProductAttributeDto)null);

            var result = await _controller.CreatePattern(new CreateProductAttributeDto { Name = "" });

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Failed to create pattern", badRequestResult.Value);
        }

        [Fact]
        public async Task DeleteMaterial_Should_Return_NoContent_When_Deleted()
        {
            _attributeServiceMock.Setup(x => x.DeleteMaterialAsync(1)).ReturnsAsync(true);
            var result = await _controller.DeleteMaterial(1);
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeleteMaterial_Should_Return_NotFound_When_Not_Found()
        {
            _attributeServiceMock.Setup(x => x.DeleteMaterialAsync(999)).ReturnsAsync(false);
            var result = await _controller.DeleteMaterial(999);
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task DeleteStyle_Should_Return_NoContent_When_Deleted()
        {
            _attributeServiceMock.Setup(x => x.DeleteStyleAsync(1)).ReturnsAsync(true);
            var result = await _controller.DeleteStyle(1);
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeleteStyle_Should_Return_NotFound_When_Not_Found()
        {
            _attributeServiceMock.Setup(x => x.DeleteStyleAsync(999)).ReturnsAsync(false);
            var result = await _controller.DeleteStyle(999);
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task DeleteOccasion_Should_Return_NoContent_When_Deleted()
        {
            _attributeServiceMock.Setup(x => x.DeleteOccasionAsync(1)).ReturnsAsync(true);
            var result = await _controller.DeleteOccasion(1);
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeleteOccasion_Should_Return_NotFound_When_Not_Found()
        {
            _attributeServiceMock.Setup(x => x.DeleteOccasionAsync(999)).ReturnsAsync(false);
            var result = await _controller.DeleteOccasion(999);
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task DeletePattern_Should_Return_NoContent_When_Deleted()
        {
            _attributeServiceMock.Setup(x => x.DeletePatternAsync(1)).ReturnsAsync(true);
            var result = await _controller.DeletePattern(1);
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeletePattern_Should_Return_NotFound_When_Not_Found()
        {
            _attributeServiceMock.Setup(x => x.DeletePatternAsync(999)).ReturnsAsync(false);
            var result = await _controller.DeletePattern(999);
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task UpdateMaterial_Should_Return_NoContent_When_Updated()
        {
            _attributeServiceMock.Setup(x => x.UpdateMaterialAsync(1, It.IsAny<CreateProductAttributeDto>())).ReturnsAsync(true);
            var result = await _controller.UpdateMaterial(1, new CreateProductAttributeDto { Name = "Updated" });
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task UpdateMaterial_Should_Return_NotFound_When_Not_Found()
        {
            _attributeServiceMock.Setup(x => x.UpdateMaterialAsync(999, It.IsAny<CreateProductAttributeDto>())).ReturnsAsync(false);
            var result = await _controller.UpdateMaterial(999, new CreateProductAttributeDto { Name = "Updated" });
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task UpdateStyle_Should_Return_NoContent_When_Updated()
        {
            _attributeServiceMock.Setup(x => x.UpdateStyleAsync(1, It.IsAny<CreateProductAttributeDto>())).ReturnsAsync(true);
            var result = await _controller.UpdateStyle(1, new CreateProductAttributeDto { Name = "Updated" });
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task UpdateStyle_Should_Return_NotFound_When_Not_Found()
        {
            _attributeServiceMock.Setup(x => x.UpdateStyleAsync(999, It.IsAny<CreateProductAttributeDto>())).ReturnsAsync(false);
            var result = await _controller.UpdateStyle(999, new CreateProductAttributeDto { Name = "Updated" });
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task UpdateOccasion_Should_Return_NoContent_When_Updated()
        {
            _attributeServiceMock.Setup(x => x.UpdateOccasionAsync(1, It.IsAny<CreateProductAttributeDto>())).ReturnsAsync(true);
            var result = await _controller.UpdateOccasion(1, new CreateProductAttributeDto { Name = "Updated" });
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task UpdateOccasion_Should_Return_NotFound_When_Not_Found()
        {
            _attributeServiceMock.Setup(x => x.UpdateOccasionAsync(999, It.IsAny<CreateProductAttributeDto>())).ReturnsAsync(false);
            var result = await _controller.UpdateOccasion(999, new CreateProductAttributeDto { Name = "Updated" });
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task UpdatePattern_Should_Return_NoContent_When_Updated()
        {
            _attributeServiceMock.Setup(x => x.UpdatePatternAsync(1, It.IsAny<CreateProductAttributeDto>())).ReturnsAsync(true);
            var result = await _controller.UpdatePattern(1, new CreateProductAttributeDto { Name = "Updated" });
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task UpdatePattern_Should_Return_NotFound_When_Not_Found()
        {
            _attributeServiceMock.Setup(x => x.UpdatePatternAsync(999, It.IsAny<CreateProductAttributeDto>())).ReturnsAsync(false);
            var result = await _controller.UpdatePattern(999, new CreateProductAttributeDto { Name = "Updated" });
            Assert.IsType<NotFoundResult>(result);
        }
    }
}