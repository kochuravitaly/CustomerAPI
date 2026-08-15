using Microsoft.AspNetCore.Mvc;
using Moq;
using WebApplication2.Controllers;
using WebApplication2.DTOs;
using WebApplication2.Services;

namespace WebApplication2.Tests.Controllers
{
    public class RefreshTokenControllerTests
    {
        private readonly Mock<IRefreshTokenService> _refreshTokenServiceMock;
        private readonly RefreshTokenController _refreshTokenController;

        public RefreshTokenControllerTests()
        {
            _refreshTokenServiceMock = new Mock<IRefreshTokenService>();

            _refreshTokenController = new RefreshTokenController(
                _refreshTokenServiceMock.Object);
        }

        [Fact]
        public async Task Refresh_Should_Return_Ok_When_Refresh_Token_Is_Valid()
        {
            var tokenResponse = new TokenResponseDto
            {
                Token = "new-access-token",
                RefreshToken = "new-refresh-token"
            };

            _refreshTokenServiceMock
                .Setup(x => x.RefreshTokenAsync(It.IsAny<string>()))
                .ReturnsAsync(tokenResponse);

            var result = await _refreshTokenController.Refresh("refresh-token");

            var okResult = Assert.IsType<OkObjectResult>(result.Result);

            var response = Assert.IsType<TokenResponseDto>(okResult.Value);

            Assert.Equal("new-access-token", response.Token);
            Assert.Equal("new-refresh-token", response.RefreshToken);
        }

        [Fact]
        public async Task Refresh_Should_Return_Unauthorized_When_Refresh_Token_Is_Invalid()
        {
            _refreshTokenServiceMock
                .Setup(x => x.RefreshTokenAsync(It.IsAny<string>()))
                .ReturnsAsync((TokenResponseDto?)null);

            var result = await _refreshTokenController.Refresh("invalid-refresh-token");

            Assert.IsType<UnauthorizedResult>(result.Result);
        }
    }
}
