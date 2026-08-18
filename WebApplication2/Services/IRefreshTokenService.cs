using WebApplication2.DTOs;

namespace WebApplication2.Services
{
    public interface IRefreshTokenService
    {
        Task SaveRefreshTokenAsync(string refreshToken, Guid customerId);
    }
}
