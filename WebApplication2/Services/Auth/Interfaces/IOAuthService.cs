using WebApplication2.DTOs.Auth;

namespace WebApplication2.Services.Auth.Interfaces
{
    public interface IOAuthService
    {
        Task<TokenResponseDto?> LoginWithYandexAsync(string code, bool rememberMe = false);
    }
}