using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using WebApplication2.Data;
using WebApplication2.DTOs;
using WebApplication2.Models;

namespace WebApplication2.Services
{
    public class RefreshTokenService : IRefreshTokenService
    {
        private readonly AppDbContext _context;
        private readonly ITokenService _tokenService;

        public RefreshTokenService(AppDbContext context, ITokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        public string CreateRefreshToken()
        {
            var randomBytes = new byte[64];

            using var rng = RandomNumberGenerator.Create();

            rng.GetBytes(randomBytes);

            return Convert.ToBase64String(randomBytes);
        }

        public async Task SaveRefreshTokenAsync(string refreshToken, Guid customerId)
        {
            var refreshTokenEntity = new RefreshToken
            {
                TokenHash = HashRefreshToken(refreshToken),
                CustomerId = customerId,
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                IsRevoked = false
            };

            _context.RefreshTokens.Add(refreshTokenEntity);

            await _context.SaveChangesAsync();
        }

        public async Task<TokenResponseDto?> RefreshTokenAsync(string refreshToken)
        {
            var storedToken = await _context.RefreshTokens
                .Include(r => r.Customer)
                .ThenInclude(c => c.Role)
                .SingleOrDefaultAsync(r => r.TokenHash == HashRefreshToken(refreshToken));

            if (storedToken == null)
                return null;

            if (storedToken.ExpiresAt < DateTime.UtcNow)
                return null;

            if (storedToken.IsRevoked)
                return null;

            storedToken.IsRevoked = true;

            await _context.SaveChangesAsync();
            
            var newAccessToken = _tokenService.CreateToken(storedToken.Customer);

            var newRefreshToken = CreateRefreshToken();

            await SaveRefreshTokenAsync(newRefreshToken, storedToken.CustomerId);

            return new TokenResponseDto
            {
                Token = newAccessToken,
                RefreshToken = newRefreshToken
            };
        }

        public string HashRefreshToken(string refreshToken)
        {
            using var sha256 = SHA256.Create();

            var bytes = Encoding.UTF8.GetBytes(refreshToken);

            var hash = sha256.ComputeHash(bytes);

            return Convert.ToBase64String(hash);
        }
    }
}
