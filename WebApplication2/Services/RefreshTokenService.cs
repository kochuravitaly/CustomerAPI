using WebApplication2.Data;
using WebApplication2.Models;

namespace WebApplication2.Services
{
    public class RefreshTokenService : IRefreshTokenService
    {
        private readonly AppDbContext _context;
        private readonly ISecureTokenGeneratorService _secureTokenGenerator;

        public RefreshTokenService(AppDbContext context, ISecureTokenGeneratorService secureTokenGenerator)
        {
            _context = context;
            _secureTokenGenerator = secureTokenGenerator;
        }

        public async Task SaveRefreshTokenAsync(string refreshToken, Guid customerId)
        {
            var refreshTokenEntity = new RefreshToken
            {
                TokenHash = _secureTokenGenerator.HashToken(refreshToken),
                CustomerId = customerId,
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                IsRevoked = false
            };

            _context.RefreshTokens.Add(refreshTokenEntity);

            await _context.SaveChangesAsync();
        }
    }
}
