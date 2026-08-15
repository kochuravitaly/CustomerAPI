using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using WebApplication2.Data;
using WebApplication2.Models;
using WebApplication2.Services;

namespace WebApplication2.Tests.Services
{
    public class RefreshTokenCleanupServiceTests
    {
        private readonly Mock<IServiceScopeFactory> _serviceScopeFactoryMock;
        private readonly Mock<ILogger<RefreshTokenCleanupService>> _loggerMock;
        private readonly Mock<IServiceProvider> _serviceProviderMock;
        private readonly Mock<IServiceScope> _serviceScopeMock;
        private readonly RefreshTokenCleanupService _refreshTokenCleanupService;
        private readonly AppDbContext _context;

        public RefreshTokenCleanupServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);

            _serviceScopeFactoryMock = new Mock<IServiceScopeFactory>();
            _loggerMock = new Mock<ILogger<RefreshTokenCleanupService>>();
            _serviceProviderMock = new Mock<IServiceProvider>();
            _serviceScopeMock = new Mock<IServiceScope>();

            _refreshTokenCleanupService = new RefreshTokenCleanupService(
                _serviceScopeFactoryMock.Object,
                _loggerMock.Object);
        }

        private async Task AddRefreshTokenAsync(
            DateTime expiresAt,
            bool isRevoked = false)
        {
            var token = new RefreshToken
            {
                CustomerId = Guid.NewGuid(),
                TokenHash = Guid.NewGuid().ToString(),
                ExpiresAt = expiresAt,
                IsRevoked = isRevoked
            };

            _context.RefreshTokens.Add(token);

            await _context.SaveChangesAsync();
        }

        [Theory]
        [InlineData(-1, false)]
        [InlineData(30, true)]
        [InlineData(30, false)]
        public async Task DeleteRefreshTokensAsync_Should_Delete_Revoked_Or_Expired_Refresh_Tokens_And_Keep_Valid_Ones(
            int daysFromNow,
            bool isRevoked)
        {
            await AddRefreshTokenAsync(
                DateTime.UtcNow.AddDays(daysFromNow),
                isRevoked);

            _serviceProviderMock
                .Setup(x => x.GetService(typeof(AppDbContext)))
                .Returns(_context);

            _serviceScopeMock
                .Setup(x => x.ServiceProvider)
                .Returns(_serviceProviderMock.Object);

            _serviceScopeFactoryMock
                .Setup(x => x.CreateScope())
                .Returns(_serviceScopeMock.Object);

            await _refreshTokenCleanupService.DeleteRefreshTokensAsync(CancellationToken.None);
            
            if (!isRevoked && daysFromNow > 0)
            {
                Assert.Single(await _context.RefreshTokens.ToListAsync());
            }
            else
            {
                Assert.Empty(await _context.RefreshTokens.ToListAsync());
            }
        }
    }
}
