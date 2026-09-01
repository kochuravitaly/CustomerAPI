using Microsoft.AspNetCore.Mvc;
using Moq;
using WebApplication2.Controllers.Orders;
using WebApplication2.DTOs.Orders;
using WebApplication2.Services.Orders;

namespace WebApplication2.Tests.Controllers
{
    public class FlashSaleControllerTests
    {
        private readonly Mock<IFlashSaleService> _flashSaleServiceMock;
        private readonly FlashSaleController _controller;

        public FlashSaleControllerTests()
        {
            _flashSaleServiceMock = new Mock<IFlashSaleService>();
            _controller = new FlashSaleController(_flashSaleServiceMock.Object);
        }

        [Fact]
        public async Task GetActiveFlashSales_Should_Return_Ok_With_Flash_Sales()
        {
            var flashSales = new List<FlashSaleResponseDto>
            {
                new FlashSaleResponseDto { Id = 1, DiscountPercentage = 50 },
                new FlashSaleResponseDto { Id = 2, DiscountPercentage = 30 }
            };

            _flashSaleServiceMock
                .Setup(x => x.GetActiveFlashSalesAsync())
                .ReturnsAsync(flashSales);

            var result = await _controller.GetActiveFlashSales();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(flashSales, okResult.Value);
        }

        [Fact]
        public async Task GetActiveFlashSales_Should_Return_Ok_With_Empty_When_No_Active()
        {
            _flashSaleServiceMock
                .Setup(x => x.GetActiveFlashSalesAsync())
                .ReturnsAsync(new List<FlashSaleResponseDto>());

            var result = await _controller.GetActiveFlashSales();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var flashSales = Assert.IsAssignableFrom<IEnumerable<FlashSaleResponseDto>>(okResult.Value);
            Assert.Empty(flashSales);
        }

        [Fact]
        public async Task GetAllFlashSales_Should_Return_Ok_With_All_Flash_Sales()
        {
            var flashSales = new List<FlashSaleResponseDto>
            {
                new FlashSaleResponseDto { Id = 1, DiscountPercentage = 50 },
                new FlashSaleResponseDto { Id = 2, DiscountPercentage = 30 },
                new FlashSaleResponseDto { Id = 3, DiscountPercentage = 40 }
            };

            _flashSaleServiceMock
                .Setup(x => x.GetAllFlashSalesAsync())
                .ReturnsAsync(flashSales);

            var result = await _controller.GetAllFlashSales();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Same(flashSales, okResult.Value);
        }

        [Fact]
        public async Task CreateFlashSale_Should_Return_Ok_When_Created()
        {
            var createdFlashSale = new FlashSaleResponseDto
            {
                Id = 1,
                DiscountPercentage = 50
            };

            _flashSaleServiceMock
                .Setup(x => x.CreateFlashSaleAsync(It.IsAny<CreateFlashSaleDto>()))
                .ReturnsAsync(createdFlashSale);

            var result = await _controller.CreateFlashSale(new CreateFlashSaleDto
            {
                DiscountPercentage = 50,
                StartsAt = DateTime.UtcNow,
                EndsAt = DateTime.UtcNow.AddDays(1)
            });

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Same(createdFlashSale, okResult.Value);
        }

        [Fact]
        public async Task CreateFlashSale_Should_Return_BadRequest_When_Invalid()
        {
            _flashSaleServiceMock
                .Setup(x => x.CreateFlashSaleAsync(It.IsAny<CreateFlashSaleDto>()))
                .ReturnsAsync((FlashSaleResponseDto)null);

            var result = await _controller.CreateFlashSale(new CreateFlashSaleDto
            {
                DiscountPercentage = 0,
                StartsAt = DateTime.UtcNow,
                EndsAt = DateTime.UtcNow.AddDays(1)
            });

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Invalid flash sale data.", badRequestResult.Value);
        }

        [Fact]
        public async Task UpdateFlashSale_Should_Return_Ok_When_Updated()
        {
            var updatedFlashSale = new FlashSaleResponseDto
            {
                Id = 1,
                DiscountPercentage = 75
            };

            _flashSaleServiceMock
                .Setup(x => x.UpdateFlashSaleAsync(1, It.IsAny<CreateFlashSaleDto>()))
                .ReturnsAsync(updatedFlashSale);

            var result = await _controller.UpdateFlashSale(1, new CreateFlashSaleDto
            {
                DiscountPercentage = 75,
                StartsAt = DateTime.UtcNow,
                EndsAt = DateTime.UtcNow.AddDays(1)
            });

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.Same(updatedFlashSale, okResult.Value);
        }

        [Fact]
        public async Task UpdateFlashSale_Should_Return_BadRequest_When_Invalid()
        {
            _flashSaleServiceMock
                .Setup(x => x.UpdateFlashSaleAsync(999, It.IsAny<CreateFlashSaleDto>()))
                .ReturnsAsync((FlashSaleResponseDto)null);

            var result = await _controller.UpdateFlashSale(999, new CreateFlashSaleDto
            {
                DiscountPercentage = 100
            });

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Invalid flash sale data or not found.", badRequestResult.Value);
        }

        [Fact]
        public async Task DeleteFlashSale_Should_Return_NoContent_When_Deleted()
        {
            _flashSaleServiceMock
                .Setup(x => x.DeleteFlashSaleAsync(1))
                .ReturnsAsync(true);

            var result = await _controller.DeleteFlashSale(1);

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task DeleteFlashSale_Should_Return_NotFound_When_Not_Found()
        {
            _flashSaleServiceMock
                .Setup(x => x.DeleteFlashSaleAsync(999))
                .ReturnsAsync(false);

            var result = await _controller.DeleteFlashSale(999);

            Assert.IsType<NotFoundResult>(result);
        }
    }
}