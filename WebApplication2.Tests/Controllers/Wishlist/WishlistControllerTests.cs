using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using WebApplication2.Controllers;
using WebApplication2.DTOs.Wishlist;
using WebApplication2.Services.Wishlist;

namespace WebApplication2.Tests.Controllers
{
    public class WishlistControllerTests
    {
        private readonly Mock<IWishlistService> _wishlistServiceMock;
        private readonly WishlistController _controller;

        public WishlistControllerTests()
        {
            _wishlistServiceMock = new Mock<IWishlistService>();
            _controller = new WishlistController(_wishlistServiceMock.Object);

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
        public async Task GetWishlist_Should_Return_Ok_With_Items()
        {
            var items = new List<WishlistItemResponseDto>
            {
                new WishlistItemResponseDto { ProductId = 1 }
            };

            _wishlistServiceMock.Setup(x => x.GetWishlistAsync(It.IsAny<Guid>())).ReturnsAsync(items);

            var result = await _controller.GetWishlist();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Equal(items, okResult.Value);
        }

        [Fact]
        public async Task GetWishlist_Should_Return_Ok_With_Empty_List()
        {
            var emptyList = new List<WishlistItemResponseDto>();

            _wishlistServiceMock.Setup(x => x.GetWishlistAsync(It.IsAny<Guid>())).ReturnsAsync(emptyList);

            var result = await _controller.GetWishlist();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.Empty((IEnumerable<WishlistItemResponseDto>)okResult.Value);
        }

        [Fact]
        public async Task AddToWishlist_Should_Return_Ok_When_Success()
        {
            _wishlistServiceMock.Setup(x => x.AddToWishlistAsync(It.IsAny<Guid>(), It.IsAny<AddWishlistItemDto>())).ReturnsAsync(true);

            var result = await _controller.AddToWishlist(new AddWishlistItemDto { ProductId = 1 });

            Assert.IsType<OkResult>(result);
        }

        [Fact]
        public async Task AddToWishlist_Should_Return_NotFound_When_Product_Not_Found()
        {
            _wishlistServiceMock.Setup(x => x.AddToWishlistAsync(It.IsAny<Guid>(), It.IsAny<AddWishlistItemDto>())).ReturnsAsync(false);

            var result = await _controller.AddToWishlist(new AddWishlistItemDto { ProductId = 999 });

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Product not found", notFoundResult.Value);
        }

        [Fact]
        public async Task RemoveFromWishlist_Should_Return_NoContent_When_Success()
        {
            _wishlistServiceMock.Setup(x => x.RemoveFromWishlistAsync(It.IsAny<Guid>(), It.IsAny<int>())).ReturnsAsync(true);

            var result = await _controller.RemoveFromWishlist(1);

            Assert.IsType<NoContentResult>(result);
        }

        [Fact]
        public async Task RemoveFromWishlist_Should_Return_NotFound_When_Not_Found()
        {
            _wishlistServiceMock.Setup(x => x.RemoveFromWishlistAsync(It.IsAny<Guid>(), It.IsAny<int>())).ReturnsAsync(false);

            var result = await _controller.RemoveFromWishlist(999);

            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public async Task IsInWishlist_Should_Return_Ok_With_True()
        {
            _wishlistServiceMock.Setup(x => x.IsInWishlistAsync(It.IsAny<Guid>(), It.IsAny<int>())).ReturnsAsync(true);

            var result = await _controller.IsInWishlist(1);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.True((bool)okResult.Value);
        }

        [Fact]
        public async Task IsInWishlist_Should_Return_Ok_With_False()
        {
            _wishlistServiceMock.Setup(x => x.IsInWishlistAsync(It.IsAny<Guid>(), It.IsAny<int>())).ReturnsAsync(false);

            var result = await _controller.IsInWishlist(999);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            Assert.False((bool)okResult.Value);
        }

        [Fact]
        public async Task ClearWishlist_Should_Return_NoContent()
        {
            _wishlistServiceMock.Setup(x => x.ClearWishlistAsync(It.IsAny<Guid>())).Returns(Task.CompletedTask);

            var result = await _controller.ClearWishlist();

            Assert.IsType<NoContentResult>(result);

            _wishlistServiceMock.Verify(x => x.ClearWishlistAsync(It.IsAny<Guid>()), Times.Once);
        }
    }
}
