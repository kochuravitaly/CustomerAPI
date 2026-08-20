using Microsoft.EntityFrameworkCore;
using Moq;
using WebApplication2.Data;
using WebApplication2.Services.Auth.Interfaces;
using WebApplication2.Services.Auth.Services;

namespace WebApplication2.Tests.Services.Auth
{
    public class RefreshTokenServiceTests
    {
        private readonly Mock<ISecureTokenGeneratorService> _secureTokenGeneratorMock;
        private readonly AppDbContext _context;
        private readonly RefreshTokenService _refreshTokenService;

        public RefreshTokenServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _secureTokenGeneratorMock = new Mock<ISecureTokenGeneratorService>();

            _refreshTokenService = new RefreshTokenService(
                _context,
                _secureTokenGeneratorMock.Object
            );
        }

        [Fact]
        public async Task SaveRefreshTokenAsync_Should_Save_Refresh_Token_To_Database()
        {
            var customerId = Guid.NewGuid();
            var refreshToken = "fake-refresh-token";
            var refreshTokenHash = "fake-token-hash";

            _secureTokenGeneratorMock
                .Setup(x => x.HashToken(refreshToken))
                .Returns(refreshTokenHash);

            await _refreshTokenService.SaveRefreshTokenAsync(
                refreshToken,
                customerId);

            var savedToken = await _context.RefreshTokens
                .SingleAsync(rt => rt.CustomerId == customerId);

            Assert.Equal(refreshTokenHash, savedToken.TokenHash);
            Assert.Equal(customerId, savedToken.CustomerId);
            Assert.False(savedToken.IsRevoked);
            Assert.True(savedToken.ExpiresAt > DateTime.UtcNow);
        }
    }
}
