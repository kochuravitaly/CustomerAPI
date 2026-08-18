using WebApplication2.DTOs;

namespace WebApplication2.Services
{
    public interface IAuthService
    {
        Task<bool> RegisterAsync(RegisterCustomerDto dto);
        Task<TokenResponseDto?> LoginAsync(LoginDto dto);
        Task<bool> VerifyEmailAsync(VerifyEmailDto dto);
        Task<bool> LogoutAsync(string refreshToken);
        Task<TokenResponseDto?> RefreshTokenAsync(string refreshToken);
        Task<string?> ForgotPasswordAsync(EmailDto dto);
        Task<bool> ResetPasswordAsync(ResetPasswordDto dto);
        Task<bool> ResendVerificationCodeAsync(EmailDto dto);
    }
}
