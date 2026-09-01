using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using WebApplication2.Data;
using WebApplication2.Models.Auth;
using WebApplication2.Services.Auth.Services;

namespace WebApplication2.Tests.Services.Auth
{
    public class TokenCleanupServiceTests
    {
        private readonly Mock<ILogger<TokenCleanupService>> _loggerMock;
        private readonly AppDbContext _context;
        private readonly TokenCleanupService _cleanupService;

        public TokenCleanupServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);
            _loggerMock = new Mock<ILogger<TokenCleanupService>>();
            _cleanupService = new TokenCleanupService(
                Mock.Of<IServiceScopeFactory>(),
                _loggerMock.Object);
        }

        [Fact]
        public async Task DeleteRefreshTokensAsync_Should_Delete_Revoked_Tokens()
        {
            _context.RefreshTokens.Add(new RefreshToken
            {
                CustomerId = Guid.NewGuid(),
                TokenHash = "revoked-token",
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                IsRevoked = true
            });
            await _context.SaveChangesAsync();

            await _cleanupService.DeleteRefreshTokensAsync(_context, CancellationToken.None);
            await _context.SaveChangesAsync();

            Assert.Empty(await _context.RefreshTokens.ToListAsync());
        }

        [Fact]
        public async Task DeleteRefreshTokensAsync_Should_Delete_Expired_Tokens()
        {
            _context.RefreshTokens.Add(new RefreshToken
            {
                CustomerId = Guid.NewGuid(),
                TokenHash = "expired-token",
                ExpiresAt = DateTime.UtcNow.AddDays(-1),
                IsRevoked = false
            });
            await _context.SaveChangesAsync();

            await _cleanupService.DeleteRefreshTokensAsync(_context, CancellationToken.None);
            await _context.SaveChangesAsync();

            Assert.Empty(await _context.RefreshTokens.ToListAsync());
        }

        [Fact]
        public async Task DeleteRefreshTokensAsync_Should_Keep_Active_Tokens()
        {
            _context.RefreshTokens.Add(new RefreshToken
            {
                CustomerId = Guid.NewGuid(),
                TokenHash = "active-token",
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                IsRevoked = false
            });
            await _context.SaveChangesAsync();

            await _cleanupService.DeleteRefreshTokensAsync(_context, CancellationToken.None);
            await _context.SaveChangesAsync();

            Assert.Single(await _context.RefreshTokens.ToListAsync());
        }

        [Fact]
        public async Task DeleteRefreshTokensAsync_Should_Log_When_Tokens_Deleted()
        {
            _context.RefreshTokens.Add(new RefreshToken
            {
                CustomerId = Guid.NewGuid(),
                TokenHash = "revoked-token",
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                IsRevoked = true
            });
            await _context.SaveChangesAsync();

            await _cleanupService.DeleteRefreshTokensAsync(_context, CancellationToken.None);

            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task DeleteRefreshTokensAsync_Should_Not_Log_When_No_Tokens_Deleted()
        {
            await _cleanupService.DeleteRefreshTokensAsync(_context, CancellationToken.None);

            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Never);
        }

        [Fact]
        public async Task DeletePasswordResetTokensAsync_Should_Delete_Used_Tokens()
        {
            _context.PasswordResetTokens.Add(new PasswordResetToken
            {
                CustomerId = Guid.NewGuid(),
                TokenHash = "used-token",
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                IsUsed = true
            });
            await _context.SaveChangesAsync();

            await _cleanupService.DeletePasswordResetTokensAsync(_context, CancellationToken.None);
            await _context.SaveChangesAsync();

            Assert.Empty(await _context.PasswordResetTokens.ToListAsync());
        }

        [Fact]
        public async Task DeletePasswordResetTokensAsync_Should_Delete_Expired_Tokens()
        {
            _context.PasswordResetTokens.Add(new PasswordResetToken
            {
                CustomerId = Guid.NewGuid(),
                TokenHash = "expired-token",
                ExpiresAt = DateTime.UtcNow.AddDays(-1),
                IsUsed = false
            });
            await _context.SaveChangesAsync();

            await _cleanupService.DeletePasswordResetTokensAsync(_context, CancellationToken.None);
            await _context.SaveChangesAsync();

            Assert.Empty(await _context.PasswordResetTokens.ToListAsync());
        }

        [Fact]
        public async Task DeletePasswordResetTokensAsync_Should_Keep_Valid_Tokens()
        {
            _context.PasswordResetTokens.Add(new PasswordResetToken
            {
                CustomerId = Guid.NewGuid(),
                TokenHash = "valid-token",
                ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                IsUsed = false
            });
            await _context.SaveChangesAsync();

            await _cleanupService.DeletePasswordResetTokensAsync(_context, CancellationToken.None);
            await _context.SaveChangesAsync();

            Assert.Single(await _context.PasswordResetTokens.ToListAsync());
        }

        [Fact]
        public async Task DeletePasswordResetTokensAsync_Should_Log_When_Tokens_Deleted()
        {
            _context.PasswordResetTokens.Add(new PasswordResetToken
            {
                CustomerId = Guid.NewGuid(),
                TokenHash = "used-token",
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                IsUsed = true
            });
            await _context.SaveChangesAsync();

            await _cleanupService.DeletePasswordResetTokensAsync(_context, CancellationToken.None);

            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task DeletePasswordResetTokensAsync_Should_Not_Log_When_No_Tokens_Deleted()
        {
            await _cleanupService.DeletePasswordResetTokensAsync(_context, CancellationToken.None);

            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Never);
        }

        [Fact]
        public async Task DeletePendingRegistrationsAsync_Should_Delete_Expired_Registrations()
        {
            _context.PendingRegistrations.Add(new PendingRegistration
            {
                Name = "Test",
                Email = "test@test.com",
                PasswordHash = "hash",
                CodeHash = "code-hash",
                ExpiresAt = DateTime.UtcNow.AddMinutes(-1)
            });
            await _context.SaveChangesAsync();

            await _cleanupService.DeletePendingRegistrationsAsync(_context, CancellationToken.None);
            await _context.SaveChangesAsync();

            Assert.Empty(await _context.PendingRegistrations.ToListAsync());
        }

        [Fact]
        public async Task DeletePendingRegistrationsAsync_Should_Keep_Valid_Registrations()
        {
            _context.PendingRegistrations.Add(new PendingRegistration
            {
                Name = "Test",
                Email = "test@test.com",
                PasswordHash = "hash",
                CodeHash = "code-hash",
                ExpiresAt = DateTime.UtcNow.AddMinutes(15)
            });
            await _context.SaveChangesAsync();

            await _cleanupService.DeletePendingRegistrationsAsync(_context, CancellationToken.None);
            await _context.SaveChangesAsync();

            Assert.Single(await _context.PendingRegistrations.ToListAsync());
        }

        [Fact]
        public async Task DeletePendingRegistrationsAsync_Should_Log_When_Deleted()
        {
            _context.PendingRegistrations.Add(new PendingRegistration
            {
                Name = "Test",
                Email = "test@test.com",
                PasswordHash = "hash",
                CodeHash = "code-hash",
                ExpiresAt = DateTime.UtcNow.AddMinutes(-1)
            });
            await _context.SaveChangesAsync();

            await _cleanupService.DeletePendingRegistrationsAsync(_context, CancellationToken.None);

            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task DeletePendingRegistrationsAsync_Should_Not_Log_When_None_Deleted()
        {
            await _cleanupService.DeletePendingRegistrationsAsync(_context, CancellationToken.None);

            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Never);
        }

        [Fact]
        public async Task DeleteExpiredFlashSalesAsync_Should_Delete_Expired_Flash_Sales()
        {
            _context.FlashSales.Add(new WebApplication2.Models.Orders.FlashSale
            {
                DiscountPercentage = 50,
                StartsAt = DateTime.UtcNow.AddDays(-10),
                EndsAt = DateTime.UtcNow.AddDays(-1),
                IsActive = true
            });
            await _context.SaveChangesAsync();

            await _cleanupService.DeleteExpiredFlashSalesAsync(_context, CancellationToken.None);
            await _context.SaveChangesAsync();

            Assert.Empty(await _context.FlashSales.ToListAsync());
        }

        [Fact]
        public async Task DeleteExpiredFlashSalesAsync_Should_Keep_Active_Flash_Sales()
        {
            _context.FlashSales.Add(new WebApplication2.Models.Orders.FlashSale
            {
                DiscountPercentage = 50,
                StartsAt = DateTime.UtcNow.AddDays(-1),
                EndsAt = DateTime.UtcNow.AddDays(1),
                IsActive = true
            });
            await _context.SaveChangesAsync();

            await _cleanupService.DeleteExpiredFlashSalesAsync(_context, CancellationToken.None);
            await _context.SaveChangesAsync();

            Assert.Single(await _context.FlashSales.ToListAsync());
        }

        [Fact]
        public async Task DeleteExpiredFlashSalesAsync_Should_Log_When_Deleted()
        {
            _context.FlashSales.Add(new WebApplication2.Models.Orders.FlashSale
            {
                DiscountPercentage = 50,
                StartsAt = DateTime.UtcNow.AddDays(-10),
                EndsAt = DateTime.UtcNow.AddDays(-1),
                IsActive = true
            });
            await _context.SaveChangesAsync();

            await _cleanupService.DeleteExpiredFlashSalesAsync(_context, CancellationToken.None);

            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task DeleteExpiredFlashSalesAsync_Should_Not_Log_When_None_Deleted()
        {
            await _cleanupService.DeleteExpiredFlashSalesAsync(_context, CancellationToken.None);

            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Never);
        }

        [Fact]
        public async Task DeleteExpiredCouponsAsync_Should_Delete_Expired_Coupons()
        {
            _context.Coupons.Add(new WebApplication2.Models.Orders.Coupon
            {
                Code = "EXPIRED",
                DiscountType = 0,
                DiscountValue = 10,
                ExpiryDate = DateTime.UtcNow.AddDays(-1),
                IsActive = true
            });
            await _context.SaveChangesAsync();

            await _cleanupService.DeleteExpiredCouponsAsync(_context, CancellationToken.None);
            await _context.SaveChangesAsync();

            Assert.Empty(await _context.Coupons.ToListAsync());
        }

        [Fact]
        public async Task DeleteExpiredCouponsAsync_Should_Delete_Used_Coupons()
        {
            _context.Coupons.Add(new WebApplication2.Models.Orders.Coupon
            {
                Code = "USED",
                DiscountType = 0,
                DiscountValue = 10,
                UsageLimit = 100,
                TimesUsed = 100,
                IsActive = true
            });
            await _context.SaveChangesAsync();

            await _cleanupService.DeleteExpiredCouponsAsync(_context, CancellationToken.None);
            await _context.SaveChangesAsync();

            Assert.Empty(await _context.Coupons.ToListAsync());
        }

        [Fact]
        public async Task DeleteExpiredCouponsAsync_Should_Keep_Valid_Coupons()
        {
            _context.Coupons.Add(new WebApplication2.Models.Orders.Coupon
            {
                Code = "VALID",
                DiscountType = 0,
                DiscountValue = 10,
                ExpiryDate = DateTime.UtcNow.AddDays(30),
                IsActive = true
            });
            await _context.SaveChangesAsync();

            await _cleanupService.DeleteExpiredCouponsAsync(_context, CancellationToken.None);
            await _context.SaveChangesAsync();

            Assert.Single(await _context.Coupons.ToListAsync());
        }

        [Fact]
        public async Task DeleteExpiredCouponsAsync_Should_Keep_Coupons_With_No_Expiry_And_No_Usage_Limit()
        {
            _context.Coupons.Add(new WebApplication2.Models.Orders.Coupon
            {
                Code = "NO-LIMIT",
                DiscountType = 0,
                DiscountValue = 10,
                IsActive = true
            });
            await _context.SaveChangesAsync();

            await _cleanupService.DeleteExpiredCouponsAsync(_context, CancellationToken.None);
            await _context.SaveChangesAsync();

            Assert.Single(await _context.Coupons.ToListAsync());
        }

        [Fact]
        public async Task DeleteExpiredCouponsAsync_Should_Log_When_Deleted()
        {
            _context.Coupons.Add(new WebApplication2.Models.Orders.Coupon
            {
                Code = "EXPIRED",
                DiscountType = 0,
                DiscountValue = 10,
                ExpiryDate = DateTime.UtcNow.AddDays(-1),
                IsActive = true
            });
            await _context.SaveChangesAsync();

            await _cleanupService.DeleteExpiredCouponsAsync(_context, CancellationToken.None);

            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task DeleteExpiredCouponsAsync_Should_Not_Log_When_None_Deleted()
        {
            await _cleanupService.DeleteExpiredCouponsAsync(_context, CancellationToken.None);

            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.IsAny<It.IsAnyType>(),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.Never);
        }
    }
}