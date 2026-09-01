using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Moq;
using WebApplication2.Data;
using WebApplication2.Models.Products;
using WebApplication2.Services.FileStorage.Interfaces;
using WebApplication2.Services.Products.Services;

namespace WebApplication2.Tests.Services.Products
{
    public class ProductImageServiceTests
    {
        private readonly Mock<IFileStorageService> _fileStorageMock;
        private readonly Mock<IImageFileValidator> _imageValidatorMock;
        private readonly AppDbContext _context;
        private readonly ProductImageService _productImageService;

        public ProductImageServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _fileStorageMock = new Mock<IFileStorageService>();
            _imageValidatorMock = new Mock<IImageFileValidator>();

            _productImageService = new ProductImageService(
                _context,
                _fileStorageMock.Object,
                _imageValidatorMock.Object);

            _context.Categories.Add(new Category { Name = "Test Category", Description = "" });
            _context.SaveChanges();
        }

        private async Task<Product> CreateProductAsync()
        {
            var product = new Product
            {
                Name = "Test Product",
                Description = "",
                Price = 10,
                StockQuantity = 10,
                CategoryId = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return product;
        }

        private async Task<ProductImage> CreateImageAsync(
            int productId,
            int? colorId = null,
            bool isMain = false,
            int sortOrder = 0)
        {
            var image = new ProductImage
            {
                ProductId = productId,
                ColorId = colorId,
                ObjectKey = $"products/{productId}/test.jpg",
                FileName = "test.jpg",
                ContentType = "image/jpeg",
                FileSize = 100,
                SortOrder = sortOrder,
                IsMain = isMain,
                CreatedAt = DateTime.UtcNow
            };

            _context.ProductImages.Add(image);
            await _context.SaveChangesAsync();
            return image;
        }

        private IFormFile CreateFormFile(
            string fileName = "test.jpg",
            string contentType = "image/jpeg",
            int length = 100)
        {
            var fileMock = new Mock<IFormFile>();
            var content = new byte[length];

            fileMock.Setup(x => x.FileName).Returns(fileName);
            fileMock.Setup(x => x.ContentType).Returns(contentType);
            fileMock.Setup(x => x.Length).Returns(length);
            fileMock.Setup(x => x.OpenReadStream()).Returns(new MemoryStream(content));

            return fileMock.Object;
        }

        [Fact]
        public async Task UploadAsync_Should_Return_Null_When_Product_Not_Found()
        {
            var result = await _productImageService.UploadAsync(
                999,
                CreateFormFile());

            Assert.Null(result);
        }

        [Fact]
        public async Task UploadAsync_Should_Return_Null_When_File_Is_Null()
        {
            var product = await CreateProductAsync();

            var result = await _productImageService.UploadAsync(
                product.Id,
                null);

            Assert.Null(result);
        }

        [Fact]
        public async Task UploadAsync_Should_Upload_And_Create_Image()
        {
            var product = await CreateProductAsync();
            var file = CreateFormFile("test.jpg", "image/jpeg", 100);

            _fileStorageMock
                .Setup(x => x.UploadAsync(
                    It.IsAny<Stream>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var result = await _productImageService.UploadAsync(
                product.Id,
                file);

            Assert.NotNull(result);
            Assert.Equal(product.Id, result.ProductId);
            Assert.Equal("test.jpg", result.FileName);
            Assert.Single(await _context.ProductImages.ToListAsync());

            _fileStorageMock.Verify(
                x => x.UploadAsync(
                    It.IsAny<Stream>(),
                    It.IsAny<string>(),
                    "image/jpeg",
                    It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Fact]
        public async Task UploadAsync_Should_Upload_With_ColorId()
        {
            var product = await CreateProductAsync();
            var file = CreateFormFile();

            _fileStorageMock
                .Setup(x => x.UploadAsync(
                    It.IsAny<Stream>(),
                    It.IsAny<string>(),
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var result = await _productImageService.UploadAsync(
                product.Id,
                file,
                colorId: 5);

            Assert.NotNull(result);
            Assert.Equal(5, result.ColorId);
        }

        [Fact]
        public async Task GetByIdAsync_Should_Return_Image_When_Found()
        {
            var product = await CreateProductAsync();
            var image = await CreateImageAsync(product.Id);

            var result = await _productImageService.GetByIdAsync(product.Id, image.Id);

            Assert.NotNull(result);
            Assert.Equal(image.Id, result.Id);
            Assert.Equal(product.Id, result.ProductId);
        }

        [Fact]
        public async Task GetByIdAsync_Should_Return_Null_When_Not_Found()
        {
            var result = await _productImageService.GetByIdAsync(999, 999);

            Assert.Null(result);
        }

        [Fact]
        public async Task GetByIdAsync_Should_Return_Null_When_Image_Belongs_To_Other_Product()
        {
            var product = await CreateProductAsync();
            var image = await CreateImageAsync(product.Id);

            var result = await _productImageService.GetByIdAsync(999, image.Id);

            Assert.Null(result);
        }

        [Fact]
        public async Task DeleteAsync_Should_Return_False_When_Not_Found()
        {
            var result = await _productImageService.DeleteAsync(999, 999);

            Assert.False(result);
        }

        [Fact]
        public async Task DeleteAsync_Should_Delete_Image_And_Remove_From_Storage()
        {
            var product = await CreateProductAsync();
            var image = await CreateImageAsync(product.Id);

            _fileStorageMock
                .Setup(x => x.DeleteAsync(
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var result = await _productImageService.DeleteAsync(product.Id, image.Id);

            Assert.True(result);
            Assert.Empty(await _context.ProductImages.ToListAsync());

            _fileStorageMock.Verify(
                x => x.DeleteAsync(
                    image.ObjectKey,
                    It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Fact]
        public async Task DeleteAsync_Should_Still_Delete_When_Storage_Delete_Fails()
        {
            var product = await CreateProductAsync();
            var image = await CreateImageAsync(product.Id);

            _fileStorageMock
                .Setup(x => x.DeleteAsync(
                    It.IsAny<string>(),
                    It.IsAny<CancellationToken>()))
                .ThrowsAsync(new Exception("Storage error"));

            var result = await _productImageService.DeleteAsync(product.Id, image.Id);

            Assert.True(result);
            Assert.Empty(await _context.ProductImages.ToListAsync());
        }

        [Fact]
        public async Task SetMainAsync_Should_Return_False_When_Not_Found()
        {
            var result = await _productImageService.SetMainAsync(999, 999);

            Assert.False(result);
        }

        [Fact]
        public async Task SetMainAsync_Should_Set_Image_As_Main_And_Unset_Others()
        {
            var product = await CreateProductAsync();
            var image1 = await CreateImageAsync(product.Id, isMain: true);
            var image2 = await CreateImageAsync(product.Id, isMain: false);
            var image3 = await CreateImageAsync(product.Id, isMain: false);

            var result = await _productImageService.SetMainAsync(product.Id, image2.Id);

            Assert.True(result);

            var updatedImage1 = await _context.ProductImages.FindAsync(image1.Id);
            var updatedImage2 = await _context.ProductImages.FindAsync(image2.Id);
            var updatedImage3 = await _context.ProductImages.FindAsync(image3.Id);

            Assert.False(updatedImage1.IsMain);
            Assert.True(updatedImage2.IsMain);
            Assert.False(updatedImage3.IsMain);
        }

        [Fact]
        public async Task UpdateSortOrderAsync_Should_Return_False_When_Not_Found()
        {
            var result = await _productImageService.UpdateSortOrderAsync(999, 999, 5);

            Assert.False(result);
        }

        [Fact]
        public async Task UpdateSortOrderAsync_Should_Update_Sort_Order()
        {
            var product = await CreateProductAsync();
            var image = await CreateImageAsync(product.Id, sortOrder: 0);

            var result = await _productImageService.UpdateSortOrderAsync(product.Id, image.Id, 3);

            Assert.True(result);
            var updated = await _context.ProductImages.FindAsync(image.Id);
            Assert.Equal(3, updated.SortOrder);
        }

        [Fact]
        public async Task UpdateColorAsync_Should_Return_False_When_Not_Found()
        {
            var result = await _productImageService.UpdateColorAsync(999, 999, 5);

            Assert.False(result);
        }

        [Fact]
        public async Task UpdateColorAsync_Should_Update_Color()
        {
            var product = await CreateProductAsync();
            var image = await CreateImageAsync(product.Id, colorId: null);

            var result = await _productImageService.UpdateColorAsync(product.Id, image.Id, 7);

            Assert.True(result);
            var updated = await _context.ProductImages.FindAsync(image.Id);
            Assert.Equal(7, updated.ColorId);
        }

        [Fact]
        public async Task UpdateColorAsync_Should_Set_Color_To_Null()
        {
            var product = await CreateProductAsync();
            var image = await CreateImageAsync(product.Id, colorId: 5);

            var result = await _productImageService.UpdateColorAsync(product.Id, image.Id, null);

            Assert.True(result);
            var updated = await _context.ProductImages.FindAsync(image.Id);
            Assert.Null(updated.ColorId);
        }
    }
}