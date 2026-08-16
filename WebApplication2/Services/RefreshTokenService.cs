using Microsoft.EntityFrameworkCore;
using WebApplication2.Data;
using WebApplication2.DTOs;
using WebApplication2.Models;

namespace WebApplication2.Services
{
    public class RefreshTokenService : IRefreshTokenService
    {
        private readonly AppDbContext _context;
        private readonly ITokenService _tokenService;
        private readonly ISecureTokenGenerator _secureTokenGenerator;

        public RefreshTokenService(AppDbContext context, ITokenService tokenService, ISecureTokenGenerator secureTokenGenerator)
        {
            _context = context;
            _tokenService = tokenService;
            _secureTokenGenerator = secureTokenGenerator;
        }

        public string CreateRefreshToken()
        {
            return _secureTokenGenerator.CreateToken();
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
            return _secureTokenGenerator.HashToken(refreshToken);
        }
    }
}
