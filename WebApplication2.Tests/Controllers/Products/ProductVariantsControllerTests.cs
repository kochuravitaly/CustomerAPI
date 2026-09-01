using Microsoft.AspNetCore.Mvc;
using Moq;
using WebApplication2.Controllers.Products;
using WebApplication2.DTOs.Products;
using WebApplication2.Services.Products.Interfaces;

namespace WebApplication2.Tests.Controllers
{
    public class ProductVariantsControllerTests
    {
        private readonly Mock<IProductVariantService> _variantServiceMock;
        private readonly ProductVariantsController _controller;

        public ProductVariantsControllerTests()
        {
            _variantServiceMock = new Mock<IProductVariantService>();
            _controller = new ProductVariantsController(_variantServiceMock.Object);
        }

        [Fact]
        public async Task GetVariants_Should_Return_Ok_With_Variants()
        {
            var variants = new List<ProductVariantResponseDto>
            {
                new ProductVariantResponseDto { Id = 1, ColorId = 1, SizeId = 1, StockQuantity = 5 },
                new ProductVariantResponseDto { Id = 2, ColorId = 2, SizeId = 1, StockQuantity = 3 }
            };

            _variantServiceMock
                .Setup(x => x.GetProductVariantsAsync(1))
                .ReturnsAsync(variants);

            var result = await _controller.GetVariants(1);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(variants, okResult.Value);
        }

        [Fact]
        public async Task GetVariants_Should_Return_Ok_With_Empty_When_No_Variants()
        {
            _variantServiceMock
                .Setup(x => x.GetProductVariantsAsync(999))
                .ReturnsAsync(new List<ProductVariantResponseDto>());

            var result = await _controller.GetVariants(999);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var variants = Assert.IsAssignableFrom<List<ProductVariantResponseDto>>(okResult.Value);
            Assert.Empty(variants);
        }

        [Fact]
        public async Task GetColors_Should_Return_Ok_With_Colors()
        {
            var colors = new List<ProductColorDto>
            {
                new ProductColorDto { Id = 1, Name = "Red", HexCode = "#FF0000" },
                new ProductColorDto { Id = 2, Name = "Blue", HexCode = "#0000FF" }
            };

            _variantServiceMock
                .Setup(x => x.GetProductColorsAsync(1))
                .ReturnsAsync(colors);

            var result = await _controller.GetColors(1);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(colors, okResult.Value);
        }

        [Fact]
        public async Task GetSizes_Should_Return_Ok_With_Sizes()
        {
            var sizes = new List<ProductSizeDto>
            {
                new ProductSizeDto { Id = 1, Name = "S" },
                new ProductSizeDto { Id = 2, Name = "M" },
                new ProductSizeDto { Id = 3, Name = "L" }
            };

            _variantServiceMock
                .Setup(x => x.GetProductSizesAsync(1))
                .ReturnsAsync(sizes);

            var result = await _controller.GetSizes(1);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(sizes, okResult.Value);
        }

        [Fact]
        public async Task CreateVariant_Should_Return_Ok_When_Created()
        {
            var variant = new ProductVariantResponseDto
            {
                Id = 1,
                ColorId = 1,
                SizeId = 1,
                StockQuantity = 5
            };

            _variantServiceMock
                .Setup(x => x.CreateVariantAsync(1, It.IsAny<CreateProductVariantDto>()))
                .ReturnsAsync(variant);

            var result = await _controller.CreateVariant(1, new CreateProductVariantDto
            {
                ColorId = 1,
                SizeId = 1,
                StockQuantity = 5
            });

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(variant, okResult.Value);
        }

        [Fact]
        public async Task CreateVariant_Should_Return_NotFound_When_Product_Not_Found()
        {
            _variantServiceMock
                .Setup(x => x.CreateVariantAsync(999, It.IsAny<CreateProductVariantDto>()))
                .ReturnsAsync((ProductVariantResponseDto)null);

            var result = await _controller.CreateVariant(999, new CreateProductVariantDto());

            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task CreateColor_Should_Return_Ok_When_Created()
        {
            var color = new ProductColorDto
            {
                Id = 1,
                Name = "Red",
                HexCode = "#FF0000"
            };

            _variantServiceMock
                .Setup(x => x.CreateColorAsync(1, It.IsAny<CreateProductColorDto>()))
                .ReturnsAsync(color);

            var result = await _controller.CreateColor(1, new CreateProductColorDto
            {
                Name = "Red",
                HexCode = "#FF0000"
            });

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(color, okResult.Value);
        }

        [Fact]
        public async Task CreateColor_Should_Return_NotFound_When_Product_Not_Found()
        {
            _variantServiceMock
                .Setup(x => x.CreateColorAsync(999, It.IsAny<CreateProductColorDto>()))
                .ReturnsAsync((ProductColorDto)null);

            var result = await _controller.CreateColor(999, new CreateProductColorDto());

            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task CreateSize_Should_Return_Ok_When_Created()
        {
            var size = new ProductSizeDto
            {
                Id = 1,
                Name = "M"
            };

            _variantServiceMock
                .Setup(x => x.CreateSizeAsync(1, It.IsAny<CreateProductSizeDto>()))
                .ReturnsAsync(size);

            var result = await _controller.CreateSize(1, new CreateProductSizeDto
            {
                Name = "M"
            });

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(size, okResult.Value);
        }

        [Fact]
        public async Task CreateSize_Should_Return_NotFound_When_Product_Not_Found()
        {
            _variantServiceMock
                .Setup(x => x.CreateSizeAsync(999, It.IsAny<CreateProductSizeDto>()))
                .ReturnsAsync((ProductSizeDto)null);

            var result = await _controller.CreateSize(999, new CreateProductSizeDto());

            Assert.IsType<NotFoundResult>(result.Result);
        }

        [Fact]
        public async Task DeleteVariant_Should_Return_NoContent_When_Deleted()
        {
            _variantServiceMock.Setup(x => x.DeleteVariantAsync(1)).ReturnsAsync(true);
            var result = await _controller.DeleteVariant(1);
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeleteVariant_Should_Return_NotFound_When_Not_Found()
        {
            _variantServiceMock.Setup(x => x.DeleteVariantAsync(999)).ReturnsAsync(false);
            var result = await _controller.DeleteVariant(999);
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task DeleteColor_Should_Return_NoContent_When_Deleted()
        {
            _variantServiceMock.Setup(x => x.DeleteColorAsync(1, 1)).ReturnsAsync(true);
            var result = await _controller.DeleteColor(1, 1);
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeleteColor_Should_Return_NotFound_When_Not_Found()
        {
            _variantServiceMock.Setup(x => x.DeleteColorAsync(999, 999)).ReturnsAsync(false);
            var result = await _controller.DeleteColor(999, 999);
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task DeleteSize_Should_Return_NoContent_When_Deleted()
        {
            _variantServiceMock.Setup(x => x.DeleteSizeAsync(1, 1)).ReturnsAsync(true);
            var result = await _controller.DeleteSize(1, 1);
            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeleteSize_Should_Return_NotFound_When_Not_Found()
        {
            _variantServiceMock.Setup(x => x.DeleteSizeAsync(999, 999)).ReturnsAsync(false);
            var result = await _controller.DeleteSize(999, 999);
            Assert.IsType<NotFoundResult>(result);
        }
    }
}