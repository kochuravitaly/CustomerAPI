using WebApplication2.Data;
using WebApplication2.Models.Auth;
using WebApplication2.Services.Auth.Interfaces;

namespace WebApplication2.Services.Auth.Services
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

        public async Task SaveRefreshTokenAsync(string token, Guid customerId, int? sessionId = null, int expiryDays = 30)
        {
            var refreshToken = new RefreshToken
            {
                TokenHash = _secureTokenGenerator.HashToken(token),
                ExpiresAt = DateTime.UtcNow.AddDays(expiryDays),
                IsRevoked = false,
                CustomerId = customerId,
                SessionId = sessionId
            };

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();
        }
    }
}