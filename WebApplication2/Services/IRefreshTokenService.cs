using WebApplication2.DTOs;

namespace WebApplication2.Services
{
    public interface IRefreshTokenService
    {
        string CreateRefreshToken();
        Task<TokenResponseDto?> RefreshTokenAsync(string refreshToken);
        Task SaveRefreshTokenAsync(string refreshToken, Guid customerId);
        string HashRefreshToken(string refreshToken);
    }
}
