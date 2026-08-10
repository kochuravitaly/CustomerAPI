using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Moq;
using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using WebApplication2.Data;
using WebApplication2.Models;
using WebApplication2.Services;

namespace WebApplication2.Tests.Services
{
    public class RefreshTokenServiceTests
    {
        private readonly Mock<ITokenService> _tokenServiceMock;

        private readonly AppDbContext _context;
        private readonly RefreshTokenService _refreshTokenService;

        public RefreshTokenServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _context = new AppDbContext(options);

            _tokenServiceMock = new Mock<ITokenService>();

            _refreshTokenService = new RefreshTokenService(
                _context,
                _tokenServiceMock.Object
            );
        }

        private async Task<(Customer Customer, string RefreshToken, RefreshToken StoredToken)>
        CreateStoredRefreshTokenAsync(DateTime? expiresAt = null, bool isRevoked = false)
        {
            expiresAt ??= DateTime.UtcNow.AddDays(30);

            var customer = new Customer
            {
                Id = Guid.NewGuid(),
                Email = "test@test.com",
                Role = new Role
                {
                    Name = "User"
                }
            };

            var refreshToken = _refreshTokenService.CreateRefreshToken();

            var storedToken = new RefreshToken
            {
                TokenHash = _refreshTokenService.HashRefreshToken(refreshToken),
                CustomerId = customer.Id,
                Customer = customer,
                ExpiresAt = (DateTime)expiresAt,
                IsRevoked = isRevoked
            };

            _context.Customers.Add(customer);
            _context.RefreshTokens.Add(storedToken);

            await _context.SaveChangesAsync();

            return (customer, refreshToken, storedToken);
        }

        [Fact]
        public void CreateRefreshToken_Should_Return_Refresh_Token()
        {
            var refreshToken = _refreshTokenService.CreateRefreshToken();

            Assert.NotEmpty(refreshToken);

            var bytes = Convert.FromBase64String(refreshToken);

            Assert.Equal(64, bytes.Length);
        }

        [Fact]
        public void CreateRefreshToken_Should_Return_Different_Tokens()
        {
            var token1 = _refreshTokenService.CreateRefreshToken();
            var token2 = _refreshTokenService.CreateRefreshToken();

            Assert.NotEqual(token1, token2);
        }

        [Fact]
        public async Task SaveRefreshTokenAsync_Should_Save_Refresh_Token_To_Database()
        {
            var customerId = Guid.NewGuid();
            var refreshToken = _refreshTokenService.CreateRefreshToken();

            await _refreshTokenService.SaveRefreshTokenAsync(refreshToken,customerId);

            var savedToken = await _context.RefreshTokens
                .SingleAsync(r => r.CustomerId == customerId);

            Assert.Equal(
                _refreshTokenService.HashRefreshToken(refreshToken),
                savedToken.TokenHash);

            Assert.Equal(customerId, savedToken.CustomerId);

            Assert.False(savedToken.IsRevoked);

            Assert.True(savedToken.ExpiresAt > DateTime.UtcNow);
        }

        [Fact]
        public void HashRefreshToken_Should_Return_RefreshTokenHash()
        {
            var refreshToken = "fake-refresh-token";

            var hash = _refreshTokenService.HashRefreshToken(refreshToken);

            Assert.NotEmpty(hash);

            using var sha256 = SHA256.Create();

            var expectedBytes = sha256.ComputeHash(
                Encoding.UTF8.GetBytes(refreshToken));

            var expectedHash = Convert.ToBase64String(expectedBytes);

            Assert.Equal(expectedHash, hash);
        }

        [Fact]
        public async Task RefreshTokenAsync_Should_Return_New_Tokens_When_Token_Is_Valid_And_Save_New_Refresh_Token_To_Database()
        {
            var data = await CreateStoredRefreshTokenAsync();

            _tokenServiceMock
                .Setup(x => x.CreateToken(It.IsAny<Customer>()))
                .Returns("fake-access-token");

            var result = await _refreshTokenService.RefreshTokenAsync(
                data.RefreshToken);

            Assert.NotNull(result);

            Assert.Equal(
                "fake-access-token",
                result.Token);

            Assert.NotEmpty(result.RefreshToken);

            Assert.NotEqual(
                data.RefreshToken,
                result.RefreshToken);

            Assert.True(data.StoredToken.IsRevoked);

            _tokenServiceMock.Verify(
                x => x.CreateToken(data.Customer),
                Times.Once);

            var newStoredRefreshToken = await _context.RefreshTokens
                .SingleAsync(r => r.TokenHash == _refreshTokenService.HashRefreshToken(result.RefreshToken));

            Assert.Equal(data.Customer.Id, newStoredRefreshToken.CustomerId);
            Assert.False(newStoredRefreshToken.IsRevoked);
            Assert.True(newStoredRefreshToken.ExpiresAt > DateTime.UtcNow);
        }

        [Fact]
        public async Task RefreshTokenAsync_Should_Return_Null_When_Refresh_Token_Does_Not_Exist()
        {
            var result = await _refreshTokenService.RefreshTokenAsync("non-existent-refresh-token");

            Assert.Null(result);

            _tokenServiceMock.Verify(
                x => x.CreateToken(It.IsAny<Customer>()),
                Times.Never);

            Assert.Empty(await _context.RefreshTokens.ToListAsync());
        }

        [Theory]
        [InlineData(true, false)]
        [InlineData(false, true)]
        public async Task RefreshTokenAsync_Should_Return_Null_When_Token_Is_Invalid(
            bool isExpired,
            bool isRevoked)
        {
            var expiresAt = isExpired
                ? DateTime.UtcNow.AddDays(-1)
                : DateTime.UtcNow.AddDays(30);

            var data = await CreateStoredRefreshTokenAsync(
                expiresAt,
                isRevoked);

            var result = await _refreshTokenService.RefreshTokenAsync(
                data.RefreshToken);

            Assert.Null(result);

            _tokenServiceMock.Verify(
                x => x.CreateToken(It.IsAny<Customer>()),
                Times.Never);

            Assert.Single(await _context.RefreshTokens.ToListAsync());
        }
    }
}
