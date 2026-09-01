using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using WebApplication2.Controllers.Products;
using WebApplication2.DTOs.Products;
using WebApplication2.Services.FileStorage.Interfaces;
using WebApplication2.Services.Products.Interfaces;

namespace WebApplication2.Tests.Controllers
{
    public class ProductImagesControllerTests
    {
        private readonly Mock<IProductImageService> _productImageServiceMock;
        private readonly Mock<IFileStorageService> _fileStorageServiceMock;
        private readonly ProductImagesController _controller;

        public ProductImagesControllerTests()
        {
            _productImageServiceMock = new Mock<IProductImageService>();
            _fileStorageServiceMock = new Mock<IFileStorageService>();
            _controller = new ProductImagesController(
                _productImageServiceMock.Object,
                _fileStorageServiceMock.Object);
        }

        private IFormFile CreateFormFile(string fileName = "test.jpg")
        {
            var fileMock = new Mock<IFormFile>();
            var content = new byte[] { 0xFF, 0xD8, 0xFF };

            fileMock.Setup(x => x.FileName).Returns(fileName);
            fileMock.Setup(x => x.ContentType).Returns("image/jpeg");
            fileMock.Setup(x => x.Length).Returns(content.Length);
            fileMock.Setup(x => x.OpenReadStream()).Returns(new MemoryStream(content));

            return fileMock.Object;
        }

        [Fact]
        public async Task Upload_Should_Return_Ok_When_Successful()
        {
            var image = new ProductImageResponseDto
            {
                Id = 1,
                ProductId = 1,
                FileName = "test.jpg"
            };

            _productImageServiceMock
                .Setup(x => x.UploadAsync(1, It.IsAny<IFormFile>(), null, It.IsAny<CancellationToken>()))
                .ReturnsAsync(image);

            var result = await _controller.Upload(1, CreateFormFile());

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Same(image, okResult.Value);
        }

        [Fact]
        public async Task Upload_Should_Return_NotFound_When_Product_Not_Found()
        {
            _productImageServiceMock
                .Setup(x => x.UploadAsync(999, It.IsAny<IFormFile>(), null, It.IsAny<CancellationToken>()))
                .ReturnsAsync((ProductImageResponseDto)null);

            var result = await _controller.Upload(999, CreateFormFile());

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Product not found.", notFoundResult.Value);
        }

        [Fact]
        public async Task Upload_Should_Return_BadRequest_When_Exception()
        {
            _productImageServiceMock
                .Setup(x => x.UploadAsync(1, It.IsAny<IFormFile>(), null, It.IsAny<CancellationToken>()))
                .ThrowsAsync(new Exception("Upload failed"));

            var result = await _controller.Upload(1, CreateFormFile());

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task GetImage_Should_Return_Redirect_When_Found()
        {
            var image = new ProductImageResponseDto
            {
                Id = 1,
                ProductId = 1,
                ObjectKey = "products/1/test.jpg"
            };

            _productImageServiceMock
                .Setup(x => x.GetByIdAsync(1, 1))
                .ReturnsAsync(image);

            var result = await _controller.GetImage(1, 1);

            var redirectResult = Assert.IsType<RedirectResult>(result);
            Assert.Contains("test.jpg", redirectResult.Url);
        }

        [Fact]
        public async Task GetImage_Should_Return_NotFound_When_Not_Found()
        {
            _productImageServiceMock
                .Setup(x => x.GetByIdAsync(999, 999))
                .ReturnsAsync((ProductImageResponseDto)null);

            var result = await _controller.GetImage(999, 999);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task Delete_Should_Return_NoContent_When_Deleted()
        {
            _productImageServiceMock
                .Setup(x => x.DeleteAsync(1, 1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            var result = await _controller.Delete(1, 1);

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task Delete_Should_Return_NotFound_When_Not_Found()
        {
            _productImageServiceMock
                .Setup(x => x.DeleteAsync(999, 999, It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            var result = await _controller.Delete(999, 999);

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Image not found.", notFoundResult.Value);
        }

        [Fact]
        public async Task SetMain_Should_Return_NoContent_When_Updated()
        {
            _productImageServiceMock
                .Setup(x => x.SetMainAsync(1, 1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            var result = await _controller.SetMain(1, 1);

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task SetMain_Should_Return_NotFound_When_Not_Found()
        {
            _productImageServiceMock
                .Setup(x => x.SetMainAsync(999, 999, It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            var result = await _controller.SetMain(999, 999);

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Image not found.", notFoundResult.Value);
        }

        [Fact]
        public async Task UpdateSortOrder_Should_Return_NoContent_When_Updated()
        {
            _productImageServiceMock
                .Setup(x => x.UpdateSortOrderAsync(1, 1, 3, It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            var result = await _controller.UpdateSortOrder(1, 1, new UpdateProductImageOrderDto
            {
                SortOrder = 3
            });

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task UpdateSortOrder_Should_Return_NotFound_When_Not_Found()
        {
            _productImageServiceMock
                .Setup(x => x.UpdateSortOrderAsync(999, 999, 3, It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            var result = await _controller.UpdateSortOrder(999, 999, new UpdateProductImageOrderDto
            {
                SortOrder = 3
            });

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Image not found.", notFoundResult.Value);
        }

        [Fact]
        public async Task UpdateImageColor_Should_Return_NoContent_When_Updated()
        {
            _productImageServiceMock
                .Setup(x => x.UpdateColorAsync(1, 1, 5))
                .ReturnsAsync(true);

            var result = await _controller.UpdateImageColor(1, 1, new UpdateImageColorDto
            {
                ColorId = 5
            });

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task UpdateImageColor_Should_Return_NotFound_When_Not_Found()
        {
            _productImageServiceMock
                .Setup(x => x.UpdateColorAsync(999, 999, 5))
                .ReturnsAsync(false);

            var result = await _controller.UpdateImageColor(999, 999, new UpdateImageColorDto
            {
                ColorId = 5
            });

            Assert.IsType<NotFoundResult>(result);
        }
    }
}