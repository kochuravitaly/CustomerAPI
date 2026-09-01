using Microsoft.EntityFrameworkCore;
using Moq;
using WebApplication2.Data;
using WebApplication2.Models.Auth;
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
            _refreshTokenService = new RefreshTokenService(_context, _secureTokenGeneratorMock.Object);
        }

        [Fact]
        public async Task SaveRefreshTokenAsync_Should_Hash_Token_And_Save()
        {
            var customerId = Guid.NewGuid();
            var rawToken = "raw-refresh-token";

            _secureTokenGeneratorMock
                .Setup(x => x.HashToken(rawToken))
                .Returns("hashed-refresh-token");

            await _refreshTokenService.SaveRefreshTokenAsync(rawToken, customerId);

            var savedToken = await _context.RefreshTokens.SingleAsync();

            Assert.Equal("hashed-refresh-token", savedToken.TokenHash);
            Assert.Equal(customerId, savedToken.CustomerId);
            Assert.False(savedToken.IsRevoked);
            Assert.True(savedToken.ExpiresAt > DateTime.UtcNow.AddDays(29));
            Assert.True(savedToken.ExpiresAt < DateTime.UtcNow.AddDays(31));
            Assert.Null(savedToken.SessionId);
        }

        [Fact]
        public async Task SaveRefreshTokenAsync_With_SessionId_Should_Save_SessionId()
        {
            var customerId = Guid.NewGuid();
            var sessionId = 123;

            _secureTokenGeneratorMock
                .Setup(x => x.HashToken(It.IsAny<string>()))
                .Returns("hashed-token");

            await _refreshTokenService.SaveRefreshTokenAsync("token", customerId, sessionId);

            var savedToken = await _context.RefreshTokens.SingleAsync();

            Assert.Equal(sessionId, savedToken.SessionId);
        }

        [Fact]
        public async Task SaveRefreshTokenAsync_Should_Call_HashToken_With_Correct_Token()
        {
            var customerId = Guid.NewGuid();
            var rawToken = "specific-token";

            _secureTokenGeneratorMock
                .Setup(x => x.HashToken(rawToken))
                .Returns("hashed");

            await _refreshTokenService.SaveRefreshTokenAsync(rawToken, customerId);

            _secureTokenGeneratorMock.Verify(
                x => x.HashToken(rawToken),
                Times.Once);
        }

        [Fact]
        public async Task SaveRefreshTokenAsync_Should_Set_Expiry_To_30_Days()
        {
            var customerId = Guid.NewGuid();

            _secureTokenGeneratorMock
                .Setup(x => x.HashToken(It.IsAny<string>()))
                .Returns("hashed");

            await _refreshTokenService.SaveRefreshTokenAsync("token", customerId);

            var savedToken = await _context.RefreshTokens.SingleAsync();

            var expectedExpiry = DateTime.UtcNow.AddDays(30);
            var difference = Math.Abs((expectedExpiry - savedToken.ExpiresAt).TotalMinutes);

            Assert.True(difference < 5);
        }

        [Fact]
        public async Task SaveRefreshTokenAsync_Should_Set_IsRevoked_To_False()
        {
            var customerId = Guid.NewGuid();

            _secureTokenGeneratorMock
                .Setup(x => x.HashToken(It.IsAny<string>()))
                .Returns("hashed");

            await _refreshTokenService.SaveRefreshTokenAsync("token", customerId);

            var savedToken = await _context.RefreshTokens.SingleAsync();

            Assert.False(savedToken.IsRevoked);
        }
    }
}