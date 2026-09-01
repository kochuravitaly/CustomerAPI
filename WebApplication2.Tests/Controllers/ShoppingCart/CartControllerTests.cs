using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using WebApplication2.Controllers.ShoppingCart;
using WebApplication2.DTOs.ShoppingCart;
using WebApplication2.Services.ShoppingCart;

namespace WebApplication2.Tests.Controllers.ShoppingCart
{
    public class CartControllerTests
    {
        private readonly Mock<ICartService> _cartServiceMock;
        private readonly CartController _controller;

        public CartControllerTests()
        {
            _cartServiceMock = new Mock<ICartService>();
            _controller = new CartController(_cartServiceMock.Object);

            var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
            }));

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
        }

        [Fact]
        public async Task GetCart_Should_Return_Ok_With_Cart()
        {
            var cart = new CartResponseDto
            {
                CartItems = new List<CartItemResponseDto>
                {
                    new CartItemResponseDto { ProductId = 1, ProductName = "Test", Quantity = 2, Total = 200 }
                },
                Total = 200
            };

            _cartServiceMock.Setup(x => x.GetCartAsync(It.IsAny<Guid>())).ReturnsAsync(cart);

            var result = await _controller.GetCart();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(cart, okResult.Value);
        }

        [Fact]
        public async Task GetCart_Should_Return_Ok_With_Empty_Cart()
        {
            var emptyCart = new CartResponseDto();

            _cartServiceMock.Setup(x => x.GetCartAsync(It.IsAny<Guid>())).ReturnsAsync(emptyCart);

            var result = await _controller.GetCart();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Empty(((CartResponseDto)okResult.Value).CartItems);
        }

        [Fact]
        public async Task AddCartItem_Should_Return_NoContent_When_Success()
        {
            _cartServiceMock.Setup(x => x.AddCartItemAsync(It.IsAny<Guid>(), It.IsAny<AddCartItemDto>())).ReturnsAsync(true);

            var result = await _controller.AddCartItem(new AddCartItemDto { ProductId = 1, Quantity = 2 });

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task AddCartItem_Should_Return_NotFound_When_Product_Not_Found()
        {
            _cartServiceMock.Setup(x => x.AddCartItemAsync(It.IsAny<Guid>(), It.IsAny<AddCartItemDto>())).ReturnsAsync(false);

            var result = await _controller.AddCartItem(new AddCartItemDto { ProductId = 999, Quantity = 1 });

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Product not found.", notFoundResult.Value);
        }

        [Fact]
        public async Task AddCartItem_Should_Return_NotFound_When_Quantity_Exceeds_Stock()
        {
            _cartServiceMock.Setup(x => x.AddCartItemAsync(It.IsAny<Guid>(), It.IsAny<AddCartItemDto>())).ReturnsAsync(false);

            var result = await _controller.AddCartItem(new AddCartItemDto { ProductId = 1, Quantity = 100 });

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task UpdateCartItem_Should_Return_NoContent_When_Success()
        {
            _cartServiceMock.Setup(x => x.UpdateCartItemAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<UpdateCartItemDto>())).ReturnsAsync(true);

            var result = await _controller.UpdateCartItem(1, new UpdateCartItemDto { Quantity = 5 });

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task UpdateCartItem_Should_Return_NotFound_When_Item_Not_Found()
        {
            _cartServiceMock.Setup(x => x.UpdateCartItemAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<UpdateCartItemDto>())).ReturnsAsync(false);

            var result = await _controller.UpdateCartItem(999, new UpdateCartItemDto { Quantity = 5 });

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Cart item not found.", notFoundResult.Value);
        }

        [Fact]
        public async Task RemoveCartItem_Should_Return_NoContent_When_Success()
        {
            _cartServiceMock.Setup(x => x.RemoveCartItemAsync(It.IsAny<Guid>(), It.IsAny<int>())).ReturnsAsync(true);

            var result = await _controller.RemoveCartItem(1);

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task RemoveCartItem_Should_Return_NotFound_When_Item_Not_Found()
        {
            _cartServiceMock.Setup(x => x.RemoveCartItemAsync(It.IsAny<Guid>(), It.IsAny<int>())).ReturnsAsync(false);

            var result = await _controller.RemoveCartItem(999);

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Cart item not found.", notFoundResult.Value);
        }

        [Fact]
        public async Task ClearCart_Should_Return_NoContent()
        {
            _cartServiceMock.Setup(x => x.ClearCartAsync(It.IsAny<Guid>())).Returns(Task.CompletedTask);

            var result = await _controller.ClearCart();

            Assert.IsType<NoContentResult>(result);

            _cartServiceMock.Verify(x => x.ClearCartAsync(It.IsAny<Guid>()), Times.Once);
        }
    }
}