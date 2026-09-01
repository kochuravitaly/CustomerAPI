using Microsoft.AspNetCore.Mvc;
using Moq;
using WebApplication2.Controllers.Products;
using WebApplication2.DTOs.Products;
using WebApplication2.Services.Products.Interfaces;

namespace WebApplication2.Tests.Controllers
{
    public class ProductsControllerTests
    {
        private readonly Mock<IProductService> _productServiceMock;
        private readonly ProductsController _controller;

        public ProductsControllerTests()
        {
            _productServiceMock = new Mock<IProductService>();
            _controller = new ProductsController(_productServiceMock.Object);
        }

        [Fact]
        public async Task CreateProduct_Should_Return_CreatedAtAction_When_Created()
        {
            var product = new ProductResponseDto
            {
                Id = 1,
                Name = "New Product"
            };

            _productServiceMock
                .Setup(x => x.CreateProductAsync(It.IsAny<CreateProductDto>()))
                .ReturnsAsync(product);

            var result = await _controller.CreateProduct(new CreateProductDto
            {
                Name = "New Product",
                Price = 100,
                StockQuantity = 10,
                CategoryId = 1
            });

            var createdAtActionResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            Assert.Equal("GetProductById", createdAtActionResult.ActionName);
        }

        [Fact]
        public async Task CreateProduct_Should_Return_NotFound_When_Category_Not_Found()
        {
            _productServiceMock
                .Setup(x => x.CreateProductAsync(It.IsAny<CreateProductDto>()))
                .ReturnsAsync((ProductResponseDto)null);

            var result = await _controller.CreateProduct(new CreateProductDto
            {
                Name = "New Product",
                Price = 100,
                StockQuantity = 10,
                CategoryId = 999
            });

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Equal("Category not found.", notFoundResult.Value);
        }

        [Fact]
        public async Task GetAllProducts_Should_Return_Ok_With_Products()
        {
            var pagedResult = new PagedResponseDto<ProductResponseDto>
            {
                Items = new List<ProductResponseDto>
                {
                    new ProductResponseDto { Id = 1, Name = "Product 1" },
                    new ProductResponseDto { Id = 2, Name = "Product 2" }
                },
                Page = 1,
                PageSize = 20,
                TotalCount = 2,
                TotalPages = 1
            };

            _productServiceMock
                .Setup(x => x.GetAllProductsAsync(It.IsAny<ProductQueryDto>()))
                .ReturnsAsync(pagedResult);

            var result = await _controller.GetAllProducts(new ProductQueryDto());

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(pagedResult, okResult.Value);
        }

        [Fact]
        public async Task GetAllProducts_Should_Return_Ok_With_Empty_When_No_Products()
        {
            var pagedResult = new PagedResponseDto<ProductResponseDto>
            {
                Items = new List<ProductResponseDto>(),
                Page = 1,
                PageSize = 20,
                TotalCount = 0,
                TotalPages = 0
            };

            _productServiceMock
                .Setup(x => x.GetAllProductsAsync(It.IsAny<ProductQueryDto>()))
                .ReturnsAsync(pagedResult);

            var result = await _controller.GetAllProducts(new ProductQueryDto());

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var products = Assert.IsAssignableFrom<PagedResponseDto<ProductResponseDto>>(okResult.Value);
            Assert.Empty(products.Items);
        }

        [Fact]
        public async Task GetProductById_Should_Return_Ok_When_Found()
        {
            var product = new ProductResponseDto
            {
                Id = 1,
                Name = "Found Product"
            };

            _productServiceMock
                .Setup(x => x.GetProductByIdAsync(1))
                .ReturnsAsync(product);

            var result = await _controller.GetProductById(1);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(product, okResult.Value);
        }

        [Fact]
        public async Task GetProductById_Should_Return_NotFound_When_Not_Found()
        {
            _productServiceMock
                .Setup(x => x.GetProductByIdAsync(999))
                .ReturnsAsync((ProductResponseDto)null);

            var result = await _controller.GetProductById(999);

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Equal("Product not found.", notFoundResult.Value);
        }

        [Fact]
        public async Task UpdateProduct_Should_Return_NoContent_When_Updated()
        {
            _productServiceMock
                .Setup(x => x.UpdateProductAsync(1, It.IsAny<UpdateProductDto>()))
                .ReturnsAsync(true);

            var result = await _controller.UpdateProduct(1, new UpdateProductDto
            {
                Name = "Updated"
            });

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task UpdateProduct_Should_Return_NotFound_When_Not_Found()
        {
            _productServiceMock
                .Setup(x => x.UpdateProductAsync(999, It.IsAny<UpdateProductDto>()))
                .ReturnsAsync(false);

            var result = await _controller.UpdateProduct(999, new UpdateProductDto
            {
                Name = "Updated"
            });

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task DeleteProduct_Should_Return_NoContent_When_Deleted()
        {
            _productServiceMock
                .Setup(x => x.DeleteProductAsync(1))
                .ReturnsAsync(true);

            var result = await _controller.DeleteProduct(1);

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeleteProduct_Should_Return_NotFound_When_Not_Found()
        {
            _productServiceMock
                .Setup(x => x.DeleteProductAsync(999))
                .ReturnsAsync(false);

            var result = await _controller.DeleteProduct(999);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task GetBestSellers_Should_Return_Ok_With_Products()
        {
            var products = new List<ProductResponseDto>
            {
                new ProductResponseDto { Id = 1, Name = "Bestseller 1" },
                new ProductResponseDto { Id = 2, Name = "Bestseller 2" }
            };

            _productServiceMock
                .Setup(x => x.GetBestSellersAsync())
                .ReturnsAsync(products);

            var result = await _controller.GetBestSellers();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(products, okResult.Value);
        }

        [Fact]
        public async Task GetBestSellers_Should_Return_Ok_With_Empty_When_No_Orders()
        {
            _productServiceMock
                .Setup(x => x.GetBestSellersAsync())
                .ReturnsAsync(new List<ProductResponseDto>());

            var result = await _controller.GetBestSellers();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var products = Assert.IsAssignableFrom<IEnumerable<ProductResponseDto>>(okResult.Value);
            Assert.Empty(products);
        }
    }
}