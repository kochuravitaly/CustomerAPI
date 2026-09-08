using WebApplication2.Models.Auth;

namespace WebApplication2.Services.Auth.Interfaces
{
    public interface IRefreshTokenService
    {
        Task SaveRefreshTokenAsync(string token, Guid customerId, int? sessionId = null, int expiryDays = 30);
    }
}