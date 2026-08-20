using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using WebApplication2.Data;
using WebApplication2.Models;
using WebApplication2.Models.Auth;
using WebApplication2.Services.Auth.Services;

namespace WebApplication2.Tests.Services.Auth
{
    public class TokenCleanupServiceTests
    {
        private readonly Mock<IServiceScopeFactory> _serviceScopeFactoryMock;
        private readonly Mock<ILogger<TokenCleanupService>> _loggerMock;
        private readonly TokenCleanupService _tokenCleanupService;
        private readonly AppDbContext _context;

        public TokenCleanupServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);

            _serviceScopeFactoryMock = new Mock<IServiceScopeFactory>();
            _loggerMock = new Mock<ILogger<TokenCleanupService>>();

            _tokenCleanupService = new TokenCleanupService(
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
        private async Task AddPasswordResetTokenAsync(
            DateTime expiresAt,
            bool isUsed = false)
        {
            var token = new PasswordResetToken
            {
                CustomerId = Guid.NewGuid(),
                TokenHash = Guid.NewGuid().ToString(),
                ExpiresAt = expiresAt,
                IsUsed = isUsed
            };

            _context.PasswordResetTokens.Add(token);

            await _context.SaveChangesAsync();
        }

        private async Task AddPendingRegistrationAsync(
            DateTime expiresAt)
        {
            var pendingRegistration = new PendingRegistration
            {
                Name = "Test",
                Email = "test@test.com",
                PasswordHash = "hashed-password",
                CodeHash = "code-hash",
                ExpiresAt = expiresAt
            };

            _context.PendingRegistrations.Add(pendingRegistration);

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

            await _tokenCleanupService.DeleteRefreshTokensAsync(
                _context,
                CancellationToken.None);

            await _context.SaveChangesAsync();

            if (!isRevoked && daysFromNow > 0)
            {
                Assert.Single(await _context.RefreshTokens.ToListAsync());
            }
            else
            {
                Assert.Empty(await _context.RefreshTokens.ToListAsync());
            }
        }

        [Theory]
        [InlineData(-1, false)]
        [InlineData(30, true)]
        [InlineData(30, false)]
        public async Task DeletePasswordResetTokensAsync_Should_Delete_Used_Or_Expired_Tokens_And_Keep_Valid_Ones(
            int daysFromNow,
            bool isUsed)
        {
            await AddPasswordResetTokenAsync(
                DateTime.UtcNow.AddDays(daysFromNow),
                isUsed);

            await _tokenCleanupService.DeletePasswordResetTokensAsync(
                _context,
                CancellationToken.None);

            await _context.SaveChangesAsync();

            if (!isUsed && daysFromNow > 0)
            {
                Assert.Single(await _context.PasswordResetTokens.ToListAsync());
            }
            else
            {
                Assert.Empty(await _context.PasswordResetTokens.ToListAsync());
            }
        }

        [Theory]
        [InlineData(-1)]
        [InlineData(30)]
        public async Task DeletePendingRegistrationsAsync_Should_Delete_Expired_Registrations_And_Keep_Valid_Ones(
            int daysFromNow)
        {
            await AddPendingRegistrationAsync(
                DateTime.UtcNow.AddDays(daysFromNow));

            await _tokenCleanupService.DeletePendingRegistrationsAsync(
                _context,
                CancellationToken.None);

            await _context.SaveChangesAsync();

            if (daysFromNow > 0)
            {
                Assert.Single(await _context.PendingRegistrations.ToListAsync());
            }
            else
            {
                Assert.Empty(await _context.PendingRegistrations.ToListAsync());
            }
        }
    }
}
